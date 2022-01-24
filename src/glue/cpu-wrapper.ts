import {ASUtil, ResultObject} from "@assemblyscript/loader";
import * as MyModule from "../../build/module";
import {
    avr8js,
    AVRInterruptConfigImpl as AVRInterruptConfig,
    u16,
    u32,
    u8,
    CPU as WACPU,
    u64, AVRInterruptConfigImpl
} from "../../build/module";
import {AVRClockEventCallback} from "../../shared/avr8js/cpu/interfaces";
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
    readonly clockEventCallbacks: Array<AVRClockEventCallback> = new Array<AVRClockEventCallback>();
    readonly cpu: WACPU;

    constructor(program: Uint16Array, sramBytes: u64 = 8192n) {
        this.wasm = this.instantiateWASM(modulePath);
        this.loader = this.wasm.exports;
        this.avr8js = this.loader.avr8js;

        const programArray = this.loader.__newArray(this.avr8js.Uint16Array_ID, program)
        const cpuPtr = this.avr8js.newCPU(programArray, sramBytes);
        // Instantiation with this.loader.CPU(programArray, sramBytes) causes unreachable exception
        // Maybe because the optional bigint sramBytes
        this.cpu = this.loader.CPU.wrap(cpuPtr);
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
                callWriteHook(value: number, oldValue: number, addr: number, mask: number): boolean {
                    return this.writeHooks[addr](value, oldValue, addr, mask)
                },
                callClockEventCallback(callbackId: u32) {
                    this.clockEventCallbacks[callbackId].call()
                },
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

    //TODO Implement following
    // DG Maybe use u64 for cycles
    addClockEvent(callback: AVRClockEventCallback, cycles: u32): AVRClockEventCallback {
        const id = this.nextClockEventId;
        this.clockEventCallbacks[id] = callback;
        const cbkPtr = avr8js.addClockEvent(this.cpu.valueOf(), id, cycles);
        return callback;
    }

    updateClockEvent(callback: AVRClockEventCallback, cycles: u32): boolean {
        return false
    }

    clearClockEvent(callback: AVRClockEventCallback): boolean {
        return false
    }

    tick(): void {
        this.cpu.tick();
    }

    // External functions

    avrInterrupt(addr: u8) {
        this.avr8js.avrInterrupt(this.cpu.valueOf(), addr);
    }

    runProgram(cycles = 5000) {
        this.avr8js.runProgram(this.cpu.valueOf(), cycles);
    }

    avrInstruction() {
        this.loader.avrInstruction(this.cpu.valueOf());
    }

}