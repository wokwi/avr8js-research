import {wasm as assembly} from "../src";
import * as Benchmark from "benchmark";
const Suite = Benchmark.Suite

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
    suite.add('JavaScript loop - JavaScript add', () => {
        let res = 0;
        for (let i = start; i < end; ++i) {
            res += i;
        }
    }).add('JavaScript loop - Assembly add', () => {
        let res = 0;
        for (let i = start; i < end; ++i) {
            res = assembly.exports.add(res, i)
        }
    }).add('Assembly loop - Assembly add', () => {
        assembly.exports.addLoop(start, end)
    }).on('cycle', event => {
        console.log(String(event.target))
    }).on('complete', event => {
        console.log("-", "Result", "-")
        const first = event.currentTarget[0]
        const third = event.currentTarget[2]
        logDiff(first, third)
    }).run();
    console.log("=", "Add comparison finished", "=")
}

function logDiff(target1, target2) {
    const faster = target1.hz > target2.hz ? target1 : target2;
    const slower = target1.hz < target2.hz ? target1 : target2;
    const diff = (faster.hz - slower.hz) / slower.hz * 100;
    console.log(`'${faster.name}' is ~${diff.toFixed(2)}% faster than '${slower.name}'.`);
}