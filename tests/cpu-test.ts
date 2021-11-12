import {was, writeHooks} from "../src";
import {loadBlink} from "../compile/programs";
import {CPU} from '../src/cpu-wrapper';
import {loadHexBytes} from "../compile/compile";
import {avrInstruction, CPU as CPU2} from "avr8js";
import * as Benchmark from "benchmark";
import {performance} from "perf_hooks";

const Suite = Benchmark.Suite

const assembly = was.exports
const avr8js = assembly.avr8js

export function runTest() {
    // loadHexBytes("compile/program.hex")
    new Promise((resolve, reject) => {
        const program = new Uint16Array(16384);
        loadBlink(program);
        resolve(program)
    })
        .then(newCPU)
        .then((cpuPtr) => {

            //Add hook
            addWriteHook(cpuPtr, 0x23, (value, oldValue, addr, mask) => {
                console.log('Got callback from addr: ' + addr + ' [' + value + ',' + oldValue + ']');
                return false
            })
            addWriteHook(cpuPtr, 0x24, (value, oldValue, addr, mask) => {
                console.log('Got callback from addr: ' + addr + ' [' + value + ',' + oldValue + ']');
                return false
            })
            addWriteHook(cpuPtr, 0x25, (value, oldValue, addr, mask) => {
                console.log('Got callback from addr: ' + addr + ' [' + value + ',' + oldValue + ']');
                return false
            })

            // const id = avr8js.getCPUClassId();
            // const isCPU = assembly.__instanceof(cpuPtr, id);
            //
            // console.log('isCPU: ' + isCPU);
            //
            // const testInstance = assembly.Class.wrap(assembly.newTestInstance());
            // console.log(assembly.__getString(testInstance.str));

            logState(cpuPtr)
            runProgram(cpuPtr, 1000);
            logState(cpuPtr)
            // const difference = findDifferences(dataBefore, dataAfter);
            // console.log(difference)
        })
        .then(() => console.log('Finished program.'), (err) => console.error(err));
}

export function testWrapper() {
    loadHexBytes("compile/program.hex")
        // new Promise((resolve, reject) => {
        //     const program = new Uint16Array(16384);
        //     loadBlink(program);
        //     resolve(program)
        // })
        .then((program: Uint16Array) => runWrapper(program, 2000))
        .then(() => console.log('Finished program.'), (err) => console.error(err));
}

export function benchmarkCPUs() {
    loadHexBytes("compile/program.hex")
        // new Promise((resolve, reject) => {
        //     const program = new Uint16Array(16384);
        //     loadBlink(program);
        //     resolve(program)
        // })
        .then((program: Uint16Array) => {
            const suite = new Suite
            const cycles = 50000
            console.log('Run for ' + cycles + ' cycles...')
            suite.add('AVR WASM with wrapper', () => {
                runWrapper(program, cycles)
            }).add('AVR8js reference implementation', () => {
                runAvr(program, cycles)
            }).on('cycle', event => {
                console.log(String(event.target))
            }).run();
        })
        .then(() => console.log('Finished program.'), (err) => console.error(err));
}

export function compareCPUs() {
    loadHexBytes("compile/program.hex")
        // new Promise((resolve, reject) => {
        //     const program = new Uint16Array(16384);
        //     loadBlink(program);
        //     resolve(program)
        // })
        .then((program: Uint16Array) => {
            const cycles = 500000
            console.log('Run for ' + cycles + ' cycles...')
            runWrapper(program, cycles)
            console.log('======')
            runAvr(program, cycles)
        })
        .then(() => console.log('Finished program.'), (err) => console.error(err));
}

function runWrapper(program: Uint16Array, cycles: number = 2000) {
    const cpu = new CPU(was, program);
    // logAvrState(cpu)
    const startTime = performance.now();
    cpu.runProgram(cycles);
    const endTime = performance.now();
    console.log('Time: ' + (endTime - startTime) + 'ms');
    logAvrState(cpu);
}

function runAvr(program: Uint16Array, cycles: number = 2000) {
    const cpu = new CPU2(program);
    // logAvrState(cpu)
    const startTime = performance.now();
    for (let i = 0; i < cycles; i++) {
        avrInstruction(cpu);
    }
    const endTime = performance.now();
    console.log('Time: ' + (endTime - startTime) + 'ms');
    logAvrState(cpu)
}

function logAvrState(cpu: CPU | CPU2) {
    const state = {
        data: cpu.data.reduce((value, next) => value + next),
        PC: cpu.pc,
        "PC (HEX)": cpu.pc.toString(16),
        cycles: cpu.cycles,
        SREG: cpu.SREG,
        SP: cpu.SP,
        progMem: cpu.progMem.reduce((value, next) => value + next)
    }
    console.table(state)
}

function logState(cpuPtr: number) {
    const data = getData(cpuPtr);
    const state = {
        data: data.reduce((value, next) => value + next),
        PC: avr8js.getPC(cpuPtr),
        cycles: avr8js.getCycles(cpuPtr)
    }
    console.table(state)
}

function findDifferences(arr1: Uint32Array, arr2: Uint32Array): Uint32Array {
    return arr1.filter(x => !arr2.includes(x))
}

export function newCPU(program: Uint16Array): number {
    console.log('Setup CPU')
    const bufRef = assembly.__newArrayBuffer(program.buffer);
    const ptr = avr8js.newCPU(bufRef);
    console.log('Setup CPU - finished.');
    return ptr
}

export function runProgram(cpuPtr: number, cycles: number) {
    console.log('Run program for ' + cycles + " cycles");
    avr8js.runProgram(cpuPtr, cycles);
    console.log('Program executed.')
}

export function getData(cpuPtr: number): Uint8Array {
    const ptr = avr8js.getData(cpuPtr);
    return assembly.__getUint8ArrayView(ptr);
}

export function addWriteHook(cpuPtr: number, addr: number, hook: (value: number, oldValue: number, addr: number, mask: number) => boolean) {
    writeHooks[addr] = hook
    avr8js.addWriteHook(cpuPtr, addr)
}

// function testIO() {
//     const portB = new avr8js.AVRIOPort(cpu, avr8js.portBConfig)
//     portB.addListener(() => {
//         console.log('Pin state: ' + portB.pinState(5))
//     });
// }
