/**
 * AVR-8 GPIO Port implementation
 * Part of AVR8js
 * Reference: http://ww1.microchip.com/downloads/en/DeviceDoc/ATmega48A-PA-88A-PA-168A-PA-328-P-DS-DS40002061A.pdf
 *
 * Copyright (C) 2019, 2020, 2021 Uri Shaked
 *
 * v0.18.2 - Modified by Dario Götze
 */
import {AVRInterruptConfig, CPU} from '../cpu/cpu';

export interface AVRExternalInterrupt {
    EICRA: u8;
    EICRB: u8;
    EIMSK: u8;
    EIFR: u8;
    index: u8; // 0..7
    interrupt: u8;
}

export class AVRExternalInterruptImpl implements AVRExternalInterrupt {
    private _EICRA: u8;
    private _EICRB: u8;
    private _EIMSK: u8;
    private _EIFR: u8;
    private _index: u8;
    private _interrupt: u8;

    constructor(EICRA: u8, EICRB: u8, EIMSK: u8, EIFR: u8, index: u8, interrupt: u8) {
        this._EICRA = EICRA;
        this._EICRB = EICRB;
        this._EIFR = EIFR;
        this._EIMSK = EIMSK;
        this._index = index;
        this._interrupt = interrupt;
    }

    get EICRA(): u8 {
        return this._EICRA;
    }

    set EICRA(value: u8) {
        this._EICRA = value;
    }

    get EICRB(): u8 {
        return this._EICRB;
    }

    set EICRB(value: u8) {
        this._EICRB = value;
    }

    get EIFR(): u8 {
        return this._EIFR;
    }

    set EIFR(value: u8) {
        this._EIFR = value;
    }

    get EIMSK(): u8 {
        return this._EIMSK;
    }

    set EIMSK(value: u8) {
        this._EIMSK = value;
    }

    get index(): u8 {
        return this._index;
    }

    set index(value: u8) {
        this._index = value;
    }

    get interrupt(): u8 {
        return this._interrupt;
    }

    set interrupt(value: u8) {
        this._interrupt = value;
    }
}

export interface AVRPinChangeInterrupt {
    PCIE: u8; // bit index in PCICR/PCIFR
    PCICR: u8;
    PCIFR: u8;
    PCMSK: u8;
    pinChangeInterrupt: u8;
    mask: u8;
    offset: u8;
}

export class AVRPinChangeInterruptImpl implements AVRPinChangeInterrupt {
    private _PCICR: u8;
    private _PCIE: u8;
    private _PCIFR: u8;
    private _PCMSK: u8;
    private _mask: u8;
    private _offset: u8;
    private _pinChangeInterrupt: u8;

    constructor(PCIE: u8, PCICR: u8, PCIFR: u8, PCMSK: u8, pinChangeInterrupt: u8, mask: u8, offset: u8) {
        this._PCICR = PCICR;
        this._PCIE = PCIE;
        this._PCIFR = PCIFR;
        this._PCMSK = PCMSK;
        this._mask = mask;
        this._offset = offset;
        this._pinChangeInterrupt = pinChangeInterrupt;
    }

    get PCICR(): u8 {
        return this._PCICR;
    }

    set PCICR(value: u8) {
        this._PCICR = value;
    }

    get PCIE(): u8 {
        return this._PCIE;
    }

    set PCIE(value: u8) {
        this._PCIE = value;
    }

    get PCIFR(): u8 {
        return this._PCIFR;
    }

    set PCIFR(value: u8) {
        this._PCIFR = value;
    }

    get PCMSK(): u8 {
        return this._PCMSK;
    }

    set PCMSK(value: u8) {
        this._PCMSK = value;
    }

    get mask(): u8 {
        return this._mask;
    }

    set mask(value: u8) {
        this._mask = value;
    }

    get offset(): u8 {
        return this._offset;
    }

    set offset(value: u8) {
        this._offset = value;
    }

    get pinChangeInterrupt(): u8 {
        return this._pinChangeInterrupt;
    }

    set pinChangeInterrupt(value: u8) {
        this._pinChangeInterrupt = value;
    }
}

export interface AVRPortConfig {
    // Register addresses
    PIN: u8;
    DDR: u8;
    PORT: u8;

    // Interrupt settings
    pinChange: AVRPinChangeInterrupt | null;
    externalInterrupts: AVRExternalInterrupt[];
}

