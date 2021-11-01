import {ASUtil, ResultObject} from "@assemblyscript/loader";
import * as MyModule from "../build/module";
import {avr8js, u16, u32, u64, u8} from "../build/module";
import {AVRClockEventCallback, AVRInterruptConfig} from "../assembly/v2/cpu/cpu";

export class CPU {

    readonly loader: ASUtil & typeof MyModule;
    readonly avr8js: typeof avr8js;
    readonly ptr: number;
    readonly data: Uint8Array;
    readonly dataView: DataView;

    constructor(private wasm: ResultObject & { exports: ASUtil & typeof MyModule }, program: Uint16Array) {
        this.loader = wasm.exports
        this.avr8js = this.loader.avr8js

        const bufRef = this.loader.__newArrayBuffer(program.buffer);
        this.ptr = this.avr8js.newCPU(bufRef)
        this.data = this.loader.__getUint8ArrayView(this.avr8js.getData(this.ptr))
        this.dataView = new DataView(this.data.buffer)
    }

    get pc(): u32 {
        return this.avr8js.getPC(this.ptr)
    }

    get cycles(): u32 {
        return this.avr8js.getCycles(this.ptr)
    }

    reset(): void {
        this.avr8js.reset(this.ptr)
    }

    readData(addr: u16): u8 {
        return this.avr8js.readData(this.ptr, addr)
    }

    writeData(addr: u16, value: u8, mask: u8 = 0xff): void {
        this.avr8js.writeData(this.ptr, addr, value, mask)
    }

    get SP(): u16 {
        return this.avr8js.getSP(this.ptr);
    }

    set SP(value: u16) {
        this.avr8js.setSP(this.ptr, value)
    }

    get SREG(): u8 {
        return this.avr8js.getSREG(this.ptr);
    }

    get interruptsEnabled(): boolean {
        return false;
    }

    setInterruptFlag(interrupt: AVRInterruptConfig): void {

    }

    updateInterruptEnable(interrupt: AVRInterruptConfig, registerValue: u8): void {

    }

    queueInterrupt(interrupt: AVRInterruptConfig): void {

    }

    clearInterrupt(interruptConfig: AVRInterruptConfig, clearFlag: boolean = true): void {

    }

    clearInterruptByFlag(interrupt: AVRInterruptConfig, registerValue: number): void {

    }

    addClockEvent(callback: AVRClockEventCallback, cycles: u64): AVRClockEventCallback {
        return null
    }

    updateClockEvent(callback: AVRClockEventCallback, cycles: u64): boolean {
        return false
    }

    clearClockEvent(callback: AVRClockEventCallback): boolean {
        return false
    }

    tick(): void {

    }

    runProgram(cycles = 5000) {
        this.avr8js.runProgram(this.ptr, cycles);
    }

    printState() {
        const state = {
            data: this.data.reduce((value, next) => value + next),
            PC: this.pc,
            cycles: this.cycles,
            SREG: this.SREG,
            SP: this.SP
        }
        console.table(state)
    }

}