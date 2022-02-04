import {CPU} from "../avr8js/cpu/cpu";
import {avrInstruction} from "../avr8js/cpu/instruction";
import {avrInterrupt as _avrInterrupt} from '../avr8js/cpu/interrupt';
import {callWriteHook} from './cpu-bridge';
import {ExternalAVRClockEventCallback} from "../avr8js/cpu/interfaces";

export namespace avr8js {

    export const CPU_ID = idof<CPU>()

    export const Uint16Array_ID = idof<Uint16Array>()

    export function newCPU(program: Uint16Array, sramBytes: u64 = 8192): CPU {
        return new CPU(program, sramBytes);
    }

    export function runProgram(cpu: CPU, cycles: u32 = 50000): void {
        for (let i: u32 = 0; i < cycles; i++) {
            avrInstruction(cpu)
        }
    }

    export function avrInterrupt(cpu: CPU, addr: u8): void {
        _avrInterrupt(cpu, addr);
    }

    export function addWriteHook(cpu: CPU, addr: u32): void {
        cpu.writeHooks.set(addr, callWriteHook);
    }

    export function addClockEvent(cpu: CPU, callbackId: u32, cycles: u32): ExternalAVRClockEventCallback {
        return cpu.addClockEvent(new ExternalAVRClockEventCallback(callbackId), cycles) as ExternalAVRClockEventCallback;
    }
}