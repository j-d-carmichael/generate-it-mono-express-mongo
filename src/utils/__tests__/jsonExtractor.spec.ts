import { describe, it, expect } from 'vitest';
import { jsonExtractor } from '../jsonExtractor';

describe('jsonExtractor', () => {
  it('should extract a single JSON object from surrounding text', () => {
    const input = 'Here is the result: {"name": "Alice", "age": 30} hope that helps!';
    const result = jsonExtractor(input, true);
    expect(result).toEqual({ name: 'Alice', age: 30 });
  });

  it('should extract multiple JSON objects from a string', () => {
    const input = 'First: {"a": 1} and second: {"b": 2}';
    const result = jsonExtractor(input);
    expect(result).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('should handle nested JSON objects', () => {
    const input = 'data: {"outer": {"inner": true}}';
    const result = jsonExtractor(input, true);
    expect(result).toEqual({ outer: { inner: true } });
  });

  it('should return empty array when no JSON is found', () => {
    expect(jsonExtractor('no json here')).toEqual([]);
  });

  it('should return undefined for getOnly1st when no JSON is found', () => {
    expect(jsonExtractor('no json here', true)).toBeUndefined();
  });

  it('should handle malformed JSON gracefully', () => {
    const input = '{"valid": 1} then {"broken: bad} then {"also": 2}';
    const result = jsonExtractor(input);
    expect(result).toEqual([{ valid: 1 }, { also: 2 }]);
  });
});
