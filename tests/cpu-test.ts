import {was, writeHooks} from "../src";
import {loadBlink} from "../compile/programs";
import {CPU} from '../src/cpu-wrapper';
import {loadHexBytes} from "../compile/compile";
import {avrInstruction, CPU as CPU2} from "avr8js";

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

export function compareCPUs() {
    loadHexBytes("compile/program.hex")
        // new Promise((resolve, reject) => {
        //     const program = new Uint16Array(16384);
        //     loadBlink(program);
        //     resolve(program)
        // })
        .then((program: Uint16Array) => {
            const cycles = 2000
            runWrapper(program, cycles)
            runAvr(program, cycles)
        })
        .then(() => console.log('Finished program.'), (err) => console.error(err));
}

function runWrapper(program: Uint16Array, cycles: number = 2000) {
    const cpu = new CPU(was, program)
    cpu.printState();
    cpu.runProgram(cycles);
    cpu.printState();
}

function runAvr(program: Uint16Array, cycles: number = 2000) {
    const cpu = new CPU2(program)
    logAvrState(cpu)
    for (let i = 0; i < 2000; i++) {
        avrInstruction(cpu)
    }
    logAvrState(cpu)
}

function logAvrState(cpu: CPU2) {
    const state = {
        data: cpu.data.reduce((value, next) => value + next),
        PC: cpu.pc,
        cycles: cpu.cycles,
        SREG: cpu.SREG,
        SP: cpu.SP
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