export class AVRPortConfigImpl implements AVRPortConfig {
    private _PIN: u8;
    private _DDR: u8;
    private _PORT: u8;
    private _pinChange: AVRPinChangeInterrupt | null;
    private _externalInterrupts: AVRExternalInterrupt[];

    //TODO DG Check correctness. Removed nullability of externalInterrupts. Before: AVRExternalInterrupt | null.
    // DG Added default value
    constructor(PIN: u8, DDR: u8, PORT: u8, pinChange: AVRPinChangeInterrupt | null = null, externalInterrupts: AVRExternalInterrupt[] = []) {
        this._PIN = PIN;
        this._DDR = DDR;
        this._PORT = PORT;
        this._pinChange = pinChange;
        this._externalInterrupts = externalInterrupts;
    }

    get PIN(): u8 {
        return this._PIN;
    }

    set PIN(value: u8) {
        this._PIN = value;
    }

    get DDR(): u8 {
        return this._DDR;
    }

    set DDR(value: u8) {
        this._DDR = value;
    }

    get PORT(): u8 {
        return this._PORT;
    }

    set PORT(value: u8) {
        this._PORT = value;
    }

    get pinChange(): AVRPinChangeInterrupt | null {
        return this._pinChange;
    }

    set pinChange(value: AVRPinChangeInterrupt | null) {
        this._pinChange = value;
    }

    get externalInterrupts(): Array<AVRExternalInterrupt> {
        return this._externalInterrupts;
    }

    set externalInterrupts(value: (AVRExternalInterrupt)[]) {
        this._externalInterrupts = value;
    }
}

// DG TODO Fix interface usage, only getter and setters are currently supported
// https://www.assemblyscript.org/status.html#classes-and-interfaces
export const INT0 = new AVRExternalInterruptImpl(
    0x69,
    0,
    0x3d,
    0x3c,
    0,
    2);

export const INT1 = new AVRExternalInterruptImpl(
    0x69,
    0,
    0x3d,
    0x3c,
    1,
    4);

// DG TODO Fix object export. ERROR TS2322: Type '<object>' is not assignable to type 'i32'.

export const PCINT0 = new AVRPinChangeInterruptImpl(
    0,
    0x68,
    0x3b,
    0x6b,
    6,
    0xff,
    0,
);

export const PCINT1 = new AVRPinChangeInterruptImpl(
    1,
    0x68,
    0x3b,
    0x6c,
    8,
    0xff,
    0);

export const PCINT2 = new AVRPinChangeInterruptImpl(
    2,
    0x68,
    0x3b,
    0x6d,
    10,
    0xff,
    0);

export type GPIOListener = (value: u8, oldValue: u8) => void;
export type ExternalClockListener = (pinValue: boolean) => void;

// DG TODO Fix interface usage, only getter and setters are currently supported
// https://www.assemblyscript.org/status.html#classes-and-interfaces
export const portAConfig: AVRPortConfig = new AVRPortConfigImpl(
    0x20,
    0x21,
    0x22,
    null,
    []);

export const portBConfig: AVRPortConfig = new AVRPortConfigImpl(
    0x23,
    0x24,
    0x25,
    // Interrupt settings
    PCINT0,
    []);

// export const portCConfig: AVRPortConfig = {
//     PIN: 0x26,
//     DDR: 0x27,
//     PORT: 0x28,
//
//     // Interrupt settings
//     pinChange: PCINT1,
//     externalInterrupts: [],
// };
//
// export const portDConfig: AVRPortConfig = {
//     PIN: 0x29,
//     DDR: 0x2a,
//     PORT: 0x2b,
//
//     // Interrupt settings
//     pinChange: PCINT2,
//     externalInterrupts: [null, null, INT0, INT1],
// };
//
// export const portEConfig: AVRPortConfig = {
//     pinChange: null,
//     PIN: 0x2c,
//     DDR: 0x2d,
//     PORT: 0x2e,
//     externalInterrupts: []
// };
//
// export const portFConfig: AVRPortConfig = {
//     pinChange: null,
//     PIN: 0x2f,
//     DDR: 0x30,
//     PORT: 0x31,
//     externalInterrupts: []
// };
//
// export const portGConfig: AVRPortConfig = {
//     pinChange: null,
//     PIN: 0x32,
//     DDR: 0x33,
//     PORT: 0x34,
//     externalInterrupts: []
// };
//
// export const portHConfig: AVRPortConfig = {
//     pinChange: null,
//     PIN: 0x100,
//     DDR: 0x101,
//     PORT: 0x102,
//     externalInterrupts: []
// };
//
// export const portJConfig: AVRPortConfig = {
//     pinChange: null,
//     PIN: 0x103,
//     DDR: 0x104,
//     PORT: 0x105,
//     externalInterrupts: []
// };
//
// export const portKConfig: AVRPortConfig = {
//     pinChange: null,
//     PIN: 0x106,
//     DDR: 0x107,
//     PORT: 0x108,
//     externalInterrupts: []
// };
//
// export const portLConfig: AVRPortConfig = {
//     pinChange: null,
//     PIN: 0x109,
//     DDR: 0x10a,
//     PORT: 0x10b,
//     externalInterrupts: []
// };

