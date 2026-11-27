import type { Namespace } from '../sync/contracts.ts';
import { uuid } from '../validation/json.ts';

export function namespace(value: string): Namespace {
  const [kind, id, ...extra] = value.split(':');
  if ((kind !== 'guest' && kind !== 'user') || extra.length) throw new Error('Invalid storage scope.');
  uuid(id);
  return value as Namespace;
}
export type ScopeLease = { namespace: Namespace; generation: number; assertCurrent(): void };
export function createScopeController(initial: string) {
  let current = namespace(initial);
  let generation = 0;
  return {
    select(value: string) {
      const next = namespace(value);
      if (next !== current) { current = next; generation++; }
      return { namespace: current, generation };
    },
    capture(): ScopeLease {
      const captured = current; const version = generation;
      return { namespace: captured, generation: version, assertCurrent() {
        if (current !== captured || generation !== version) throw new Error('This storage scope belongs to a previous account session.');
      } };
    },
    invalidate() { generation++; },
  };
}
