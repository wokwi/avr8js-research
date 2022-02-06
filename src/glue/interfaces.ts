import {u16, u8 } from "../../build/module";

export type AVRClockEventCallback = () => void;

export interface AVRInterruptConfig {
    address: u8;
    enableRegister: u16;
    enableMask: u8;
    flagRegister: u16;
    flagMask: u8;
    /*
    DG Removed optional due missing assembly script support.
    Should default to false instead.
    */
    constant: boolean;
    inverseFlag: boolean;
}