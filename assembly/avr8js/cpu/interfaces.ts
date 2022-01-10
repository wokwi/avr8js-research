// DG Removed '| void' for assembly script type safety
export type CPUMemoryHook = (value: u8, oldValue: u8, addr: u16, mask: u8) => boolean;

// DG Extends map to fix missing dictionary support
export class CPUMemoryHooks extends Map<u32, CPUMemoryHook> {
}

export type CPUMemoryReadHook = (addr: u16) => u8;

// DG Extends map to fix missing dictionary support
export class CPUMemoryReadHooks extends Map<u32, CPUMemoryReadHook> {
}

export interface AVRInterruptConfig {
    address: u8;
    enableRegister: u16;
    enableMask: u8;
    flagRegister: u16;
    flagMask: u8;
    // DG Removed optional due missing assembly script support
    constant: boolean;
    inverseFlag: boolean;
}

export type AVRClockEventCallback = () => void;