export enum PinState {
    Low,
    High,
    Input,
    InputPullUp,
}

/* This mechanism allows timers to override specific GPIO pins */
export enum PinOverrideMode {
    None,
    Enable,
    Set,
    Clear,
    Toggle,
}

enum InterruptMode {
    LowLevel,
    Change,
    FallingEdge,
    RisingEdge,
}

export class AVRIOPort {
    readonly externalClockListeners: (ExternalClockListener | null)[] = [];

    private readonly externalInts: (AVRInterruptConfig | null)[];
    private readonly PCINT: AVRInterruptConfig | null;
    private listeners: GPIOListener[] = [];
    private pinValue: u8 = 0;
    private overrideMask: u8 = 0xff;
    private overrideValue: u8 = 0;
    private lastValue: u8 = 0;
    private lastDdr: u8 = 0;
    private lastPin: u8 = 0;

    // DG Removed ReadOnly class
    constructor(private cpu: CPU, readonly portConfig: AVRPortConfig) {
        cpu.gpioPorts.add(this);
        cpu.gpioByPort[portConfig.PORT] = this;

        // DG Replaced with Map.set
        cpu.writeHooks.set(portConfig.DDR, (value: u8) => {
            const portValue = cpu.data[portConfig.PORT];
            cpu.data[portConfig.DDR] = value;
            this.writeGpio(portValue, value);
            this.updatePinRegister(value);
            return true;
        });
        cpu.writeHooks.set(portConfig.PORT, (value: u8) => {
            const ddrMask = cpu.data[portConfig.DDR];
            cpu.data[portConfig.PORT] = value;
            this.writeGpio(value, ddrMask);
            this.updatePinRegister(ddrMask);
            return true;
        });
        cpu.writeHooks.set(portConfig.PIN, (value: u8, oldValue, addr, mask) => {
            // Writing to 1 PIN toggles PORT bits
            const oldPortValue = cpu.data[portConfig.PORT];
            const ddrMask = cpu.data[portConfig.DDR];
            const portValue = oldPortValue ^ (value & mask);
            cpu.data[portConfig.PORT] = portValue;
            this.writeGpio(portValue, ddrMask);
            this.updatePinRegister(ddrMask);
            return true;
        });

        // External interrupts
        const externalInterrupts = portConfig.externalInterrupts;
        this.externalInts = externalInterrupts.map((externalConfig) =>
            externalConfig
                ? <AVRInterruptConfig>{
                    address: externalConfig.interrupt,
                    flagRegister: externalConfig.EIFR,
                    flagMask: 1 << externalConfig.index,
                    enableRegister: externalConfig.EIMSK,
                    enableMask: 1 << externalConfig.index,
                }
                : null
        );

        // DG TODO Check correct replacement
        const EICRA = this.findInterrupt(externalInterrupts, (item) => item.EICRA);
        this.attachInterruptHook(EICRA);
        const EICRB = this.findInterrupt(externalInterrupts, (item) => item.EICRB);
        this.attachInterruptHook(EICRB);
        const EIMSK = this.findInterrupt(externalInterrupts, (item) => item.EIMSK);
        this.attachInterruptHook(EIMSK, 'mask');
        const EIFR = this.findInterrupt(externalInterrupts, (item) => item.EIFR);
        this.attachInterruptHook(EIFR, 'flag');

        // Pin change interrupts
        const pinChange = portConfig.pinChange;
        this.PCINT = pinChange
            ? <AVRInterruptConfig>{
                address: pinChange.pinChangeInterrupt,
                flagRegister: pinChange.PCIFR,
                flagMask: 1 << pinChange.PCIE,
                enableRegister: pinChange.PCICR,
                enableMask: 1 << pinChange.PCIE,
            }
            : null;
        if (pinChange) {
            const PCIFR = pinChange.PCIFR
            const PCMSK = pinChange.PCMSK;
            cpu.writeHooks.set(PCIFR, (value) => {
                // AssemblyScript has no iterators atm https://www.assemblyscript.org/stdlib/set.html#constructor
                cpu.gpioPorts.values().forEach(
                    gpio => {
                        const PCINT = gpio.PCINT;
                        if (PCINT) {
                            cpu.clearInterruptByFlag(PCINT, value);
                        }
                    }
                );
                return true;
            });
            cpu.writeHooks.set(PCMSK, (value) => {
                cpu.data[PCMSK] = value;
                // AssemblyScript has no iterators atm https://www.assemblyscript.org/stdlib/set.html#constructor
                cpu.gpioPorts.values().forEach(
                    gpio => {
                        const PCINT = gpio.PCINT;
                        if (PCINT) {
                            cpu.updateInterruptEnable(PCINT, value);
                        }
                    });
                return true;
            });
        }
    }

