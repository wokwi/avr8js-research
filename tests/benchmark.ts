import {was as assembly} from "../src";
import {Suite} from "benchmark";

export function run() {
    console.log("===", "Start benchmarking...", "===")
    simpleAddComparison()
    console.log("===", "Benchmarking finished ", "===")
}

function simpleAddComparison() {
    console.log("=", "Run add comparison", "=")
    const suite = new Suite
    const start = 0;
    const end = 10000;
    suite.add('Assembly external loop add', () => {
        let res = 0;
        for (let i = start; i < end; ++i) {
            res = assembly.add(res, i)
        }
    }).add('Assembly internal loop add', () => {
        assembly.addLoop(start, end)
    }).add('JavaScript loop add', () => {
        let res = 0;
        for (let i = start; i < end; ++i) {
            res += i;
        }
    }).on('cycle', event => {
        console.log(String(event.target))
    }).run();
    console.log("=", "Add comparison finished", "=")
}

function runAvrAssembly() {
    console.log("=", "Run assembly AVR instruction", "=")
    const opcode = 0x2400
    //FIXME WebAssembly memory error in cpu
    //TODO Add correct opcode
    assembly.runAddInstruction(opcode)
    console.log("=", "Assembly AVR instruction finished", "=")
}