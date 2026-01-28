describe('Simple TS Test', () => {
    it('should pass TS', () => {
        const sum = (a: number, b: number): number => a + b;
        expect(sum(1, 2)).toBe(3);
    });
});
