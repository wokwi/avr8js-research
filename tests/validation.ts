import {was} from "../src";
import * as assert from "assert"

export function run() {
    console.log("===", "Run validations...", "===")
    assertAssemblyAdd()
    assertCompile()
    console.log("===", "Validations successful", "===")
}

function assertAssemblyAdd() {
    console.log("Validate: assembly add")
    assert.strictEqual(was.exports.add(1, 2), 3);
}

function assertCompile() {
    console.log("Validate: testCompile")
    const a: string = was.exports.__getString(was.exports.testCompile());
    console.log("Type of " + typeof a)
    console.log("Value " + a)
}