import {CPU} from "./v2/cpu/cpu";
import {avrInstruction} from "./v2/cpu/instruction";
import {log, callWriteHook} from './index';

export namespace avr8js {

    export function getCPUClassId(): number {
        return idof<CPU>();
    }

    export function newCPU(program: ArrayBuffer): CPU {
        return new CPU(Uint16Array.wrap(program))
    }

    export function runProgram(cpu: CPU, cycles: u32 = 50000): void {
        for (let i: u32 = 0; i < cycles; i++) {
            avrInstruction(cpu)
        }
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

    export function getSP(cpu: CPU) : u16 {
        return cpu.SP
    }

    export function setSP(cpu : CPU, value: u16) : void {
        cpu.SP = value
    }

    export function getPC(cpu: CPU): u32 {
        return cpu.pc
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

    export function addWriteHook(cpu: CPU, addr: u32): void {
        cpu.writeHooks.set(addr, (value: u8, oldValue: u8, addr1: u16) => {
            log('addr: ' + addr1.toString() + ' [' + value.toString() + ',' + oldValue.toString() + ']');
            return callWriteHook(value, oldValue, addr1);
        });
    }
}