$ErrorActionPreference = "Stop"

Add-Type -TypeDefinition @"
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;

public static class UnicodeKeyboard {
    [StructLayout(LayoutKind.Sequential)]
    private struct KeyboardInput {
        public ushort VirtualKey;
        public ushort ScanCode;
        public uint Flags;
        public uint Time;
        public IntPtr ExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct MouseInput {
        public int X;
        public int Y;
        public uint MouseData;
        public uint Flags;
        public uint Time;
        public IntPtr ExtraInfo;
    }

    [StructLayout(LayoutKind.Explicit)]
    private struct InputUnion {
        [FieldOffset(0)] public KeyboardInput Keyboard;
        [FieldOffset(0)] public MouseInput Mouse;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct Input {
        public uint Type;
        public InputUnion Data;
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint SendInput(uint count, Input[] inputs, int size);

    public static void Type(string text) {
        foreach (char character in text) {
            Input[] inputs = new Input[2];
            inputs[0].Type = 1;
            inputs[0].Data.Keyboard.ScanCode = character;
            inputs[0].Data.Keyboard.Flags = 0x0004;
            inputs[1].Type = 1;
            inputs[1].Data.Keyboard.ScanCode = character;
            inputs[1].Data.Keyboard.Flags = 0x0006;

            if (SendInput(2, inputs, Marshal.SizeOf(typeof(Input))) != 2) {
                throw new Win32Exception(Marshal.GetLastWin32Error());
            }
        }
    }
}
"@

[Console]::WriteLine("READY")
while ($null -ne ($line = [Console]::In.ReadLine())) {
    try {
        $message = ConvertFrom-Json -InputObject $line
        [UnicodeKeyboard]::Type([string]$message.text)
        [Console]::WriteLine("OK")
    } catch {
        [Console]::Error.WriteLine($_.Exception.Message)
        [Console]::WriteLine("ERROR")
    }
}
