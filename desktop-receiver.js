const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { spawn } = require("child_process");
const { io } = require("socket.io-client");

const certPath = path.join(__dirname, "certs", "mobile-ca.crt");
if (!fs.existsSync(certPath)) {
  console.error("HTTPS certificate not found. Run npm run setup:https first.");
  process.exit(1);
}

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => terminal.question(question, resolve));
}

function getServerUrl() {
  const address = process.env.PC_WIFI_IP;
  if (!address) {
    throw new Error("Set PC_WIFI_IP to this PC's Wi-Fi IPv4 address before starting.");
  }
  return `https://${address}:3443`;
}

async function main() {
  const serverUrl = getServerUrl();
  const roomId = (await ask("Enter the room code shown on the PC page: ")).trim().toUpperCase();
  if (!/^[A-Z0-9]{6,12}$/.test(roomId)) {
    throw new Error("Room code must contain 6 to 12 letters or numbers.");
  }

  const keyboard = spawn("powershell.exe", [
    "-NoProfile",
    "-STA",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    path.join(__dirname, "type-text.ps1")
  ], { stdio: ["pipe", "pipe", "inherit"], windowsHide: true });

  let keyboardReady = false;
  let markKeyboardReady;
  let failKeyboardReady;
  const keyboardReadyPromise = new Promise((resolve, reject) => {
    markKeyboardReady = resolve;
    failKeyboardReady = reject;
  });
  let keyboardOutputBuffer = "";
  keyboard.stdout.setEncoding("utf8");
  keyboard.stdout.on("data", (chunk) => {
    const lines = (keyboardOutputBuffer + chunk).split(/\r?\n/);
    keyboardOutputBuffer = lines.pop();
    for (const line of lines) {
      if (line === "READY") {
        keyboardReady = true;
        markKeyboardReady();
      }
      if (line === "ERROR") console.error("Windows could not type the received text.");
    }
  });

  keyboard.on("error", (error) => {
    failKeyboardReady(error);
  });
  keyboard.on("exit", (code) => {
    if (!keyboardReady) {
      failKeyboardReady(new Error(`Windows keyboard helper exited with code ${code}.`));
    }
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Windows keyboard helper did not start in time.")), 10000);
    keyboardReadyPromise.then(
      () => {
        clearTimeout(timer);
        resolve();
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
  console.log("Windows keyboard helper ready.");

  const socket = io(serverUrl, {
    ca: fs.readFileSync(certPath),
    transports: ["websocket"],
    reconnection: true
  });

  let armed = false;
  let armTimer;
  let shuttingDown = false;

  socket.on("connect", () => {
    socket.emit("join-device", { roomId, role: "desktop" }, (result) => {
      if (!result?.ok) {
        console.error(result?.error || "Could not join the room.");
        return;
      }
      armed = false;
      console.log(`Desktop helper connected to room ${result.roomId}.`);
      console.log("Commands: arm (type into the focused app), disarm, q (quit).");
    });
  });

  socket.on("connect_error", (error) => {
    console.error(`Cannot connect to the PC server: ${error.message}`);
  });
  socket.on("disconnect", () => {
    armed = false;
    clearTimeout(armTimer);
    armTimer = undefined;
    if (socket.connected) socket.emit("desktop-typing-state", { roomId, armed: false });
    console.log("Disconnected. Typing is disarmed while reconnecting.");
  });

  socket.on("text-update", ({ text, final }) => {
    if (!final || !armed || !keyboardReady || typeof text !== "string") return;
    keyboard.stdin.write(`${JSON.stringify({ text: text.slice(0, 5000) })}\n`);
  });

  terminal.on("line", (input) => {
    const command = input.trim().toLowerCase();
    if (command === "arm") {
      if (armTimer) {
        console.log("An arming countdown is already running.");
        return;
      }
      console.log("Focus the target app and click where text should go within 5 seconds.");
      armTimer = setTimeout(() => {
        armTimer = undefined;
        if (!socket.connected) {
          console.log("Not connected; typing remains disarmed.");
          return;
        }
        armed = true;
        socket.emit("desktop-typing-state", { roomId, armed: true });
        console.log("Typing is ARMED. Incoming room text will be typed into the focused app. Type disarm to stop.");
      }, 5000);
    } else if (command === "disarm") {
      clearTimeout(armTimer);
      armTimer = undefined;
      armed = false;
      if (socket.connected) socket.emit("desktop-typing-state", { roomId, armed: false });
      console.log("Typing disarmed.");
    } else if (command === "q" || command === "quit") {
      shutdown();
    } else {
      console.log("Use arm, disarm, or q.");
    }
  });

  function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    armed = false;
    clearTimeout(armTimer);
    armTimer = undefined;
    socket.disconnect();
    keyboard.stdin.end();
    terminal.close();
    keyboard.kill();
  }

  terminal.on("close", shutdown);
  process.on("SIGINT", shutdown);
  process.on("exit", () => {
    armed = false;
    socket.disconnect();
    keyboard.kill();
  });
}

main().catch((error) => {
  console.error(error.message);
  terminal.close();
  process.exitCode = 1;
});