    // DG Added for interrupts
    findInterrupt(interrupts: AVRExternalInterrupt[], selector: (interrupt: AVRExternalInterrupt) => u8): u8 {
        if (interrupts.length == 0) return 0;
        return selector(interrupts[0]);
    }

    // DG Possibly needed
    // find<Type>(arr: Array<Type>, predicate: (item: Type) => boolean): Type | null {
    //     const idx = arr.findIndex(predicate);
    //     if (idx == -1) return null;
    //     else return arr[idx];
    // }

    addListener(listener: GPIOListener): void {
        this.listeners.push(listener);
    }

    removeListener(listener: GPIOListener): void {
        this.listeners = this.listeners.filter((l) => l !== listener);
    }

    /**
     * Get the state of a given GPIO pin
     *
     * @param index Pin index to return from 0 to 7
     * @returns PinState.Low or PinState.High if the pin is set to output, PinState.Input if the pin is set
     *   to input, and PinState.InputPullUp if the pin is set to input and the internal pull-up resistor has
     *   been enabled.
     */
    pinState(index: number): PinState {
        const ddr = this.cpu.data[this.portConfig.DDR];
        const port = this.cpu.data[this.portConfig.PORT];
        const bitMask = 1 << index;
        if (ddr & bitMask) {
            return this.lastValue & bitMask ? PinState.High : PinState.Low;
        } else {
            return port & bitMask ? PinState.InputPullUp : PinState.Input;
        }
    }

    /**
     * Sets the input value for the given pin. This is the value that
     * will be returned when reading from the PIN register.
     */
    setPin(index: number, value: boolean): void {
        const bitMask = 1 << index;
        this.pinValue &= ~bitMask;
        if (value) {
            this.pinValue |= bitMask;
        }
        this.updatePinRegister(this.cpu.data[this.portConfig.DDR]);
    }

    /**
     * Internal method - do not call this directly!
     * Used by the timer compare output units to override GPIO pins.
     */
    timerOverridePin(pin: u8, mode: PinOverrideMode): void {
        const cpu = this.cpu;
        const portConfig = this.portConfig;
        const pinMask = 1 << pin;
        if (mode === PinOverrideMode.None) {
            this.overrideMask |= pinMask;
            this.overrideValue &= ~pinMask;
        } else {
            this.overrideMask &= ~pinMask;
            switch (mode) {
                case PinOverrideMode.Enable:
                    this.overrideValue &= ~pinMask;
                    this.overrideValue |= cpu.data[portConfig.PORT] & pinMask;
                    break;
                case PinOverrideMode.Set:
                    this.overrideValue |= pinMask;
                    break;
                case PinOverrideMode.Clear:
                    this.overrideValue &= ~pinMask;
                    break;
                case PinOverrideMode.Toggle:
                    this.overrideValue ^= pinMask;
                    break;
            }
        }
        const ddrMask = cpu.data[portConfig.DDR];
        this.writeGpio(cpu.data[portConfig.PORT], ddrMask);
        this.updatePinRegister(ddrMask);
    }

    private updatePinRegister(ddr: u8): void {
        const newPin = (this.pinValue & ~ddr) | (this.lastValue & ddr);
        this.cpu.data[this.portConfig.PIN] = newPin;
        if (this.lastPin !== newPin) {
            for (let index = 0; index < 8; index++) {
                if ((newPin & (1 << index)) !== (this.lastPin & (1 << index))) {
                    const value = !!(newPin & (1 << index));
                    this.toggleInterrupt(index, value);
                    // DG Replaced optional due missing assembly script support
                    const extListener = this.externalClockListeners[index]
                    if (extListener) {
                        extListener(value);
                    }
                }
            }
            this.lastPin = newPin;
        }
    }

