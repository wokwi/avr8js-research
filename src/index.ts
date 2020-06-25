const fs = require("fs");
const loader = require("@assemblyscript/loader");
export const was = loader.instantiateSync(fs.readFileSync(__dirname + "/../build/untouched.wasm"), { /* imports */ })