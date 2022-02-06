//Import JS loader function for calling the external JS hooks
export declare function callReadHook(addr: u16): u8;

export declare function callWriteHook(value: u8, oldValue: u8, addr: u16, mask: u8): boolean;

export declare function callClockEventCallback(callbackId: u32): void;