    private toggleInterrupt(pin: u8, risingEdge: boolean): void {
        const cpu = this.cpu;
        const portConfig = this.portConfig;
        const externalInts = this.externalInts;
        const PCINT = this.PCINT
        const externalInterrupts = portConfig.externalInterrupts;
        const pinChange = portConfig.pinChange;
        const externalConfig = externalInterrupts[pin];
        const external = externalInts[pin];
        if (external && externalConfig) {
            const index = externalConfig.index;
            if (cpu.data[externalConfig.EIMSK] & (1 << index)) {
                const configRegister = index >= 4 ? externalConfig.EICRB : externalConfig.EICRA;
                const configShift = (index % 4) * 2;
                const configuration = (cpu.data[configRegister] >> configShift) & 0x3;
                let generateInterrupt = false;
                external.constant = false;
                switch (configuration) {
                    case InterruptMode.LowLevel:
                        generateInterrupt = !risingEdge;
                        external.constant = true;
                        break;
                    case InterruptMode.Change:
                        generateInterrupt = true;
                        break;
                    case InterruptMode.FallingEdge:
                        generateInterrupt = !risingEdge;
                        break;
                    case InterruptMode.RisingEdge:
                        generateInterrupt = risingEdge;
                        break;
                }
                if (generateInterrupt) {
                    cpu.setInterruptFlag(external);
                } else if (external.constant) {
                    cpu.clearInterrupt(external, true);
                }
            }
        }

        if (pinChange && PCINT && pinChange.mask & (1 << pin)) {
            if (cpu.data[pinChange.PCMSK] & (1 << (pin + pinChange.offset))) {
                cpu.setInterruptFlag(PCINT);
            }
        }
    }

    /*
        DG Moved options to comment due missing assembly script support
        @registerType can be 'flag' | 'mask' | 'other', default 'other'
     */
    private attachInterruptHook(register: number, registerType: string = 'other'): void {
        if (!register) {
            return;
        }

        const cpu = this.cpu;

        cpu.writeHooks.set(register, (value: u8) => {
            if (registerType !== 'flag') {
                cpu.data[register] = value;
            }
            // AssemblyScript has no iterators atm https://www.assemblyscript.org/stdlib/set.html#constructor
            cpu.gpioPorts.values().forEach(
                gpio => {
                    gpio.externalInts.forEach(external => {
                        if (external && registerType === 'mask') {
                            cpu.updateInterruptEnable(external, value);
                        }
                        if (external && !external.constant && registerType === 'flag') {
                            cpu.clearInterruptByFlag(external, value);
                        }
                    });

                    gpio.checkExternalInterrupts();
                });

            return true;
        });
    }

    private checkExternalInterrupts(): void {
        const cpu = this.cpu;
        const externalInterrupts = this.portConfig.externalInterrupts;
        for (let pin = 0; pin < 8; pin++) {
            const external = externalInterrupts[pin];
            if (!external) {
                continue;
            }
            const pinValue = !!(this.lastPin & (1 << pin));
            const index = external.index
            if (!(cpu.data[external.EIMSK] & (1 << index)) || pinValue) {
                continue;
            }
            const configRegister = index >= 4 ? external.EICRB : external.EICRA;
            const configShift = (index % 4) * 2;
            const configuration = (cpu.data[configRegister] >> configShift) & 0x3;
            if (configuration === InterruptMode.LowLevel) {
                cpu.queueInterrupt(<AVRInterruptConfig>{
                    address: external.interrupt,
                    flagRegister: external.EIFR,
                    flagMask: (1 << index),
                    enableRegister: external.EIMSK,
                    enableMask: (1 << index),
                    constant: true,
                });
            }
        }
    }

    private writeGpio(value: u8, ddr: u8): void {
        const newValue = (((value & this.overrideMask) | this.overrideValue) & ddr) | (value & ~ddr);
        const prevValue = this.lastValue;
        if (newValue !== prevValue || ddr !== this.lastDdr) {
            this.lastValue = newValue;
            this.lastDdr = ddr;
            this.listeners.forEach(listener => {
                listener(newValue, prevValue);
            });
        }
    }
}