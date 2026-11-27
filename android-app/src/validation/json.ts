export function requireThat(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function object(value: unknown, label: string, allowed?: readonly string[], required = allowed): Record<string, unknown> {
  requireThat(typeof value === 'object' && value !== null && !Array.isArray(value), `Invalid ${label}.`);
  const record = value as Record<string, unknown>;
  if (allowed) requireThat(Object.keys(record).every(key => allowed.includes(key)), `Unexpected ${label} field.`);
  if (required) requireThat(required.every(key => Object.hasOwn(record, key)), `Missing ${label} field.`);
  return record;
}

export function list(value: unknown, label: string, minimum = 0): unknown[] {
  requireThat(Array.isArray(value) && value.length >= minimum, `Invalid ${label} list.`);
  return value;
}

export function text(value: unknown, label: string, allowEmpty = false, maximum = 16000): string {
  requireThat(typeof value === 'string' && value.length <= maximum && (allowEmpty || Boolean(value.trim())), `Invalid ${label} text.`);
  return value;
}

export function integer(value: unknown, label: string, minimum = 0): number {
  requireThat(typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum, `Invalid ${label}.`);
  return value;
}

export function uuid(value: unknown): string {
  requireThat(typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value), 'Invalid UUID.');
  return value;
}

export function timestamp(value: unknown): string {
  requireThat(typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value, 'Invalid ISO timestamp.');
  return value;
}

export function parseJson(source: string, maximumBytes: number): unknown {
  requireThat(typeof source === 'string', 'Expected JSON text.');
  let bytes = 0;
  for (const character of source) {
    const point = character.codePointAt(0)!;
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
    requireThat(bytes <= maximumBytes, 'JSON size exceeds the byte limit.');
  }
  try { return JSON.parse(source) as unknown; } catch { throw new Error('Invalid JSON.'); }
}
