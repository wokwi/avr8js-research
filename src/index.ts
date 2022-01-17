import type * as MyModule from "../build/module";
import {ASUtil, ResultObject, instantiateSync} from "@assemblyscript/loader";
import {readFileSync} from "fs";

const modulePath = __dirname + "/../build/untouched.wasm"
export const writeHooks = {}

// @ts-ignore
export const wasm: ResultObject & { exports: ASUtil & typeof MyModule } = instantiateSync<typeof MyModule>(readFileSync(modulePath), {
    /* imports */
    index: {
        log: (ptr: number) => console.log('WASM-Log: ' + wasm.exports.__getString(ptr)),
        "cpu-bridge": {
            callWriteHook(value: number, oldValue: number, addr: number, mask: number): boolean {
                return writeHooks[addr](value, oldValue, addr, mask)
            }
        }
    }
})