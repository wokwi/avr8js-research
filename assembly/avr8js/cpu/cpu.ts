/**
 * AVR 8 CPU data structures
 * Part of AVR8js
 *
 * Copyright (C) 2019, Uri Shaked
 *
 * v0.18.2 - Modified by Dario Götze
 */

import {AVRIOPort} from '../peripherals/gpio';
import {avrInterrupt} from './interrupt';
import {AVRInterruptConfig, CPUMemoryHooks, CPUMemoryReadHooks} from "./interfaces";
import {AVRClockEventCallback} from "../../../shared/avr8js/cpu/interfaces";

const registerSpace = 0x100;

interface AVRClockEventEntry {
    cycles: u64;
    callback: AVRClockEventCallback;
    next: AVRClockEventEntry | null;
}

class AVRClockEventEntryImpl implements AVRClockEventEntry {
    private readonly _callback: AVRClockEventCallback;
    private readonly _cycles: u64;
    private _next: AVRClockEventEntry | null;

    constructor(cycles: u64, callback: AVRClockEventCallback, next: AVRClockEventEntry | null = null) {
        this._cycles = cycles;
        this._callback = callback;
        this._next = next;
    }

    get callback(): AVRClockEventCallback {
        return this._callback;
    }

    get cycles(): u64 {
        return this._cycles;
    }

    get next(): AVRClockEventEntry | null {
        return this._next
    }

    set next(value: AVRClockEventEntry | null) {
        this._next = value
    }
}

export class CPU {
    // @ts-ignore
    readonly data: Uint8Array = new Uint8Array(<i32>(this.sramBytes + registerSpace));
    readonly data16: Uint16Array = Uint16Array.wrap(this.data.buffer);
    readonly dataView: DataView = new DataView(this.data.buffer);
    // @ts-ignore
    readonly progBytes: Uint8Array = Uint8Array.wrap(this.progMem.buffer);
    readonly readHooks: CPUMemoryReadHooks = new CPUMemoryReadHooks();
    readonly writeHooks: CPUMemoryHooks = new CPUMemoryHooks();
    private readonly pendingInterrupts: AVRInterruptConfig[] = [];
    private nextClockEvent: AVRClockEventEntry | null = null;
    private readonly clockEventPool: AVRClockEventEntry[] = []; // helps avoid garbage collection

    /**
     * Whether the program counter (PC) can address 22 bits (the default is 16)
     */
    readonly pc22Bits: boolean = this.progBytes.length > 0x20000;

    readonly gpioPorts: Set<AVRIOPort> = new Set<AVRIOPort>();
    readonly gpioByPort: AVRIOPort[] = [];

    /**
     * This function is called by the WDR instruction. The Watchdog peripheral attaches
     * to it to listen for WDR (watchdog reset).
     */
    onWatchdogReset: () => void = () => {
        /* empty by default */
    };

    /**
     * Program counter
     */
    pc: u32 = 0;

    /**
     * Clock cycle counter
     */
    cycles: u64 = 0;

    nextInterrupt: i16 = -1;

    constructor(public progMem: Uint16Array, private sramBytes: u64 = 8192) {
        this.reset();
    }

    reset(): void {
        this.data.fill(0);
        this.SP = <u16>this.data.length - 1;
        this.pc = 0;
        this.pendingInterrupts.splice(0, this.pendingInterrupts.length);
        this.nextInterrupt = -1;
        this.nextClockEvent = null;
    }

    // DG Modified to use Map
    readData(addr: u16): u8 {
        if (addr >= 32 && this.readHooks.has(addr)) {
            return this.readHooks.get(addr)(addr);
        }
        return this.data[addr];
    }

