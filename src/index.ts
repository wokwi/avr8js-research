import type * as MyModule from "../build/module";
import {ASUtil, ResultObject, instantiateSync} from "@assemblyscript/loader/umd";
import {readFileSync} from "fs";

export const writeHooks = {}

// @ts-ignore
export const was: ResultObject & { exports: ASUtil & typeof MyModule } = instantiateSync<typeof MyModule>(readFileSync(__dirname + "/../build/untouched.wasm"), {
    /* imports */
    index: {
        log: (ptr: number) => console.log('WASM-Log: ' + was.exports.__getString(ptr)),
        callWriteHook(value: number, oldValue: number, addr: number, mask : number): boolean {
            return writeHooks[addr](value, oldValue, addr, mask)
        }
    }
})