import fetch from "node-fetch-commonjs";
import * as fs from "fs";
import * as util from "util";
import {parse} from "intel-hex";

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const url = 'https://hexi.wokwi.com';

export interface HexiResult {
    stdout: string;
    stderr: string;
    hex: string;
}

export async function loadHexBytes(path: string): Promise<Uint16Array> {
    const hexBuffer = await loadHex(path);
    const {data} = parse(hexBuffer);
    const array = new Uint8Array(data);
    return new Uint16Array(array.buffer)
}

export async function loadHex(path: string): Promise<Buffer> {
    return await readFile(path);
}

export async function compile(path: string) {
    const program = await readFile(path)
    const result = await buildHex(program.toString())
    if (!result.hex) {
        throw result.stderr
    }
    console.log(result.stdout)
    await writeFile(path.substring(0, path.lastIndexOf('.')) + ".hex", result.hex);
}

export async function buildHex(source: string) {
    const resp = await fetch(url + '/build', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({sketch: source})
    });
    return (await resp.json()) as HexiResult;
}
