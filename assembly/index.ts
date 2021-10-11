// The entry file of your WebAssembly module.

import {CPU} from './v2/cpu/cpu'
import {compileInstruction} from "./cpu/instruction-compiler";
import {avrInstruction} from './v2/cpu/instruction';

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

// CPU specific

export function setupCPU(program: ArrayBuffer): void {
    cpu = new CPU(Uint16Array.wrap(program))
}

export function runProgram(cycles: u32 = 50000): void {
    for (let i: u32 = 0; i < cycles; i++) {
        avrInstruction(cpu)
    }
}

export function getPC(): u32 {
    return cpu.pc
}

export function getCycles(): u32 {
    return cpu.cycles as u32
}

export function getSREG(): u8 {
    return cpu.SREG
}

export function getDataPtr(): Uint32Array {
    return Uint32Array.wrap(cpu.data.buffer)
}

declare function log(value: string): void;

//Import JS loader function for calling the external JS hooks
declare function callWriteHook(value: u8, oldValue: u8, addr: u16): boolean;

export function addWriteHook(addr: u32): void {
    cpu.writeHooks.set(addr, (value: u8, oldValue: u8, addr1: u16) => {
        log('addr: ' + addr1.toString() + ' [' + value.toString() + ',' + oldValue.toString() + ']');
        return callWriteHook(value, oldValue, addr1);
    });
}

// tests

export function testCompile(): string {
    return compileInstruction(0, 0, false)
}