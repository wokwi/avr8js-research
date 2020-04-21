import {was} from "../src";
import * as assert from "assert"

export function run() {
    console.log("===","Run validations...","===")
    assertAssemblyAdd()
    console.log("===", "Validations successful", "===")
}

function assertAssemblyAdd() {
    console.log("Validate: assembly add")
    assert.equal(was.add(1, 2), 3);
}