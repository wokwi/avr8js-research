import {was, writeHooks} from "../src";
import {loadBlink} from "../compile/programs";
import {CPU} from '../src/cpu-wrapper';
import {loadHexBytes} from "../compile/compile";

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
            addWriteHook(cpuPtr, 0x23, (value, oldValue, addr) => {
                console.log('Got callback from addr: ' + addr + ' [' + value + ',' + oldValue + ']');
                return false
            })
            addWriteHook(cpuPtr, 0x24, (value, oldValue, addr) => {
                console.log('Got callback from addr: ' + addr + ' [' + value + ',' + oldValue + ']');
                return false
            })
            addWriteHook(cpuPtr, 0x25, (value, oldValue, addr) => {
                console.log('Got callback from addr: ' + addr + ' [' + value + ',' + oldValue + ']');
                return false
            })

            const id = avr8js.getCPUClassId();
            const isCPU = assembly.__instanceof(cpuPtr, id);

            console.log('isCPU: ' + isCPU);

            const testInstance = assembly.Test.wrap(assembly.newTestInstance());
            console.log(assembly.__getString(testInstance.str));

            logState(cpuPtr)
            runProgram(cpuPtr, 1000);
            logState(cpuPtr)
            // const difference = findDifferences(dataBefore, dataAfter);
            // console.log(difference)
        })
        .then(() => console.log('Finished program.'), (err) => console.error(err));
}

export function runWrapperTest() {
    loadHexBytes("compile/program.hex")
    // new Promise((resolve, reject) => {
    //     const program = new Uint16Array(16384);
    //     loadBlink(program);
    //     resolve(program)
    // })
        .then((program: Uint16Array) => new CPU(was, program))
        .then((cpu: CPU) => {
            cpu.printState();
            cpu.runProgram(2000);
            cpu.printState();
        })
        .then(() => console.log('Finished program.'), (err) => console.error(err));
}

function logState(cpuPtr: number) {
    const data = getData(cpuPtr);
    console.log('data: ' + data.reduce((value, next) => value + next))
    console.log('PC: ' + avr8js.getPC(cpuPtr))
    console.log('cycles: ' + avr8js.getCycles(cpuPtr))
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

export function addWriteHook(cpuPtr: number, addr: number, hook: (value: number, oldValue: number, addr: number) => boolean) {
    writeHooks[addr] = hook
    avr8js.addWriteHook(cpuPtr, addr)
}

// function testIO() {
//     const portB = new avr8js.AVRIOPort(cpu, avr8js.portBConfig)
//     portB.addListener(() => {
//         console.log('Pin state: ' + portB.pinState(5))
//     });
// }
