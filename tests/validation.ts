import {wasm} from "../src";
import * as assert from "assert"

export function run() {
    console.log("===", "Run validations...", "===")
    assertAssemblyAdd()
    console.log("===", "Validations successful", "===")
}

function assertAssemblyAdd() {
    console.log("Validate: assembly add")
    assert.strictEqual(wasm.exports.add(1, 2), 3);
}