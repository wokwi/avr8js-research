// The entry file of your WebAssembly module.
import {Test} from "./test";

export * from './test';
export * from './cpu-exporter';
import {compileInstruction} from "./cpu/instruction-compiler";

// CPU specific
export declare function log(value: string): void;

//Import JS loader function for calling the external JS hooks
export declare function callWriteHook(value: u8, oldValue: u8, addr: u16): boolean;

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

// tests

export function testCompile(): string {
    return compileInstruction(0, 0, false)
}

export function newTestInstance(): Test {
    return new Test("Hello from WASM Test!");
}