import * as validation from './validation'
import * as bm from './benchmark'
import {compareCPUs, runTest, testWrapper} from "./cpu-test";

console.log("=====", "Start WebAssembly tests...", "=====")
// validation.run()
// bm.run()
// runTest();
// testWrapper();

compareCPUs()

console.log("=====", 'WebAssembly tests finished ✅', "=====")