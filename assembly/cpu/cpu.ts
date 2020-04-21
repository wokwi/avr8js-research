/**
 * AVR 8 CPU data structures
 * Part of AVR8js
 *
 * Copyright (C) 2019, Uri Shaked
 */

const registerSpace : u64 = 0x100;

export class CPU {
  readonly data: Uint8Array = new Uint8Array(<i32>(this.sramBytes + registerSpace));
  readonly data16 : Uint16Array = Uint16Array.wrap(this.data.buffer);
  readonly dataView : DataView = new DataView(this.data.buffer);
  readonly progBytes : Uint8Array= Uint8Array.wrap(this.progMem.buffer);
  readonly pc22Bits : bool = this.progBytes.length > 0x20000;

  pc : u32= 0;
  cycles : u64 = 0;

  constructor(public progMem: Uint16Array, private sramBytes: u64 = 8192) {
    this.reset();
  }

  reset() : void{
    this.data.fill(0);
    this.SP = <u16> this.data.length - 1;
  }

  readData(addr: u16) : u8{
    return this.data[addr];
  }

  writeData(addr: u16, value: u8) : void{
    this.data[addr] = value;
  }

  get SP() : u16{
    return this.dataView.getUint16(93, true);
  }

  set SP(value: u16) {
    this.dataView.setUint16(93, value, true);
  }

  get SREG() : u8{
    return this.data[95];
  }

  get interruptsEnabled() : bool{
    return !!(this.SREG & 0x80);
  }
}
