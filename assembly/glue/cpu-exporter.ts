import {CPU} from "../avr8js/cpu/cpu";
import {avrInstruction} from "../avr8js/cpu/instruction";
import {avrInterrupt as _avrInterrupt} from '../avr8js/cpu/interrupt';
import {callWriteHook} from './cpu-bridge';

export namespace avr8js {

    export function getCPUClassId(): number {
        return idof<CPU>();
    }

    export function newCPU(program: ArrayBuffer, sramBytes: u32 = 8192): CPU {
        return new CPU(Uint16Array.wrap(program), sramBytes)
    }

    export function runProgram(cpu: CPU, cycles: u32 = 50000): void {
        for (let i: u32 = 0; i < cycles; i++) {
            avrInstruction(cpu)
        }
    }

    export function getProgBytes(cpu: CPU): Uint8Array {
        return cpu.progBytes
    }

    export function getProgMem(cpu: CPU): Uint16Array {
        return cpu.progMem
    }

    export function readData(cpu: CPU, addr: u16): u8 {
        return cpu.readData(addr);
    }

    export function writeData(cpu: CPU, addr: u16, value: u8, mask: u8 = 0xff): void {
        return cpu.writeData(addr, value, mask);
    }

    export function reset(cpu: CPU): void {
        cpu.reset()
    }

    export function getSP(cpu: CPU): u16 {
        return cpu.SP
    }

    export function setSP(cpu: CPU, value: u16): void {
        cpu.SP = value
    }

    export function getPC(cpu: CPU): u32 {
        return cpu.pc
    }

    export function setPC(cpu: CPU, pc: u32): void {
        cpu.pc = pc
    }

    export function getCycles(cpu: CPU): u32 {
        return cpu.cycles as u32
    }

    export function getSREG(cpu: CPU): u8 {
        return cpu.SREG
    }

    export function getData(cpu: CPU): Uint8Array {
        return cpu.data
    }

    export function getPC22Bits(cpu: CPU): boolean {
        return cpu.pc22Bits
    }

    export function tick(cpu: CPU): void {
        cpu.tick()
    }

    export function addWriteHook(cpu: CPU, addr: u32): void {
        cpu.writeHooks.set(addr, callWriteHook);
    }

    export function avrInterrupt(cpu: CPU, addr: u8): void {
        _avrInterrupt(cpu, addr);
    }
}