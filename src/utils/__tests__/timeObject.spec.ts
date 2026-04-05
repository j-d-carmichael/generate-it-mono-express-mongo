import { describe, it, expect } from 'vitest';
import timeObject from '../timeObject';

describe('timeObject', () => {
  it('should return year, zero-padded month/day, and HH:MM:SS time for a given date', () => {
    const result = timeObject(new Date('2024-03-05T09:07:03'));
    expect(result.year).toBe('2024');
    expect(result.month).toBe('03');
    expect(result.day).toBe('05');
    expect(result.time).toMatch(/^09:07:03$/);
  });

  it('should default to current date when no argument is provided', () => {
    const result = timeObject();
    expect(result.year).toBe(String(new Date().getFullYear()));
    expect(result.month).toMatch(/^\d{2}$/);
    expect(result.day).toMatch(/^\d{2}$/);
    expect(result.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});
