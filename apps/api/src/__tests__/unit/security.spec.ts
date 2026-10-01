import { SanitizePipe } from '../../common/pipes/sanitize.pipe';
import { generateSecureToken, safeCompare } from '../../common/utils/crypto.util';

// ─── SanitizePipe ─────────────────────────────────────────────────────────────

describe('SanitizePipe', () => {
  let pipe: SanitizePipe;

  beforeEach(() => { pipe = new SanitizePipe(); });

  it('strips HTML tags from strings', () => {
    expect(pipe.transform('<script>alert(1)</script>hello', {} as any)).toBe('hello');
    expect(pipe.transform('<b>bold</b>', {} as any)).toBe('bold');
    expect(pipe.transform('<img src=x onerror=alert(1)>', {} as any)).toBe('');
  });

  it('strips null bytes', () => {
    expect(pipe.transform('hello\0world', {} as any)).toBe('hello world'.replace(' ', ''));
    // More precisely:
    const result = pipe.transform('abc\0def', {} as any) as string;
    expect(result).not.toContain('\0');
  });

  it('trims whitespace', () => {
    expect(pipe.transform('  hello  ', {} as any)).toBe('hello');
  });

  it('recursively sanitizes object values', () => {
    const input = { name: '<b>Alice</b>', bio: 'Normal text' };
    const result = pipe.transform(input, {} as any) as any;
    expect(result.name).toBe('Alice');
    expect(result.bio).toBe('Normal text');
  });

  it('recursively sanitizes arrays', () => {
    const input = ['<script>x</script>', 'safe'];
    const result = pipe.transform(input, {} as any) as string[];
    expect(result[0]).toBe('');
    expect(result[1]).toBe('safe');
  });

  it('passes through numbers and booleans unchanged', () => {
    expect(pipe.transform(42, {} as any)).toBe(42);
    expect(pipe.transform(true, {} as any)).toBe(true);
    expect(pipe.transform(null, {} as any)).toBeNull();
  });

  it('handles nested objects', () => {
    const input = { user: { name: '<script>hack</script>' } };
    const result = pipe.transform(input, {} as any) as any;
    expect(result.user.name).toBe('');
  });
});

// ─── crypto.util ─────────────────────────────────────────────────────────────

describe('generateSecureToken', () => {
  it('generates a hex string of correct length', () => {
    const token = generateSecureToken(32);
    expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
  });

  it('generates unique tokens each call', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateSecureToken(16)));
    expect(tokens.size).toBe(100);
  });

  it('never uses Math.random (uses crypto.randomBytes)', () => {
    const mathRandomSpy = jest.spyOn(Math, 'random');
    generateSecureToken(32);
    expect(mathRandomSpy).not.toHaveBeenCalled();
    mathRandomSpy.mockRestore();
  });
});

describe('safeCompare', () => {
  it('returns true for equal strings', () => {
    expect(safeCompare('abc', 'abc')).toBe(true);
  });

  it('returns false for different strings', () => {
    expect(safeCompare('abc', 'xyz')).toBe(false);
  });

  it('returns false for different lengths', () => {
    expect(safeCompare('abc', 'abcd')).toBe(false);
  });

  it('returns false for empty vs non-empty', () => {
    expect(safeCompare('', 'a')).toBe(false);
  });

  it('handles empty strings', () => {
    expect(safeCompare('', '')).toBe(true);
  });
});
