import {was} from "../src";
import {loadHexBytes} from "../compile/compile";

const assembly = was.exports

export function runTest() {
    loadHexBytes("compile/program.hex")
        .then(runProgram)
        .then(() => console.log('Returned'), (err) => console.error(err))
}

export async function runProgram(bytes: Uint16Array) {
    const bufRef = assembly.__newArrayBuffer(bytes.buffer);
    console.log('Start program');
    assembly.runProgram(bufRef);
    console.log('Program executed')
}
