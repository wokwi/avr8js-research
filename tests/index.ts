import * as validation from './validation'
import * as bm from './benchmark'

console.log("=====", "Start WebAssembly tests...", "=====")
validation.run()
bm.run()

console.log("=====", 'WebAssembly tests finished ✅', "=====")