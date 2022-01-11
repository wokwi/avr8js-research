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

export class AVRInterruptConfigImpl implements AVRInterruptConfig {
    private readonly _address: u8;
    private readonly _enableRegister: u16;
    private readonly _enableMask: u8;
    private readonly _flagRegister: u16;
    private readonly _flagMask: u8;
    private readonly _constant: boolean;
    private readonly _inverseFlag: boolean;


    constructor(address: u8, enableRegister: u16, enableMask: u8, flagRegister: u16, flagMask: u8, constant: boolean, inverseFlag: boolean) {
        this._address = address;
        this._enableRegister = enableRegister;
        this._enableMask = enableMask;
        this._flagRegister = flagRegister;
        this._flagMask = flagMask;
        this._constant = constant;
        this._inverseFlag = inverseFlag;
    }


    get address(): u8 {
        return this._address;
    }

    get enableRegister(): u16 {
        return this._enableRegister;
    }

    get enableMask(): u8 {
        return this._enableMask;
    }

    get flagRegister(): u16 {
        return this._flagRegister;
    }

    get flagMask(): u8 {
        return this._flagMask;
    }

    get constant(): boolean {
        return this._constant;
    }

    get inverseFlag(): boolean {
        return this._inverseFlag;
    }
}