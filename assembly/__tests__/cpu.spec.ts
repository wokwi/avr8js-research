import {CPU} from "../avr8js/cpu/cpu";

type ITestEvent = Map<u32, u32>; // Expected cycles, actual cycles

describe('cpu', () => {
    it('should set initial value of SP to the last byte of internal SRAM', () => {
        const cpu = new CPU(new Uint16Array(1024), 0x1000);
        expect(cpu.SP).toBe(0x10ff);
    });

    describe('events', () => {
        it('should execute queued events after the given number of cycles has passed', () => {
            const cpu = new CPU(new Uint16Array(1024), 0x1000);
            const events: ITestEvent = new Map();

            const values = [1,4,10]
            for (let j = 0, len = values.length, i = values[j]; j < len; i = values[++j]) {
                cpu.addClockEvent(() => events.set(i, cpu.cycles), i);
            }
            for (let i = 0; i < 10; i++) {
                cpu.cycles++;
                cpu.tick();
            }
            expect(events.get(1)).toBe(1)
            expect(events.get(4)).toBe(4)
            expect(events.get(10)).toBe(10)
        });

        it('should correctly sort the events when added in reverse order', () => {
            const cpu = new CPU(new Uint16Array(1024), 0x1000);
            const events: ITestEvent = new Map();

            const values = [10,4,1]
            for (let j = 0, len = values.length, i = values[j]; j < len; i = values[++j]) {
                cpu.addClockEvent(() => events.set(i, cpu.cycles), i);
            }
            for (let i = 0; i < 10; i++) {
                cpu.cycles++;
                cpu.tick();
            }
            expect(events.get(1)).toBe(1)
            expect(events.get(4)).toBe(4)
            expect(events.get(10)).toBe(10)
        });

        describe('updateClockEvent', () => {
            it('should update the number of cycles for the given clock event', () => {
                const cpu = new CPU(new Uint16Array(1024), 0x1000);
                const events: ITestEvent = new Map();
                const callbacks = [];
                const values = [1,4,10]
                for (let j = 0, len = values.length, i = values[j]; j < len; i = values[++j]) {
                    callbacks[i] = cpu.addClockEvent(() => events.set(i, cpu.cycles), i);
                }
                cpu.updateClockEvent(callbacks[4], 2);
                cpu.updateClockEvent(callbacks[1], 12);
                for (let i = 0; i < 14; i++) {
                    cpu.cycles++;
                    cpu.tick();
                }
                expect(events.get(4)).toBe(2)
                expect(events.get(10)).toBe(10)
                expect(events.get(1)).toBe(12)
            });

            describe('clearClockEvent', () => {
                it('should remove the given clock event', () => {
                    const cpu = new CPU(new Uint16Array(1024), 0x1000);
                    const events: ITestEvent = new Map();
                    const callbacks = [];
                    const values = [1,4,10]
                    for (let j = 0, len = values.length, i = values[j]; j < len; i = values[++j]) {
                        callbacks[i] = cpu.addClockEvent(() => events.set(i, cpu.cycles), i);
                    }
                    cpu.clearClockEvent(callbacks[4]);
                    for (let i = 0; i < 10; i++) {
                        cpu.cycles++;
                        cpu.tick();
                    }
                    expect(events.get(1)).toBe(1)
                    expect(events.get(10)).toBe(10)
                });

                it('should return false if the provided clock event is not scheduled', () => {
                    const cpu = new CPU(new Uint16Array(1024), 0x1000);
                    const event4 = cpu.addClockEvent(() => 0, 4);
                    const event10 = cpu.addClockEvent(() => 0, 10);
                    cpu.addClockEvent(() => 0, 1);

                    // Both event should be successfully removed
                    expect(cpu.clearClockEvent(event4)).toBe(true);
                    expect(cpu.clearClockEvent(event10)).toBe(true);
                    // And now we should get false, as these events have already been removed
                    expect(cpu.clearClockEvent(event4)).toBe(false);
                    expect(cpu.clearClockEvent(event10)).toBe(false);
                });
            });
        });
    });
});
