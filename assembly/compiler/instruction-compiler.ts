/**
 * AVR-8 Instruction Simulation
 * Part of AVR8js
 *
 * Reference: http://ww1.microchip.com/downloads/en/devicedoc/atmel-0856-avr-instruction-set-manual.pdf
 *
 * Instruction timing is currently based on ATmega328p (see the Instruction Set Summary at the end of
 * the datasheet)
 *
 * Copyright (C) 2019, 2020 Uri Shaked
 */

export function isTwoWordInstruction(opcode: u16): boolean {
    return (
        /* LDS */
        (opcode & 0xfe0f) === 0x9000 ||
        /* STS */
        (opcode & 0xfe0f) === 0x9200 ||
        /* CALL */
        (opcode & 0xfe0e) === 0x940e ||
        /* JMP */
        (opcode & 0xfe0e) === 0x940c
    );
}

export function compileInstruction(opcode: u16, opcodeData: u16 = 0, pc22Bits: boolean = false): string {
    if ((opcode & 0xfc00) === 0x1c00) {
        return `
    /* ADC, 0001 11rd dddd rrrr */
    const d = data[${(opcode & 0x1f0) >> 4}];
    const r = data[${(opcode & 0xf) | ((opcode & 0x200) >> 5)}];
    const sum = d + r + (data[95] & 1);
    const R = sum & 255;
    data[${(opcode & 0x1f0) >> 4}] = R;
    let sreg = data[95] & 0xc0;
    sreg |= R ? 0 : 2;
    sreg |= 128 & R ? 4 : 0;
    sreg |= (R ^ r) & (d ^ R) & 128 ? 8 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    sreg |= sum & 256 ? 1 : 0;
    sreg |= 1 & ((d & r) | (r & ~R) | (~R & d)) ? 0x20 : 0;
    data[95] = sreg;
    `;
    } else if ((opcode & 0xfc00) === 0xc00) {
        return `
    /* ADD, 0000 11rd dddd rrrr */
    const d = data[${(opcode & 0x1f0) >> 4}];
    const r = data[${(opcode & 0xf) | ((opcode & 0x200) >> 5)}];
    const R = (d + r) & 255;
    data[${(opcode & 0x1f0) >> 4}] = R;
    let sreg = data[95] & 0xc0;
    sreg |= R ? 0 : 2;
    sreg |= 128 & R ? 4 : 0;
    sreg |= (R ^ r) & (R ^ d) & 128 ? 8 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    sreg |= (d + r) & 256 ? 1 : 0;
    sreg |= 1 & ((d & r) | (r & ~R) | (~R & d)) ? 0x20 : 0;
    data[95] = sreg;
  `;
    } else if ((opcode & 0xff00) === 0x9600) {
        return `
    /* ADIW, 1001 0110 KKdd KKKK */
    const addr = ${2 * ((opcode & 0x30) >> 4) + 24};
    const value = dataView.getUint16(addr, true);
    const R = (value + (${(opcode & 0xf) | ((opcode & 0xc0) >> 2)})) & 0xffff;
    dataView.setUint16(addr, R, true);
    let sreg = data[95] & 0xe0;
    sreg |= R ? 0 : 2;
    sreg |= 0x8000 & R ? 4 : 0;
    sreg |= ~value & R & 0x8000 ? 8 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    sreg |= ~R & value & 0x8000 ? 1 : 0;
    data[95] = sreg;
    cpu.cycles++;
    `;
    } else if ((opcode & 0xfc00) === 0x2000) {
        return `
    /* AND, 0010 00rd dddd rrrr */
    const R = data[${(opcode & 0x1f0) >> 4}] & data[${(opcode & 0xf) | ((opcode & 0x200) >> 5)}];
    data[${(opcode & 0x1f0) >> 4}] = R;
    let sreg = data[95] & 0xe1;
    sreg |= R ? 0 : 2;
    sreg |= 128 & R ? 4 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    data[95] = sreg;
    `;
    } else if ((opcode & 0xf000) === 0x7000) {
        return `
    /* ANDI, 0111 KKKK dddd KKKK */
    const R = data[${((opcode & 0xf0) >> 4) + 16}] & ${(opcode & 0xf) | ((opcode & 0xf00) >> 4)};
    data[${((opcode & 0xf0) >> 4) + 16}] = R;
    let sreg = data[95] & 0xe1;
    sreg |= R ? 0 : 2;
    sreg |= 128 & R ? 4 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    data[95] = sreg;
    `;
    } else if ((opcode & 0xfe0f) === 0x9405) {
        return `
    /* ASR, 1001 010d dddd 0101 */
    const value = data[${(opcode & 0x1f0) >> 4}];
    const R = (value >>> 1) | (128 & value);
    data[${(opcode & 0x1f0) >> 4}] = R;
    let sreg = data[95] & 0xe0;
    sreg |= R ? 0 : 2;
    sreg |= 128 & R ? 4 : 0;
    sreg |= value & 1;
    sreg |= ((sreg >> 2) & 1) ^ (sreg & 1) ? 8 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    data[95] = sreg;
    `;
    } else if ((opcode & 0xff8f) === 0x9488) {
        return `
    /* BCLR, 1001 0100 1sss 1000 */
    data[95] &= ${~(1 << ((opcode & 0x70) >> 4))};
    `;
    } else if ((opcode & 0xfe08) === 0xf800) {
        return `
    /* BLD, 1111 100d dddd 0bbb */
    const b = ${opcode & 7};
    const d = ${(opcode & 0x1f0) >> 4};
    data[d] = (~(1 << b) & data[d]) | (((data[95] >> 6) & 1) << b);
    `;
    } else if ((opcode & 0xfc00) === 0xf400) {
        return `
    /* BRBC, 1111 01kk kkkk ksss */
    if (!(data[95] & ${1 << (opcode & 7)})) {
      cpu.pc = cpu.pc + ${((opcode & 0x1f8) >> 3) - (opcode & 0x200 ? 0x40 : 0)};
      cpu.cycles++;
    }
    `;
    } else if ((opcode & 0xfc00) === 0xf000) {
        return `
    /* BRBS, 1111 00kk kkkk ksss */
    if (data[95] & ${1 << (opcode & 7)}) {
      cpu.pc = cpu.pc + ${((opcode & 0x1f8) >> 3) - (opcode & 0x200 ? 0x40 : 0)};
      cpu.cycles++;
    }
    `;
    } else if ((opcode & 0xff8f) === 0x9408) {
        return `
    /* BSET, 1001 0100 0sss 1000 */
    data[95] |= ${1 << ((opcode & 0x70) >> 4)};
    `;
    } else if ((opcode & 0xfe08) === 0xfa00) {
        return `
    /* BST, 1111 101d dddd 0bbb */
    const d = data[${(opcode & 0x1f0) >> 4}];
    const b = ${opcode & 7};
    data[95] = (data[95] & 0xbf) | ((d >> b) & 1 ? 0x40 : 0);
    `;
    } else if ((opcode & 0xfe0e) === 0x940e) {
        return `
    /* CALL, 1001 010k kkkk 111k kkkk kkkk kkkk kkkk */
    const k = ${opcodeData | ((opcode & 1) << 16) | ((opcode & 0x1f0) << 13)};
    const ret = cpu.pc + 2;
    const sp = dataView.getUint16(93, true);
    data[sp] = 255 & ret;
    data[sp - 1] = (ret >> 8) & 255;
    ${pc22Bits ? 'data[sp - 2] = (ret >> 16) & 255;' : ''}
    dataView.setUint16(93, sp - ${pc22Bits ? 3 : 2}, true);
    cpu.pc = k - 1;
    cpu.cycles += ${pc22Bits ? 4 : 3};
    `;
    } else if ((opcode & 0xff00) === 0x9800) {
        const A = opcode & 0xf8;
        const b = opcode & 7;
        return `
    /* CBI, 1001 1000 AAAA Abbb */
    const R = cpu.readData(${(A >> 3) + 32});
    cpu.writeData(${(A >> 3) + 32}, R & ${~(1 << b)});
    `;
    } else if ((opcode & 0xfe0f) === 0x9400) {
        return `
    /* COM, 1001 010d dddd 0000 */
    const d = ${(opcode & 0x1f0) >> 4};
    const R = 255 - data[d];
    data[d] = R;
    let sreg = (data[95] & 0xe1) | 1;
    sreg |= R ? 0 : 2;
    sreg |= 128 & R ? 4 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    data[95] = sreg;
    `;
    } else if ((opcode & 0xfc00) === 0x1400) {
        return `
    /* CP, 0001 01rd dddd rrrr */
    const val1 = data[${(opcode & 0x1f0) >> 4}];
    const val2 = data[${(opcode & 0xf) | ((opcode & 0x200) >> 5)}];
    const R = val1 - val2;
    let sreg = data[95] & 0xc0;
    sreg |= R ? 0 : 2;
    sreg |= 128 & R ? 4 : 0;
    sreg |= 0 !== ((val1 ^ val2) & (val1 ^ R) & 128) ? 8 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    sreg |= val2 > val1 ? 1 : 0;
    sreg |= 1 & ((~val1 & val2) | (val2 & R) | (R & ~val1)) ? 0x20 : 0;
    data[95] = sreg;
    `;
    } else if ((opcode & 0xfc00) === 0x400) {
        return `
    /* CPC, 0000 01rd dddd rrrr */
    const arg1 = data[${(opcode & 0x1f0) >> 4}];
    const arg2 = data[${(opcode & 0xf) | ((opcode & 0x200) >> 5)}];
    let sreg = data[95];
    const r = arg1 - arg2 - (sreg & 1);
    sreg = (sreg & 0xc0) | (!r && (sreg >> 1) & 1 ? 2 : 0) | (arg2 + (sreg & 1) > arg1 ? 1 : 0);
    sreg |= 128 & r ? 4 : 0;
    sreg |= (arg1 ^ arg2) & (arg1 ^ r) & 128 ? 8 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    sreg |= 1 & ((~arg1 & arg2) | (arg2 & r) | (r & ~arg1)) ? 0x20 : 0;
    data[95] = sreg;
    `;
    } else if ((opcode & 0xf000) === 0x3000) {
        return `
    /* CPI, 0011 KKKK dddd KKKK */
    const arg1 = data[${((opcode & 0xf0) >> 4) + 16}];
    const arg2 = ${(opcode & 0xf) | ((opcode & 0xf00) >> 4)};
    const r = arg1 - arg2;
    let sreg = data[95] & 0xc0;
    sreg |= r ? 0 : 2;
    sreg |= 128 & r ? 4 : 0;
    sreg |= (arg1 ^ arg2) & (arg1 ^ r) & 128 ? 8 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    sreg |= arg2 > arg1 ? 1 : 0;
    sreg |= 1 & ((~arg1 & arg2) | (arg2 & r) | (r & ~arg1)) ? 0x20 : 0;
    data[95] = sreg;
    `;
    } else if ((opcode & 0xfc00) === 0x1000) {
        const skipSize = isTwoWordInstruction(opcodeData) ? 2 : 1;
        return `
    /* CPSE, 0001 00rd dddd rrrr */
    if (data[${(opcode & 0x1f0) >> 4}] === data[${(opcode & 0xf) | ((opcode & 0x200) >> 5)}]) {
      cpu.pc += ${skipSize};
      cpu.cycles += ${skipSize};
    }
    `;
    } else if ((opcode & 0xfe0f) === 0x940a) {
        return `
    /* DEC, 1001 010d dddd 1010 */
    const value = data[${(opcode & 0x1f0) >> 4}];
    const R = value - 1;
    data[${(opcode & 0x1f0) >> 4}] = R;
    let sreg = data[95] & 0xe1;
    sreg |= R ? 0 : 2;
    sreg |= 128 & R ? 4 : 0;
    sreg |= 128 === value ? 8 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    data[95] = sreg;
    `;
    } else if (opcode === 0x9519) {
        return `
    /* EICALL, 1001 0101 0001 1001 */
    const retAddr = cpu.pc + 1;
    const sp = dataView.getUint16(93, true);
    const eind = data[0x5c];
    data[sp] = retAddr & 255;
    data[sp - 1] = (retAddr >> 8) & 255;
    data[sp - 2] = (retAddr >> 16) & 255;
    dataView.setUint16(93, sp - 3, true);
    cpu.pc = ((eind << 16) | dataView.getUint16(30, true)) - 1;
    cpu.cycles += 3;
    `;
    } else if (opcode === 0x9419) {
        return `
    /* EIJMP, 1001 0100 0001 1001 */
    const eind = data[0x5c];
    cpu.pc = ((eind << 16) | dataView.getUint16(30, true)) - 1;
    cpu.cycles++;
    `;
    } else if (opcode === 0x95d8) {
        return `
    /* ELPM, 1001 0101 1101 1000 */
    const rampz = data[0x5b];
    data[0] = cpu.progBytes[(rampz << 16) | dataView.getUint16(30, true)];
    cpu.cycles += 2;
    `;
    } else if ((opcode & 0xfe0f) === 0x9006) {
        return `
    /* ELPM(REG), 1001 000d dddd 0110 */
    const rampz = data[0x5b];
    data[${(opcode & 0x1f0) >> 4}] =
      cpu.progBytes[(rampz << 16) | dataView.getUint16(30, true)];
    cpu.cycles += 2;
    `;
    } else if ((opcode & 0xfe0f) === 0x9007) {
        return `
    /* ELPM(INC), 1001 000d dddd 0111 */
    const rampz = data[0x5b];
    const i = dataView.getUint16(30, true);
    data[${(opcode & 0x1f0) >> 4}] = cpu.progBytes[(rampz << 16) | i];
    dataView.setUint16(30, i + 1, true);
    if (i === 0xffff) {
      data[0x5b] = (rampz + 1) % (cpu.progBytes.length >> 16);
    }
    cpu.cycles += 2;
    `;
    } else if ((opcode & 0xfc00) === 0x2400) {
        return `
    /* EOR, 0010 01rd dddd rrrr */
    const R = data[${(opcode & 0x1f0) >> 4}] ^ data[${(opcode & 0xf) | ((opcode & 0x200) >> 5)}];
    data[${(opcode & 0x1f0) >> 4}] = R;
    let sreg = data[95] & 0xe1;
    sreg |= R ? 0 : 2;
    sreg |= 128 & R ? 4 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    data[95] = sreg;
    `;
    } else if ((opcode & 0xff88) === 0x308) {
        return `
    /* FMUL, 0000 0011 0ddd 1rrr */
    const v1 = data[${((opcode & 0x70) >> 4) + 16}];
    const v2 = data[${(opcode & 7) + 16}];
    const R = (v1 * v2) << 1;
    dataView.setUint16(0, R, true);
    data[95] = (data[95] & 0xfc) | (0xffff & R ? 0 : 2) | ((v1 * v2) & 0x8000 ? 1 : 0);
    cpu.cycles++;
    `;
    } else if ((opcode & 0xff88) === 0x380) {
        return `
    /* FMULS, 0000 0011 1ddd 0rrr */
    const v1 = dataView.getInt8(${((opcode & 0x70) >> 4) + 16});
    const v2 = dataView.getInt8(${(opcode & 7) + 16});
    const R = (v1 * v2) << 1;
    dataView.setInt16(0, R, true);
    data[95] = (data[95] & 0xfc) | (0xffff & R ? 0 : 2) | ((v1 * v2) & 0x8000 ? 1 : 0);
    cpu.cycles++;
    `;
    } else if ((opcode & 0xff88) === 0x388) {
        return `
    /* FMULSU, 0000 0011 1ddd 1rrr */
    const v1 = dataView.getInt8(${((opcode & 0x70) >> 4) + 16});
    const v2 = data[(opcode & 7) + 16];
    const R = (v1 * v2) << 1;
    dataView.setInt16(0, R, true);
    data[95] = (data[95] & 0xfc) | (0xffff & R ? 2 : 0) | ((v1 * v2) & 0x8000 ? 1 : 0);
    cpu.cycles++;
    `;
    } else if (opcode === 0x9509) {
        return `
    /* ICALL, 1001 0101 0000 1001 */
    const retAddr = cpu.pc + 1;
    const sp = dataView.getUint16(93, true);
    data[sp] = retAddr & 255;
    data[sp - 1] = (retAddr >> 8) & 255;
    ${pc22Bits ? `data[sp - 2] = (retAddr >> 16) & 255;` : ''}
    dataView.setUint16(93, sp - ${pc22Bits ? 3 : 2}, true);
    cpu.pc = dataView.getUint16(30, true) - 1;
    cpu.cycles += ${pc22Bits ? 3 : 2};
    `;
    } else if (opcode === 0x9409) {
        return `
    /* IJMP, 1001 0100 0000 1001 */
    cpu.pc = dataView.getUint16(30, true) - 1;
    cpu.cycles++;
    `;
    } else if ((opcode & 0xf800) === 0xb000) {
        return `
    /* IN, 1011 0AAd dddd AAAA */
    const i = cpu.readData(${((opcode & 0xf) | ((opcode & 0x600) >> 5)) + 32});
    data[${(opcode & 0x1f0) >> 4}] = i;
    `;
    } else if ((opcode & 0xfe0f) === 0x9403) {
        return `
    /* INC, 1001 010d dddd 0011 */
    const d = data[${(opcode & 0x1f0) >> 4}];
    const r = (d + 1) & 255;
    data[${(opcode & 0x1f0) >> 4}] = r;
    let sreg = data[95] & 0xe1;
    sreg |= r ? 0 : 2;
    sreg |= 128 & r ? 4 : 0;
    sreg |= 127 === d ? 8 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    data[95] = sreg;
    `;
    } else if ((opcode & 0xfe0e) === 0x940c) {
        return `
    /* JMP, 1001 010k kkkk 110k kkkk kkkk kkkk kkkk */
    cpu.pc = ${(opcodeData | ((opcode & 1) << 16) | ((opcode & 0x1f0) << 13)) - 1};
    cpu.cycles += 2;
    `;
    } else if ((opcode & 0xfe0f) === 0x9206) {
        return `
    /* LAC, 1001 001r rrrr 0110 */
    const r = ${(opcode & 0x1f0) >> 4};
    const clear = data[r];
    const value = cpu.readData(dataView.getUint16(30, true));
    cpu.writeData(dataView.getUint16(30, true), value & (255 - clear));
    data[r] = value;
    `;
    } else if ((opcode & 0xfe0f) === 0x9205) {
        return `
    /* LAS, 1001 001r rrrr 0101 */
    const r = ${(opcode & 0x1f0) >> 4};
    const set = data[r];
    const value = cpu.readData(dataView.getUint16(30, true));
    cpu.writeData(dataView.getUint16(30, true), value | set);
    data[r] = value;
    `;
    } else if ((opcode & 0xfe0f) === 0x9207) {
        return `
    /* LAT, 1001 001r rrrr 0111 */
    const r = data[${(opcode & 0x1f0) >> 4}];
    const R = cpu.readData(dataView.getUint16(30, true));
    cpu.writeData(dataView.getUint16(30, true), r ^ R);
    data[${(opcode & 0x1f0) >> 4}] = R;
    `;
    } else if ((opcode & 0xf000) === 0xe000) {
        return `
    /* LDI, 1110 KKKK dddd KKKK */
    data[${((opcode & 0xf0) >> 4) + 16}] = ${(opcode & 0xf) | ((opcode & 0xf00) >> 4)};
    `;
    } else if ((opcode & 0xfe0f) === 0x9000) {
        return `
    /* LDS, 1001 000d dddd 0000 kkkk kkkk kkkk kkkk */
    cpu.cycles++;
    const value = cpu.readData(${opcodeData});
    data[${(opcode & 0x1f0) >> 4}] = value;
    cpu.pc++;
    `;
    } else if ((opcode & 0xfe0f) === 0x900c) {
        return `
    /* LDX, 1001 000d dddd 1100 */
    cpu.cycles++;
    data[${(opcode & 0x1f0) >> 4}] = cpu.readData(dataView.getUint16(26, true));
    `;
    } else if ((opcode & 0xfe0f) === 0x900d) {
        return `
    /* LDX(INC), 1001 000d dddd 1101 */
    const x = dataView.getUint16(26, true);
    cpu.cycles++;
    data[${(opcode & 0x1f0) >> 4}] = cpu.readData(x);
    dataView.setUint16(26, x + 1, true);
    `;
    } else if ((opcode & 0xfe0f) === 0x900e) {
        return `
    /* LDX(DEC), 1001 000d dddd 1110 */
    const x = dataView.getUint16(26, true) - 1;
    dataView.setUint16(26, x, true);
    cpu.cycles++;
    data[${(opcode & 0x1f0) >> 4}] = cpu.readData(x);
    `;
    } else if ((opcode & 0xfe0f) === 0x8008) {
        return `
    /* LDY, 1000 000d dddd 1000 */
    cpu.cycles++;
    data[${(opcode & 0x1f0) >> 4}] = cpu.readData(dataView.getUint16(28, true));
    `;
    } else if ((opcode & 0xfe0f) === 0x9009) {
        return `
    /* LDY(INC), 1001 000d dddd 1001 */
    const y = dataView.getUint16(28, true);
    cpu.cycles++;
    data[${(opcode & 0x1f0) >> 4}] = cpu.readData(y);
    dataView.setUint16(28, y + 1, true);
    `;
    } else if ((opcode & 0xfe0f) === 0x900a) {
        return `
    /* LDY(DEC), 1001 000d dddd 1010 */
    const y = dataView.getUint16(28, true) - 1;
    dataView.setUint16(28, y, true);
    cpu.cycles++;
    data[${(opcode & 0x1f0) >> 4}] = cpu.readData(y);
    `;
    } else if (
        (opcode & 0xd208) === 0x8008 &&
        (opcode & 7) | ((opcode & 0xc00) >> 7) | ((opcode & 0x2000) >> 8)
    ) {
        return `
    /* LDDY, 10q0 qq0d dddd 1qqq */
    cpu.cycles++;
    data[${(opcode & 0x1f0) >> 4}] = cpu.readData(
      dataView.getUint16(28, true) +
        ${(opcode & 7) | ((opcode & 0xc00) >> 7) | ((opcode & 0x2000) >> 8)}
    );
    `;
    } else if ((opcode & 0xfe0f) === 0x8000) {
        return `
    /* LDZ, 1000 000d dddd 0000 */
    cpu.cycles++;
    data[${(opcode & 0x1f0) >> 4}] = cpu.readData(dataView.getUint16(30, true));
    `;
    } else if ((opcode & 0xfe0f) === 0x9001) {
        return `
    /* LDZ(INC), 1001 000d dddd 0001 */
    const z = dataView.getUint16(30, true);
    cpu.cycles++;
    data[${(opcode & 0x1f0) >> 4}] = cpu.readData(z);
    dataView.setUint16(30, z + 1, true);
    `;
    } else if ((opcode & 0xfe0f) === 0x9002) {
        return `
    /* LDZ(DEC), 1001 000d dddd 0010 */
    const z = dataView.getUint16(30, true) - 1;
    dataView.setUint16(30, z, true);
    cpu.cycles++;
    data[${(opcode & 0x1f0) >> 4}] = cpu.readData(z);
    `;
    } else if (
        (opcode & 0xd208) === 0x8000 &&
        (opcode & 7) | ((opcode & 0xc00) >> 7) | ((opcode & 0x2000) >> 8)
    ) {
        return `
    /* LDDZ, 10q0 qq0d dddd 0qqq */
    cpu.cycles++;
    data[${(opcode & 0x1f0) >> 4}] = cpu.readData(
      dataView.getUint16(30, true) +
        ${(opcode & 7) | ((opcode & 0xc00) >> 7) | ((opcode & 0x2000) >> 8)}
    );
    `;
    } else if (opcode === 0x95c8) {
        return `
    /* LPM, 1001 0101 1100 1000 */
    data[0] = cpu.progBytes[dataView.getUint16(30, true)];
    cpu.cycles += 2;
    `;
    } else if ((opcode & 0xfe0f) === 0x9004) {
        return `
    /* LPM(REG), 1001 000d dddd 0100 */
    data[${(opcode & 0x1f0) >> 4}] = cpu.progBytes[dataView.getUint16(30, true)];
    cpu.cycles += 2;
    `;
    } else if ((opcode & 0xfe0f) === 0x9005) {
        return `
    /* LPM(INC), 1001 000d dddd 0101 */
    const i = dataView.getUint16(30, true);
    data[${(opcode & 0x1f0) >> 4}] = cpu.progBytes[i];
    dataView.setUint16(30, i + 1, true);
    cpu.cycles += 2;
    `;
    } else if ((opcode & 0xfe0f) === 0x9406) {
        return `
    /* LSR, 1001 010d dddd 0110 */
    const value = data[${(opcode & 0x1f0) >> 4}];
    const R = value >>> 1;
    data[${(opcode & 0x1f0) >> 4}] = R;
    let sreg = data[95] & 0xe0;
    sreg |= R ? 0 : 2;
    sreg |= value & 1;
    sreg |= ((sreg >> 2) & 1) ^ (sreg & 1) ? 8 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    data[95] = sreg;
    `;
    } else if ((opcode & 0xfc00) === 0x2c00) {
        return `
    /* MOV, 0010 11rd dddd rrrr */
    data[${(opcode & 0x1f0) >> 4}] = data[${(opcode & 0xf) | ((opcode & 0x200) >> 5)}];
    `;
    } else if ((opcode & 0xff00) === 0x100) {
        const r2 = 2 * (opcode & 0xf);
        const d2 = 2 * ((opcode & 0xf0) >> 4);
        return `
    /* MOVW, 0000 0001 dddd rrrr */
    data[${d2}] = data[${r2}];
    data[${d2 + 1}] = data[${r2 + 1}];
    `;
    } else if ((opcode & 0xfc00) === 0x9c00) {
        return `
    /* MUL, 1001 11rd dddd rrrr */
    const R = data[${(opcode & 0x1f0) >> 4}] * data[${(opcode & 0xf) | ((opcode & 0x200) >> 5)}];
    dataView.setUint16(0, R, true);
    data[95] = (data[95] & 0xfc) | (0xffff & R ? 0 : 2) | (0x8000 & R ? 1 : 0);
    cpu.cycles++;
    `;
    } else if ((opcode & 0xff00) === 0x200) {
        return `
    /* MULS, 0000 0010 dddd rrrr */
    const R =
      dataView.getInt8(${((opcode & 0xf0) >> 4) + 16}) * dataView.getInt8(${(opcode & 0xf) + 16});
    dataView.setInt16(0, R, true);
    data[95] = (data[95] & 0xfc) | (0xffff & R ? 0 : 2) | (0x8000 & R ? 1 : 0);
    cpu.cycles++;
    `;
    } else if ((opcode & 0xff88) === 0x300) {
        return `
    /* MULSU, 0000 0011 0ddd 0rrr */
    const R = dataView.getInt8(${((opcode & 0x70) >> 4) + 16}) * data[${(opcode & 7) + 16}];
    dataView.setInt16(0, R, true);
    data[95] = (data[95] & 0xfc) | (0xffff & R ? 0 : 2) | (0x8000 & R ? 1 : 0);
    cpu.cycles++;
    `;
    } else if ((opcode & 0xfe0f) === 0x9401) {
        return `
    /* NEG, 1001 010d dddd 0001 */
    const d = ${(opcode & 0x1f0) >> 4};
    const value = data[d];
    const R = 0 - value;
    data[d] = R;
    let sreg = data[95] & 0xc0;
    sreg |= R ? 0 : 2;
    sreg |= 128 & R ? 4 : 0;
    sreg |= 128 === R ? 8 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    sreg |= R ? 1 : 0;
    sreg |= 1 & (R | value) ? 0x20 : 0;
    data[95] = sreg;
    `;
    } else if (opcode === 0) {
        return `
    /* NOP, 0000 0000 0000 0000 */
    /* NOP */
    `;
    } else if ((opcode & 0xfc00) === 0x2800) {
        return `
    /* OR, 0010 10rd dddd rrrr */
    const R = data[${(opcode & 0x1f0) >> 4}] | data[${(opcode & 0xf) | ((opcode & 0x200) >> 5)}];
    data[${(opcode & 0x1f0) >> 4}] = R;
    let sreg = data[95] & 0xe1;
    sreg |= R ? 0 : 2;
    sreg |= 128 & R ? 4 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    data[95] = sreg;
    `;
    } else if ((opcode & 0xf000) === 0x6000) {
        return `
    /* SBR, 0110 KKKK dddd KKKK */
    const R = data[${((opcode & 0xf0) >> 4) + 16}] | ${(opcode & 0xf) | ((opcode & 0xf00) >> 4)};
    data[${((opcode & 0xf0) >> 4) + 16}] = R;
    let sreg = data[95] & 0xe1;
    sreg |= R ? 0 : 2;
    sreg |= 128 & R ? 4 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    data[95] = sreg;
    `;
    } else if ((opcode & 0xf800) === 0xb800) {
        return `
    /* OUT, 1011 1AAr rrrr AAAA */
    cpu.writeData(${((opcode & 0xf) | ((opcode & 0x600) >> 5)) + 32}, data[${
            (opcode & 0x1f0) >> 4
        }]);
    `;
    } else if ((opcode & 0xfe0f) === 0x900f) {
        return `
    /* POP, 1001 000d dddd 1111 */
    const value = dataView.getUint16(93, true) + 1;
    dataView.setUint16(93, value, true);
    data[${(opcode & 0x1f0) >> 4}] = data[value];
    cpu.cycles++;
    `;
    } else if ((opcode & 0xfe0f) === 0x920f) {
        return `
    /* PUSH, 1001 001d dddd 1111 */
    const value = dataView.getUint16(93, true);
    data[value] = data[${(opcode & 0x1f0) >> 4}];
    dataView.setUint16(93, value - 1, true);
    cpu.cycles++;
    `;
    } else if ((opcode & 0xf000) === 0xd000) {
        return `
    /* RCALL, 1101 kkkk kkkk kkkk */
    const k = ${(opcode & 0x7ff) - (opcode & 0x800 ? 0x800 : 0)};
    const retAddr = cpu.pc + 1;
    const sp = dataView.getUint16(93, true);
    data[sp] = 255 & retAddr;
    data[sp - 1] = (retAddr >> 8) & 255;
    ${pc22Bits ? `data[sp - 2] = (retAddr >> 16) & 255` : ''}
    dataView.setUint16(93, sp - ${pc22Bits ? 3 : 2}, true);
    cpu.pc += k;
    cpu.cycles += ${pc22Bits ? 3 : 2};
    `;
    } else if (opcode === 0x9508) {
        return `
    /* RET, 1001 0101 0000 1000 */
    const i = dataView.getUint16(93, true) + ${pc22Bits ? 3 : 2};
    dataView.setUint16(93, i, true);
    cpu.pc = (data[i - 1] << 8) + data[i] - 1;
    ${pc22Bits ? 'cpu.pc |= data[i - 2] << 16' : ''}
    cpu.cycles += ${pc22Bits ? 4 : 3};
    `;
    } else if (opcode === 0x9518) {
        return `
    /* RETI, 1001 0101 0001 1000 */
    const i = dataView.getUint16(93, true) + ${pc22Bits ? 3 : 2};
    dataView.setUint16(93, i, true);
    cpu.pc = (data[i - 1] << 8) + data[i] - 1;
    ${pc22Bits ? `cpu.pc |= data[i - 2] << 16;` : ''} 
    cpu.cycles += ${pc22Bits ? 4 : 3};
    data[95] |= 0x80; // Enable interrupts
    `;
    } else if ((opcode & 0xf000) === 0xc000) {
        return `
    /* RJMP, 1100 kkkk kkkk kkkk */
    cpu.pc = cpu.pc + ${(opcode & 0x7ff) - (opcode & 0x800 ? 0x800 : 0)};
    cpu.cycles++;
    `;
    } else if ((opcode & 0xfe0f) === 0x9407) {
        return `
    /* ROR, 1001 010d dddd 0111 */
    const d = data[${(opcode & 0x1f0) >> 4}];
    const r = (d >>> 1) | ((data[95] & 1) << 7);
    data[${(opcode & 0x1f0) >> 4}] = r;
    let sreg = data[95] & 0xe0;
    sreg |= r ? 0 : 2;
    sreg |= 128 & r ? 4 : 0;
    sreg |= 1 & d ? 1 : 0;
    sreg |= ((sreg >> 2) & 1) ^ (sreg & 1) ? 8 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    data[95] = sreg;
    `;
    } else if ((opcode & 0xfc00) === 0x800) {
        return `
    /* SBC, 0000 10rd dddd rrrr */
    const val1 = data[${(opcode & 0x1f0) >> 4}];
    const val2 = data[${(opcode & 0xf) | ((opcode & 0x200) >> 5)}];
    let sreg = data[95];
    const R = val1 - val2 - (sreg & 1);
    data[${(opcode & 0x1f0) >> 4}] = R;
    sreg = (sreg & 0xc0) | (!R && (sreg >> 1) & 1 ? 2 : 0) | (val2 + (sreg & 1) > val1 ? 1 : 0);
    sreg |= 128 & R ? 4 : 0;
    sreg |= (val1 ^ val2) & (val1 ^ R) & 128 ? 8 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    sreg |= 1 & ((~val1 & val2) | (val2 & R) | (R & ~val1)) ? 0x20 : 0;
    data[95] = sreg;
    `;
    } else if ((opcode & 0xf000) === 0x4000) {
        return `
    /* SBCI, 0100 KKKK dddd KKKK */
    const val1 = data[${((opcode & 0xf0) >> 4) + 16}];
    const val2 = ${(opcode & 0xf) | ((opcode & 0xf00) >> 4)};
    let sreg = data[95];
    const R = val1 - val2 - (sreg & 1);
    data[${((opcode & 0xf0) >> 4) + 16}] = R;
    sreg = (sreg & 0xc0) | (!R && (sreg >> 1) & 1 ? 2 : 0) | (val2 + (sreg & 1) > val1 ? 1 : 0);
    sreg |= 128 & R ? 4 : 0;
    sreg |= (val1 ^ val2) & (val1 ^ R) & 128 ? 8 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    sreg |= 1 & ((~val1 & val2) | (val2 & R) | (R & ~val1)) ? 0x20 : 0;
    data[95] = sreg;
    `;
    } else if ((opcode & 0xff00) === 0x9a00) {
        const target = ((opcode & 0xf8) >> 3) + 32;
        return `
    /* SBI, 1001 1010 AAAA Abbb */
    cpu.writeData(${target}, cpu.readData(${target}) | ${1 << (opcode & 7)});
    cpu.cycles++;
    `;
    } else if ((opcode & 0xff00) === 0x9900) {
        const skipSize = isTwoWordInstruction(opcodeData) ? 2 : 1;
        return `
    /* SBIC, 1001 1001 AAAA Abbb */
    const value = cpu.readData(${((opcode & 0xf8) >> 3) + 32});
    if (!(value & ${1 << (opcode & 7)})) {
      cpu.cycles += ${skipSize};
      cpu.pc += ${skipSize};
    }
    `;
    } else if ((opcode & 0xff00) === 0x9b00) {
        const skipSize = isTwoWordInstruction(opcodeData) ? 2 : 1;
        return `
    /* SBIS, 1001 1011 AAAA Abbb */
    const value = cpu.readData(${((opcode & 0xf8) >> 3) + 32});
    if (value & ${1 << (opcode & 7)}) {
      cpu.cycles += ${skipSize};
      cpu.pc += ${skipSize};
    }
    `;
    } else if ((opcode & 0xff00) === 0x9700) {
        return `
    /* SBIW, 1001 0111 KKdd KKKK */
    const i = ${2 * ((opcode & 0x30) >> 4) + 24};
    const a = dataView.getUint16(i, true);
    const l = ${(opcode & 0xf) | ((opcode & 0xc0) >> 2)};
    const R = a - l;
    dataView.setUint16(i, R, true);
    let sreg = data[95] & 0xc0;
    sreg |= R ? 0 : 2;
    sreg |= 0x8000 & R ? 4 : 0;
    sreg |= a & ~R & 0x8000 ? 8 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    sreg |= l > a ? 1 : 0;
    sreg |= 1 & ((~a & l) | (l & R) | (R & ~a)) ? 0x20 : 0;
    data[95] = sreg;
    cpu.cycles++;
    `;
    } else if ((opcode & 0xfe08) === 0xfc00) {
        const skipSize = isTwoWordInstruction(opcodeData) ? 2 : 1;
        return `
    /* SBRC, 1111 110r rrrr 0bbb */
    if (!(data[${(opcode & 0x1f0) >> 4}] & ${1 << (opcode & 7)})) {
      cpu.cycles += ${skipSize};
      cpu.pc += ${skipSize};
    }
    `;
    } else if ((opcode & 0xfe08) === 0xfe00) {
        const skipSize = isTwoWordInstruction(opcodeData) ? 2 : 1;
        return `
    /* SBRS, 1111 111r rrrr 0bbb */
    if (data[${(opcode & 0x1f0) >> 4}] & ${1 << (opcode & 7)}) {
      cpu.cycles += ${skipSize};
      cpu.pc += ${skipSize};
    }
    `;
    } else if (opcode === 0x9588) {
        return `
    /* SLEEP, 1001 0101 1000 1000 */
    /* not implemented */
    `;
    } else if (opcode === 0x95e8) {
        return `
    /* SPM, 1001 0101 1110 1000 */
    /* not implemented */
    `;
    } else if (opcode === 0x95f8) {
        return `
    /* SPM(INC), 1001 0101 1111 1000 */
    /* not implemented */
    `;
    } else if ((opcode & 0xfe0f) === 0x9200) {
        return `
    /* STS, 1001 001d dddd 0000 kkkk kkkk kkkk kkkk */
    const value = data[${(opcode & 0x1f0) >> 4}];
    const addr = ${opcodeData};
    cpu.writeData(addr, value);
    cpu.pc++;
    cpu.cycles++;
    `;
    } else if ((opcode & 0xfe0f) === 0x920c) {
        return `
    /* STX, 1001 001r rrrr 1100 */
    cpu.writeData(dataView.getUint16(26, true), data[${(opcode & 0x1f0) >> 4}]);
    cpu.cycles++;
    `;
    } else if ((opcode & 0xfe0f) === 0x920d) {
        return `
    /* STX(INC), 1001 001r rrrr 1101 */
    const x = dataView.getUint16(26, true);
    cpu.writeData(x, data[${(opcode & 0x1f0) >> 4}]);
    dataView.setUint16(26, x + 1, true);
    cpu.cycles++;
    `;
    } else if ((opcode & 0xfe0f) === 0x920e) {
        return `
    /* STX(DEC), 1001 001r rrrr 1110 */
    const i = data[${(opcode & 0x1f0) >> 4}];
    const x = dataView.getUint16(26, true) - 1;
    dataView.setUint16(26, x, true);
    cpu.writeData(x, i);
    cpu.cycles++;
    `;
    } else if ((opcode & 0xfe0f) === 0x8208) {
        return `
    /* STY, 1000 001r rrrr 1000 */
    cpu.writeData(dataView.getUint16(28, true), data[${(opcode & 0x1f0) >> 4}]);
    cpu.cycles++;
    `;
    } else if ((opcode & 0xfe0f) === 0x9209) {
        return `
    /* STY(INC), 1001 001r rrrr 1001 */
    const i = data[${(opcode & 0x1f0) >> 4}];
    const y = dataView.getUint16(28, true);
    cpu.writeData(y, i);
    dataView.setUint16(28, y + 1, true);
    cpu.cycles++;
    `;
    } else if ((opcode & 0xfe0f) === 0x920a) {
        return `
    /* STY(DEC), 1001 001r rrrr 1010 */
    const i = data[${(opcode & 0x1f0) >> 4}];
    const y = dataView.getUint16(28, true) - 1;
    dataView.setUint16(28, y, true);
    cpu.writeData(y, i);
    cpu.cycles++;
    `;
    } else if (
        (opcode & 0xd208) === 0x8208 &&
        (opcode & 7) | ((opcode & 0xc00) >> 7) | ((opcode & 0x2000) >> 8)
    ) {
        return `
    /* STDY, 10q0 qq1r rrrr 1qqq */
    cpu.writeData(
      dataView.getUint16(28, true) +
        ${(opcode & 7) | ((opcode & 0xc00) >> 7) | ((opcode & 0x2000) >> 8)},
      data[${(opcode & 0x1f0) >> 4}]
    );
    cpu.cycles++;
    `;
    } else if ((opcode & 0xfe0f) === 0x8200) {
        return `
    /* STZ, 1000 001r rrrr 0000 */
    cpu.writeData(dataView.getUint16(30, true), data[${(opcode & 0x1f0) >> 4}]);
    cpu.cycles++;
    `;
    } else if ((opcode & 0xfe0f) === 0x9201) {
        return `
    /* STZ(INC), 1001 001r rrrr 0001 */
    const z = dataView.getUint16(30, true);
    cpu.writeData(z, data[${(opcode & 0x1f0) >> 4}]);
    dataView.setUint16(30, z + 1, true);
    cpu.cycles++;
    `;
    } else if ((opcode & 0xfe0f) === 0x9202) {
        return `
    /* STZ(DEC), 1001 001r rrrr 0010 */
    const i = data[${(opcode & 0x1f0) >> 4}];
    const z = dataView.getUint16(30, true) - 1;
    dataView.setUint16(30, z, true);
    cpu.writeData(z, i);
    cpu.cycles++;
    `;
    } else if (
        (opcode & 0xd208) === 0x8200 &&
        (opcode & 7) | ((opcode & 0xc00) >> 7) | ((opcode & 0x2000) >> 8)
    ) {
        return `
    /* STDZ, 10q0 qq1r rrrr 0qqq */
    cpu.writeData(
      dataView.getUint16(30, true) +
        ${(opcode & 7) | ((opcode & 0xc00) >> 7) | ((opcode & 0x2000) >> 8)},
      data[${(opcode & 0x1f0) >> 4}]
    );
    cpu.cycles++;
    `;
    } else if ((opcode & 0xfc00) === 0x1800) {
        return `
    /* SUB, 0001 10rd dddd rrrr */
    const val1 = data[${(opcode & 0x1f0) >> 4}];
    const val2 = data[${(opcode & 0xf) | ((opcode & 0x200) >> 5)}];
    const R = val1 - val2;

    data[${(opcode & 0x1f0) >> 4}] = R;
    let sreg = data[95] & 0xc0;
    sreg |= R ? 0 : 2;
    sreg |= 128 & R ? 4 : 0;
    sreg |= (val1 ^ val2) & (val1 ^ R) & 128 ? 8 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    sreg |= val2 > val1 ? 1 : 0;
    sreg |= 1 & ((~val1 & val2) | (val2 & R) | (R & ~val1)) ? 0x20 : 0;
    data[95] = sreg;
    `;
    } else if ((opcode & 0xf000) === 0x5000) {
        return `
    /* SUBI, 0101 KKKK dddd KKKK */
    const val1 = data[${((opcode & 0xf0) >> 4) + 16}];
    const val2 = ${(opcode & 0xf) | ((opcode & 0xf00) >> 4)};
    const R = val1 - val2;
    data[${((opcode & 0xf0) >> 4) + 16}] = R;
    let sreg = data[95] & 0xc0;
    sreg |= R ? 0 : 2;
    sreg |= 128 & R ? 4 : 0;
    sreg |= (val1 ^ val2) & (val1 ^ R) & 128 ? 8 : 0;
    sreg |= ((sreg >> 2) & 1) ^ ((sreg >> 3) & 1) ? 0x10 : 0;
    sreg |= val2 > val1 ? 1 : 0;
    sreg |= 1 & ((~val1 & val2) | (val2 & R) | (R & ~val1)) ? 0x20 : 0;
    data[95] = sreg;
    `;
    } else if ((opcode & 0xfe0f) === 0x9402) {
        return `
    /* SWAP, 1001 010d dddd 0010 */
    const d = ${(opcode & 0x1f0) >> 4};
    const i = data[d];
    data[d] = ((15 & i) << 4) | ((240 & i) >>> 4);
    `;
    } else if (opcode === 0x95a8) {
        return `
    /* WDR, 1001 0101 1010 1000 */
    /* not implemented */
    `;
    } else if ((opcode & 0xfe0f) === 0x9204) {
        return `
    /* XCH, 1001 001r rrrr 0100 */
    const r = ${(opcode & 0x1f0) >> 4};
    const val1 = data[r];
    const val2 = data[dataView.getUint16(30, true)];
    data[dataView.getUint16(30, true)] = val1;
    data[r] = val2;
    `;
    } else {
        return '';
    }
}