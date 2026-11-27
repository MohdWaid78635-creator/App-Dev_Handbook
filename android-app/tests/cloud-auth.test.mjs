import assert from 'node:assert/strict';
import test from 'node:test';
import { cloudConfig } from '../src/cloud/config.ts';
import { createSessionStorage } from '../src/auth/session-storage.ts';
import { createSessionController, parseAuthCallback } from '../src/auth/session.ts';

test('cloud remains disabled until explicitly enabled and misconfiguration fails closed', () => {
  assert.equal(cloudConfig({}).status, 'disabled');
  assert.equal(cloudConfig({ enabled: false, url: 'https://example.supabase.co', key: 'sb_secret_no' }).status, 'disabled');
  const valid = { enabled: true, url: 'https://example.supabase.co', key: 'sb_publishable_example' };
  assert.equal(cloudConfig(valid).status, 'ready');
  for (const change of [{ key: 'sb_secret_no' }, { key: 'eyJhbGci.fake.jwt' }, { key: '' }, { url: '' },
    { url: 'http://example.com' }, { url: 'https://user:password@example.com' }, { url: 'https://example.com/path' },
    { url: 'https://example.com?secret=1' }, { url: 'not a URL' }]) {
    assert.equal(cloudConfig({ ...valid, ...change }).status, 'invalid');
  }
  assert.equal(cloudConfig({ ...valid, url: 'http://127.0.0.1:54321', allowLocal: true }).status, 'ready');
  assert.equal(cloudConfig({ ...valid, url: 'http://10.0.2.2:54321', allowLocal: true }).status, 'ready');
  assert.equal(cloudConfig({ ...valid, url: 'http://example.com', allowLocal: true }).status, 'invalid');
});

test('auth storage is separate from app/backup keys and supports full-length sessions', async () => {
  const records = new Map([['academy.progress', 'keep']]);
  const adapter = createSessionStorage({ getItem: key => records.get(key) ?? null,
    setItem: (key, value) => { records.set(key, value); }, removeItem: key => { records.delete(key); } });
  const session = 'x'.repeat(8000);
  await adapter.setItem('session', session);
  assert.equal(await adapter.getItem('session'), session);
  assert.equal(records.get('buildwisp.auth.session'), session);
  await adapter.removeItem('session');
  assert.equal(await adapter.getItem('session'), null);
  assert.equal(records.get('academy.progress'), 'keep');
});

function fakeAuth() {
  let callback; let resolve; let unsubscribed = false; const refresh = [];
  const auth = { getSession: () => new Promise(done => { resolve = done; }),
    onAuthStateChange: handler => { callback = handler; return { data: { subscription: { unsubscribe: () => { unsubscribed = true; } } } }; },
    startAutoRefresh: () => { refresh.push('start'); }, stopAutoRefresh: () => { refresh.push('stop'); } };
  return { auth, refresh, emit: session => callback('SIGNED_IN', session), finish: session => resolve({ data: { session }, error: null }),
    fail: () => resolve({ data: { session: null }, error: new Error('network details must not be exposed') }),
    unsubscribed: () => unsubscribed };
}
const session = userId => ({ user: { id: userId } });

test('late startup sessions cannot replace a newer account and old responses are invalidated', async () => {
  const fake = fakeAuth(); const states = [];
  const controller = createSessionController(fake.auth, state => states.push(state));
  fake.emit(session('B')); const generation = controller.getSnapshot().generation;
  fake.finish(session('A')); await controller.ready;
  assert.equal(controller.getSnapshot().userId, 'B');
  assert.equal(controller.isCurrent(generation), true);
  fake.emit(session('A'));
  assert.equal(controller.isCurrent(generation), false);
  fake.emit(null);
  assert.equal(controller.getSnapshot().status, 'guest');
  controller.dispose();
  assert.equal(fake.unsubscribed(), true);
  assert.equal(controller.isCurrent(controller.getSnapshot().generation), false);
  const count = states.length; fake.emit(session('B')); assert.equal(states.length, count);
});

test('foreground refresh starts once and stops in background and on cleanup', async () => {
  const fake = fakeAuth(); const controller = createSessionController(fake.auth, () => {});
  controller.setForeground(true); controller.setForeground(true); controller.setForeground(false);
  controller.setForeground(true); controller.dispose(); controller.dispose();
  fake.finish(null); await controller.ready;
  assert.deepEqual(fake.refresh, ['start', 'stop', 'start', 'stop']);
});

test('startup failure is recoverable and does not expose raw error details', async () => {
  const fake = fakeAuth(); const controller = createSessionController(fake.auth, () => {});
  fake.fail(); await controller.ready;
  assert.equal(controller.getSnapshot().status, 'error');
  assert.doesNotMatch(controller.getSnapshot().error, /network details/);
  fake.emit(null); assert.equal(controller.getSnapshot().status, 'guest');
  controller.dispose();
});

test('native callbacks accept only the intended PKCE callback and reject token injection', () => {
  assert.deepEqual(parseAuthCallback('buildquestacademy://auth-callback?code=abc-123'), { kind: 'code', code: 'abc-123', recovery: false });
  assert.deepEqual(parseAuthCallback('buildquestacademy://auth-callback?code=abc&type=recovery'), { kind: 'code', code: 'abc', recovery: true });
  assert.deepEqual(parseAuthCallback('buildquestacademy://auth-callback?error=access_denied'), { kind: 'error' });
  for (const url of ['https://example.com?code=a', 'buildquestacademy://wrong?code=a', 'buildquestacademy://auth-callback?code=',
    'buildquestacademy://auth-callback?code=a&code=b', 'buildquestacademy://auth-callback#access_token=bad',
    'buildquestacademy://auth-callback?access_token=bad', 'buildquestacademy://auth-callback?code=a&next=https://evil.com',
    'buildquestacademy://auth-callback?code=a&type=admin', 'buildquestacademy://auth-callback/path?code=a']) {
    assert.throws(() => parseAuthCallback(url));
  }
});
