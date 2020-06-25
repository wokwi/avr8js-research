// The entry file of your WebAssembly module.

import {CPU} from './cpu/cpu'
import {ADD} from "./cpu/testInstruction";

let cpu: CPU;

export function addLoop(start: i32, end: i32): i32 {
    let res = 0;
    for (let i = start; i < end; ++i) {
        res += i;
    }
    return res;
}

export function add(a: i32, b: i32): i32 {
    return a + b;
}

export function setupCPU() : void {
    const arr = new Uint16Array(0x1000)
    cpu = new CPU(arr);
}

export function getSREG(): u8 {
    return cpu.data[95]
}

export function runAddInstruction(opcode: u16): void {
    ADD(cpu, opcode)
}
