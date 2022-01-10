export namespace REGISTERS {
    export const r1 = 1;
    export const r0 = 0;
    export const r2 = 2;
    export const r3 = 3;
    export const r4 = 4;
    export const r5 = 5;
    export const r6 = 6;
    export const r7 = 7;
    export const r8 = 8;
    export const r16 = 16;
    export const r17 = 17;
    export const r18 = 18;
    export const r19 = 19;
    export const r20 = 20;
    export const r21 = 21;
    export const r22 = 22;
    export const r23 = 23;
    export const r24 = 24;
    export const r26 = 26;
    export const r27 = 27;
    export const r31 = 31;
    export const X = 26;
    export const Y = 28;
    export const Z = 30;
    export const RAMPZ = 0x5b;
    export const EIND = 0x5c;
    export const SP = 93;
    export const SPH = 94;
    export const SREG = 95;
}

/*  - SREG Bits: ITHSVNZC
*   - Flag descriptions copied from AVR Instruction Set Manual
*/
export namespace SREG_FLAGS {
    /* Carry Flag */
    export const C = 0b00000001;
    /* Zero Flag */
    export const Z = 0b00000010;
    /* Negative Flag */
    export const N = 0b00000100;
    /* Two’s complement overflow indicator */
    export const V = 0b00001000;
    /* N ⊕ V, for signed tests */
    export const S = 0b00010000;
    /* Half Carry Flag */
    export const H = 0b00100000;
    /* Transfer bit used by BLD and BST instructions */
    export const T = 0b01000000;
    /* Global Interrupt Enable/Disable Flag */
    export const I = 0b10000000;
}
