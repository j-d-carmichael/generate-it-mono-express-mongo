import { describe, it, expect } from 'vitest';
import toDecimal from '../toDecimal';

describe('toDecimal', () => {
  it('should ceil when no decimals given, and round to fixed decimals when provided', () => {
    expect(toDecimal(3.2)).toBe(4);
    expect(toDecimal(-2.7)).toBe(-2);
    expect(toDecimal(3.14159, 2)).toBe(3.14);
    expect(toDecimal(0, 2)).toBe(0);
  });
});
