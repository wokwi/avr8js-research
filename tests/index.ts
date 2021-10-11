import * as validation from './validation'
import * as bm from './benchmark'
import {runTest, runWrapperTest} from "./cpu-test";

console.log("=====", "Start WebAssembly tests...", "=====")
validation.run()
bm.run()
runTest();
runWrapperTest();

console.log("=====", 'WebAssembly tests finished ✅', "=====")