import {was, writeHooks} from "../src";
import {loadBlink} from "../compile/programs";

const assembly = was.exports

export function runTest() {
    // loadHexBytes("compile/program.hex")
    new Promise((resolve, reject) => {
        const program = new Uint16Array(16384);
        loadBlink(program);
        resolve(program)
    })
        .then(setupCPU)
        .then(() => {
            //Add hook
            addWriteHook(0x23, (value, oldValue, addr) => {
                console.log('Got callback from addr: ' + addr + ' [' + value + ',' + oldValue + ']');
                return false
            })
            addWriteHook(0x24, (value, oldValue, addr) => {
                console.log('Got callback from addr: ' + addr + ' [' + value + ',' + oldValue + ']');
                return false
            })
            addWriteHook(0x25, (value, oldValue, addr) => {
                console.log('Got callback from addr: ' + addr + ' [' + value + ',' + oldValue + ']');
                return false
            })

            console.log(assembly.getPC())
            console.log(assembly.getCycles())
            const dataBefore = getData();
            // console.log(dataBefore)
            runProgram(5000);
            const dataAfter = getData();
            // console.log(dataAfter)
            const difference = findDifferences(dataBefore, dataAfter);
            // console.log(difference)
            console.log(assembly.getPC())
            console.log(assembly.getCycles())
        })
        .then(() => console.log('Finished program.'), (err) => console.error(err))
}

function findDifferences(arr1: Uint32Array, arr2: Uint32Array): Uint32Array {
    return arr1.filter(x => !arr2.includes(x))
}

export function setupCPU(program: Uint16Array) {
    console.log('Setup CPU')
    const bufRef = assembly.__newArrayBuffer(program.buffer);
    assembly.setupCPU(bufRef)
    console.log('Setup CPU - finished.')
}

export function runProgram(cycles: number) {
    console.log('Run program for ' + cycles + " cycles");
    assembly.runProgram(cycles);
    console.log('Program executed.')
}

export function getDataView(): ArrayBufferView {
    const ptr = assembly.getDataPtr();
    return assembly.__getArrayView(ptr);
}

export function getData(): Uint32Array {
    const ptr = assembly.getDataPtr();
    return assembly.__getUint32Array(ptr)
}

export function addWriteHook(addr: number, hook: (value: number, oldValue: number, addr: number) => boolean) {
    writeHooks[addr] = hook
    assembly.addWriteHook(addr)
}

// function testIO() {
//     const portB = new avr8js.AVRIOPort(cpu, avr8js.portBConfig)
//     portB.addListener(() => {
//         console.log('Pin state: ' + portB.pinState(5))
//     });
// }
