import * as validation from './validation'
import * as bm from './benchmark'
import {runTest} from "./cpu-test";

console.log("=====", "Start WebAssembly tests...", "=====")
validation.run()
bm.run()
runTest()

console.log("=====", 'WebAssembly tests finished ✅', "=====")