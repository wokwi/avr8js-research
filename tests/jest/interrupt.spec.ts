import { CPU } from '../../src/glue/cpu-wrapper';
import {REGISTERS as R, SREG_FLAGS as SREG} from "./helper";

describe('avrInterrupt', () => {
  it('should execute interrupt handler', () => {
    const cpu = new CPU(new Uint16Array(0x8000));
    expect<boolean>(cpu.pc22Bits).toEqual(false);

    cpu.pc = 0x520;
    cpu.data[R.SPH] = 0;
    cpu.data[R.SP] = 0x80; // SP <- 0x80
    cpu.data[R.SREG] = SREG.I | SREG.C; // SREG <- I------C
    cpu.avrInterrupt(5);
    expect(cpu.cycles).toEqual(2);
    expect(cpu.pc).toEqual(5);
    expect(cpu.data[R.SP]).toEqual(0x7e); // SP
    expect(cpu.data[0x80]).toEqual(0x20); // Return addr low
    expect(cpu.data[0x7f]).toEqual(0x5); // Return addr high
    expect(cpu.data[R.SREG]).toEqual(SREG.C); // SREG: -------C
  });

  it('should push a 3-byte return address when running in 22-bit PC mode (issue #58)', () => {
    const cpu = new CPU(new Uint16Array(0x80000));
    expect<boolean>(cpu.pc22Bits).toEqual(true);

    cpu.pc = 0x10520;
    cpu.data[R.SPH] = 0;
    cpu.data[R.SP] = 0x80; // SP <- 0x80
    cpu.data[R.SREG] = SREG.I | SREG.C; // SREG <- I------C

    cpu.avrInterrupt(5);
    expect(cpu.cycles).toEqual(2);
    expect(cpu.pc).toEqual(5);
    expect(cpu.data[R.SP]).toEqual(0x7d); // SP should decrement by 3
    expect(cpu.data[0x80]).toEqual(0x20); // Return addr low
    expect(cpu.data[0x7f]).toEqual(0x05); // Return addr high
    expect(cpu.data[0x7e]).toEqual(0x1); // Return addr extended
    expect(cpu.data[R.SREG]).toEqual(SREG.C); // SREG: -------C
  });
});