    // DG Modified to use Map
    writeData(addr: u16, value: u8, mask: u8 = 0xff): void {
        if (this.writeHooks.has(addr)) {
            const hook = this.writeHooks.get(addr);
            if (hook(value, this.data[addr], addr, mask)) {
                return;
            }
        }
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

    get interruptsEnabled(): boolean {
        return !!(this.SREG & 0x80);
    }

    // TODO DG Check pendingInterrupts handling. Cast from i32 to i16.
    private updateNextInterrupt(): void {
        this.nextInterrupt = i16(this.pendingInterrupts.findIndex((item) => !!item));
    }

    setInterruptFlag(interrupt: AVRInterruptConfig): void {
        if (interrupt.inverseFlag) {
            this.data[interrupt.flagRegister] &= ~interrupt.flagMask;
        } else {
            this.data[interrupt.flagRegister] |= interrupt.flagMask;
        }
        if (this.data[interrupt.enableRegister] & interrupt.enableMask) {
            this.queueInterrupt(interrupt);
        }
    }

    updateInterruptEnable(interrupt: AVRInterruptConfig, registerValue: u8): void {
        if (registerValue & interrupt.enableMask) {
            if (this.data[interrupt.flagRegister] & interrupt.flagMask) {
                this.queueInterrupt(interrupt);
            }
        } else {
            this.clearInterrupt(interrupt, false);
        }
    }

    queueInterrupt(interrupt: AVRInterruptConfig): void {
        this.pendingInterrupts[interrupt.address] = interrupt;
        this.updateNextInterrupt();
    }

    // TODO check correctness. DG Replaced delete with splice.
    clearInterrupt(interruptConfig: AVRInterruptConfig, clearFlag: boolean = true): void {
        const index = this.pendingInterrupts.indexOf(interruptConfig, 0);
        if (index > -1) this.pendingInterrupts.splice(index, 1);
        // delete this.pendingInterrupts[interruptConfig.address];
        if (clearFlag) {
            this.data[interruptConfig.flagRegister] &= ~interruptConfig.flagMask;
        }
        this.updateNextInterrupt();
    }

    clearInterruptByFlag(interrupt: AVRInterruptConfig, registerValue: u8): void {
        if (registerValue & interrupt.flagMask) {
            this.data[interrupt.flagRegister] &= ~interrupt.flagMask;
            this.clearInterrupt(interrupt);
        }
    }

    addClockEvent(callback: AVRClockEventCallback, cycles: u64): AVRClockEventCallback {
        const clockEventPool: AVRClockEventEntry[] = this.clockEventPool;
        cycles = this.cycles + (cycles > 1 ? cycles : 1);
        const maybeEntry = clockEventPool.pop();
        const entry: AVRClockEventEntry = maybeEntry != null ? maybeEntry : new AVRClockEventEntryImpl(cycles, callback);
        entry.cycles = cycles;
        entry.callback = callback;
        let clockEvent = this.nextClockEvent;
        let lastItem: AVRClockEventEntry | null = null;
        while (clockEvent && clockEvent.cycles < cycles) {
            lastItem = clockEvent;
            clockEvent = clockEvent.next;
        }
        if (lastItem) {
            lastItem.next = entry;
            entry.next = clockEvent;
        } else {
            this.nextClockEvent = entry;
            entry.next = clockEvent;
        }
        return callback;
    }

    updateClockEvent(callback: AVRClockEventCallback, cycles: u64): boolean {
        if (this.clearClockEvent(callback)) {
            this.addClockEvent(callback, cycles);
            return true;
        }
        return false;
    }

    clearClockEvent(callback: AVRClockEventCallback): boolean {
        let clockEvent: AVRClockEventEntry | null = this.nextClockEvent;
        if (!clockEvent) {
            return false;
        }
        const clockEventPool = this.clockEventPool;
        let lastItem: AVRClockEventEntry | null = null;
        while (clockEvent) {
            if (clockEvent.callback === callback) {
                if (lastItem) {
                    lastItem.next = clockEvent.next;
                } else {
                    this.nextClockEvent = clockEvent.next;
                }
                if (clockEventPool.length < 10) {
                    clockEventPool.push(clockEvent);
                }
                return true;
            }
            lastItem = clockEvent;
            clockEvent = clockEvent.next;
        }
        return false;
    }

    tick(): void {
        const nextClockEvent = this.nextClockEvent;
        if (nextClockEvent && nextClockEvent.cycles <= this.cycles) {
            nextClockEvent.callback();
            this.nextClockEvent = nextClockEvent.next;
            if (this.clockEventPool.length < 10) {
                this.clockEventPool.push(nextClockEvent);
            }
        }

        const nextInterrupt = this.nextInterrupt;
        if (this.interruptsEnabled && nextInterrupt >= 0) {
            const interrupt = this.pendingInterrupts[nextInterrupt];
            avrInterrupt(this, interrupt.address);
            if (!interrupt.constant) {
                this.clearInterrupt(interrupt);
            }
        }
    }
}