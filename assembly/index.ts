// The entry file of your WebAssembly module.
export * from './glue/cpu-exporter';
export * from './avr8js/cpu/instruction';
export {CPU} from './avr8js/cpu/cpu';
export {AVRInterruptConfigImpl, ExternalAVRClockEventCallback, CPUMemoryHooks, CPUMemoryHook, CPUMemoryReadHooks, CPUMemoryReadHook} from './avr8js/cpu/interfaces';

export declare function log(value: string): void;

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