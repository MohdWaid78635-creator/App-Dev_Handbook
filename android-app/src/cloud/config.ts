export type CloudConfiguration = { status: 'disabled' } | { status: 'invalid'; message: string } |
  { status: 'ready'; url: string; key: string };
export function cloudConfig(input: { enabled?: boolean; url?: string; key?: string; allowLocal?: boolean }): CloudConfiguration {
  if (!input.enabled) return { status: 'disabled' };
  try {
    const url = new URL(input.url ?? '');
    const local = input.allowLocal && ['localhost', '127.0.0.1', '10.0.2.2'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password ||
      url.search || url.hash || url.pathname !== '/' || !/^sb_publishable_[a-zA-Z0-9_-]+$/.test(input.key ?? '')) throw new Error();
    return { status: 'ready', url: url.origin, key: input.key! };
  } catch { return { status: 'invalid', message: 'Cloud settings are incomplete or unsupported. Continue using local data.' }; }
}
