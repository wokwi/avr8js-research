/**
 * AVR 8 CPU data structures
 * Part of AVR8js
 *
 * Copyright (C) 2019, Uri Shaked
 */

const registerSpace: u64 = 0x100;

// // eslint-disable-next-line @typescript-eslint/interface-name-prefix
// export interface ICPU {
//     readonly data: Uint8Array;
//     readonly dataView: DataView;
//     readonly progMem: Uint16Array;
//     readonly progBytes: Uint8Array;
//
//     /**
//      * Whether the program counter (PC) can address 22 bits (the default is 16)
//      */
//     readonly pc22Bits: bool;
//
//     /**
//      * Program counter
//      */
//     pc: u32;
//
//     /**
//      * Clock cycle counter
//      */
//     cycles: u64;
//
//     readData(addr: u16): u8;
//     writeData(addr: u16, value: u8): void;
// }

//removed '| void' for assembly type safety
export type CPUMemoryHook = (value: u8, oldValue: u8, addr: u16) => boolean;

export class CPUMemoryHooks {
    [key: number]: CPUMemoryHook;
}

export type CPUMemoryReadHook = (addr: u16) => u8;

export class CPUMemoryReadHooks {
    [key: number]: CPUMemoryReadHook;
}

export class CPU {

    readonly data: Uint8Array = new Uint8Array(<i32>(this.sramBytes + registerSpace));
    readonly data16: Uint16Array = Uint16Array.wrap(this.data.buffer);
    readonly dataView: DataView = new DataView(this.data.buffer);
    readonly progBytes: Uint8Array;
    readonly readHooks: CPUMemoryReadHooks = new CPUMemoryReadHooks()
    readonly writeHooks: CPUMemoryHooks = new CPUMemoryHooks()
    readonly pc22Bits: bool = this.progBytes.length > 0x20000;

    // readonly data: Uint8Array = new Uint8Array(<i32>(this.sramBytes + registerSpace));
    // readonly dataView: DataView = new DataView(this.data.buffer);
    // public readonly progMem: Uint16Array;
    // readonly progBytes: Uint8Array;
    // readonly pc22Bits: bool;

    pc: u32 = 0;
    cycles: u64 = 0;

    // constructor(progMem: Uint16Array, private sramBytes: u64 = 8192) {
    //     this.progMem = progMem;
    //     this.progBytes = Uint8Array.wrap(this.progMem.buffer);
    //     this.pc22Bits = this.progBytes.length > 0x20000;
    //     this.reset();
    // }

    constructor(public progMem: Uint16Array, private sramBytes: u64 = 8192) {
        this.progBytes = Uint8Array.wrap(this.progMem.buffer);
        this.reset();
    }

    reset(): void {
        this.data.fill(0);
        this.SP = <u16>this.data.length - 1;
    }

    readData(addr: u16): u8 {
        return this.data[addr];
    }

    writeData(addr: u16, value: u8): void {
        this.data[addr] = value;
    }

    get SP(): u16 {
        return this.dataView.getUint16(93, true);
    }

    set SP(value: u16) {
        this.dataView.setUint16(93, value, true);
    }

    get SREG(): u8 {
        return this.data[95];
    }

    get interruptsEnabled(): bool {
        return !!(this.SREG & 0x80);
    }
}
