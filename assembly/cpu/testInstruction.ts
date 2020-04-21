import {CPU} from "./cpu";

export function ADD(cpu : CPU, opcode : u16) : void{
    const d = cpu.data[(opcode & 0x1f0) >> 4];
    const r = cpu.data[(opcode & 0xf) | ((opcode & 0x200) >> 5)];
    const sum = d + r + (cpu.data[95] & 1);
    const R = sum & 255;
    cpu.data[(opcode & 0x1f0) >> 4] = R;
    let sreg = cpu.data[95] & 0xc0;
    sreg |= R ? 0 : 2;
    sreg |= 128 & R ? 4 : 0;
    sreg |= (R ^ r) & (d ^ R) & 128 ? 8 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    sreg |= sum & 256 ? 1 : 0;
    sreg |= 1 & ((d & r) | (r & ~R) | (~R & d)) ? 0x20 : 0;
    cpu.data[95] = sreg;
}