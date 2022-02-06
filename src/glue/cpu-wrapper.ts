import {ASUtil, ResultObject} from "@assemblyscript/loader";
import * as MyModule from "../../build/module";
import {
    avr8js,
    AVRInterruptConfigImpl,
    CPU as WACPU,
    u16,
    u32,
    u8,
    usize
} from "../../build/module";
import {AVRClockEventCallback, AVRInterruptConfig} from "./interfaces";
import {readFileSync} from "fs";
import {instantiateSync} from "@assemblyscript/loader/umd";

const modulePath = __dirname + "/../../build/untouched.wasm"

export class CPU {

    readonly wasm: ResultObject & { exports: ASUtil & typeof MyModule; };
    readonly loader: ASUtil & typeof MyModule;
    readonly avr8js: typeof avr8js;
    readonly data: Uint8Array;
    readonly dataView: DataView;
    readonly writeHooks = {};
    nextClockEventId = 0;
    readonly clockEventCallbacks: Map<u32, AVRClockEventCallback> = new Map<u32, AVRClockEventCallback>();
    readonly clockEventCallbackPtrs: Map<AVRClockEventCallback, usize> = new Map<AVRClockEventCallback, u32>();
    readonly cpu: WACPU;
    readonly cpuPtr: usize;

    constructor(program: Uint16Array, sramBytes: u32 = 8192) {
        this.wasm = this.instantiateWASM(modulePath);
        this.loader = this.wasm.exports;
        this.avr8js = this.loader.avr8js;

        const programArray = this.loader.__newArray(this.avr8js.Uint16Array_ID, program)
        this.cpuPtr = this.avr8js.newCPU(programArray, BigInt(sramBytes));
        // Instantiation with this.loader.CPU(programArray, sramBytes) causes unreachable exception
        // Maybe because the optional bigint sramBytes
        this.cpu = this.loader.CPU.wrap(this.cpuPtr);
        this.data = this.loader.__getUint8ArrayView(this.cpu.data);
        this.dataView = new DataView(this.data.buffer, this.data.byteOffset, this.data.byteLength);
    }

    private instantiateWASM(modulePath: string): ResultObject & { exports: ASUtil & typeof MyModule } {
        return instantiateSync<typeof MyModule>(readFileSync(modulePath), {
            /* imports */
            index: {
                log: (ptr: number) => console.log('WASM-Log: ' + this.wasm.exports.__getString(ptr)),
            },
            "cpu-bridge": {
                callWriteHook: (value: number, oldValue: number, addr: number, mask: number): boolean => {
                    return this.writeHooks[addr](value, oldValue, addr, mask)
                },
                callClockEventCallback: (callbackId: u32) => this.clockEventCallbacks.get(callbackId)()
            }
        })
    }

    get progBytes(): Uint8Array {
        return this.loader.__getUint8ArrayView(this.cpu.progBytes);
    }

    get progMem(): Uint16Array {
        return this.loader.__getUint16ArrayView(this.cpu.progMem);
    }

    get pc(): u32 {
        return this.cpu.pc;
    }

    set pc(value: u32) {
        this.cpu.pc = value;
    }

    get cycles(): u32 {
        return Number(this.cpu.cycles);
    }

    set cycles(cycles: u32) {
        this.cpu.cycles = BigInt(cycles);
    }

    reset(): void {
        this.cpu.reset();
    }

    readData(addr: u16): u8 {
        return this.cpu.readData(addr);
    }

    writeData(addr: u16, value: u8, mask: u8 = 0xff): void {
        this.cpu.writeData(addr, value, mask);
    }

    get SP(): u16 {
        return this.cpu.SP;
    }

    set SP(value: u16) {
        this.cpu.SP = value;
    }

    get SREG(): u8 {
        return this.cpu.SREG;
    }

    get pc22Bits(): boolean {
        return !!this.cpu.pc22Bits;
    }

    // Interrupts

    get interruptsEnabled(): boolean {
        return !!this.cpu.interruptsEnabled
    }

    setInterruptFlag(interrupt: AVRInterruptConfig): void {
        this.cpu.setInterruptFlag(this.convertToWASMInstancePointer(interrupt))
    }

    updateInterruptEnable(interrupt: AVRInterruptConfig, registerValue: u8): void {
        this.cpu.updateInterruptEnable(this.convertToWASMInstancePointer(interrupt), registerValue);
    }

    queueInterrupt(interrupt: AVRInterruptConfig): void {
        this.cpu.queueInterrupt(this.convertToWASMInstancePointer(interrupt));
    }

    clearInterrupt(interrupt: AVRInterruptConfig, clearFlag: boolean = true): void {
        this.cpu.clearInterrupt(this.convertToWASMInstancePointer(interrupt), clearFlag);
    }

    clearInterruptByFlag(interrupt: AVRInterruptConfig, registerValue: u8): void {
        this.cpu.clearInterruptByFlag(this.convertToWASMInstancePointer(interrupt), registerValue);
    }

    private convertToWASMInstancePointer(interrupt: AVRInterruptConfig) {
        return this.convertToWASMInstance(interrupt).valueOf()
    }

    private convertToWASMInstance(interrupt: AVRInterruptConfig): AVRInterruptConfigImpl {
        if (interrupt instanceof this.loader.AVRInterruptConfigImpl)
            return interrupt;
        else
            // Create new instance if not an WASM instance
            return this.newAVRInterruptConfigImpl(interrupt);
    }

    private newAVRInterruptConfigImpl(interrupt: AVRInterruptConfig) {
        return new this.loader.AVRInterruptConfigImpl(
            interrupt.address,
            interrupt.enableRegister,
            interrupt.enableMask,
            interrupt.flagRegister,
            interrupt.flagMask,
            interrupt.constant,
            interrupt.inverseFlag)
    }

    // ClockEvents

    //TODO DG Replace u32 with u64 after refactoring of peripherals
    /*
      DG Maybe replace the initialization with glue function which creates
      and adds the callback in one go.
     */
    addClockEvent(callback: AVRClockEventCallback, cycles: u32): AVRClockEventCallback {
        const callbackId = this.nextClockEventId++;
        this.clockEventCallbacks.set(callbackId, callback);
        const callbackPtr = new this.loader.ExternalAVRClockEventCallback(callbackId).valueOf();
        this.cpu.addClockEvent(callbackPtr, BigInt(cycles));
        this.clockEventCallbackPtrs.set(callback, callbackPtr);
        return callback;
    }

    //TODO DG Replace u32 with u64 after refactoring of peripherals
    updateClockEvent(callback: AVRClockEventCallback, cycles: u32): boolean {
        const ptr = this.getCallbackPtr(callback);
        if (ptr) {
            return !!this.cpu.updateClockEvent(ptr, BigInt(cycles));
        }
        return false;
    }

    clearClockEvent(callback: AVRClockEventCallback): boolean {
        const ptr = this.getCallbackPtr(callback);
        if (ptr) {
            this.clockEventCallbacks.delete(ptr);
            this.clockEventCallbackPtrs.delete(callback);
            return !!this.cpu.clearClockEvent(ptr);
        }
        return false
    }

    private getCallbackPtr(callback: AVRClockEventCallback): usize {
        return this.clockEventCallbackPtrs.get(callback);
    }

    tick(): void {
        this.cpu.tick();
    }

    // External functions

    avrInterrupt(addr: u8) {
        this.avr8js.avrInterrupt(this.cpuPtr, addr);
    }

    runProgram(cycles: u32 = 5000) {
        this.avr8js.runProgram(this.cpuPtr, cycles);
    }

    avrInstruction() {
        this.loader.avrInstruction(this.cpuPtr);
    }

}