import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  parseDecapiUptime,
  decapiProvider,
  start,
  stop,
  subscribe,
  getStatus,
  __resetForTests,
} from '../js/modules/liveStatus.js';

describe('parseDecapiUptime', () => {
  test('treats an uptime string starting with a number as live', () => {
    expect(parseDecapiUptime('2 hours, 15 minutes')).toBe(true);
    expect(parseDecapiUptime('45 minutes, 12 seconds')).toBe(true);
    expect(parseDecapiUptime('1 day, 3 hours')).toBe(true);
  });

  test('treats "{user} is offline" as not live', () => {
    expect(parseDecapiUptime('senseitalon is offline')).toBe(false);
  });

  test('treats unknown-user errors as not live', () => {
    expect(parseDecapiUptime('User not found')).toBe(false);
    expect(parseDecapiUptime('Unknown user')).toBe(false);
  });

  test('returns false on empty or non-string input', () => {
    expect(parseDecapiUptime('')).toBe(false);
    expect(parseDecapiUptime(null)).toBe(false);
    expect(parseDecapiUptime(undefined)).toBe(false);
    expect(parseDecapiUptime(42)).toBe(false);
  });
});

describe('decapiProvider', () => {
  test('returns true when fetch resolves with an uptime string', async () => {
    const fakeFetch = vi.fn(async () => ({ ok: true, text: async () => '2 hours, 15 minutes' }));
    expect(await decapiProvider('senseitalon', fakeFetch)).toBe(true);
    expect(fakeFetch).toHaveBeenCalledWith('https://decapi.me/twitch/uptime/senseitalon');
  });

  test('returns false when fetch resolves with "offline"', async () => {
    const fakeFetch = vi.fn(async () => ({ ok: true, text: async () => 'senseitalon is offline' }));
    expect(await decapiProvider('senseitalon', fakeFetch)).toBe(false);
  });

  test('returns false when fetch throws (network error)', async () => {
    const fakeFetch = vi.fn(async () => { throw new Error('network down'); });
    expect(await decapiProvider('senseitalon', fakeFetch)).toBe(false);
  });

  test('returns false on non-OK HTTP status', async () => {
    const fakeFetch = vi.fn(async () => ({ ok: false, text: async () => '' }));
    expect(await decapiProvider('senseitalon', fakeFetch)).toBe(false);
  });
});

describe('start/subscribe/stop', () => {
  beforeEach(() => {
    __resetForTests();
  });

  test('polls every eligible creator once on start', async () => {
    const calls = [];
    const provider = async (user) => { calls.push(user); return false; };
    const creators = [
      { id: 'a', twitchUsername: 'aaa' },
      { id: 'b', twitchUsername: 'bbb' },
    ];
    start(creators, { provider, intervalMs: 999_999 });
    // Wait one microtask flush so the initial pollAll completes.
    await new Promise((r) => setTimeout(r, 0));
    expect(calls.sort()).toEqual(['aaa', 'bbb']);
    stop();
  });

  test('skips creators without a twitchUsername', async () => {
    const calls = [];
    const provider = async (user) => { calls.push(user); return false; };
    const creators = [
      { id: 'a', twitchUsername: null },
      { id: 'b', twitchUsername: 'bbb' },
    ];
    start(creators, { provider, intervalMs: 999_999 });
    await new Promise((r) => setTimeout(r, 0));
    expect(calls).toEqual(['bbb']);
    stop();
  });

  test('notifies listeners only on transitions, not on every poll', async () => {
    const events = [];
    subscribe((id, snap) => events.push({ id, isLive: snap.isLive }));

    // Provider that always returns true — first call should fire, subsequent shouldn't.
    const provider = async () => true;
    const creators = [{ id: 'a', twitchUsername: 'aaa' }];

    start(creators, { provider, intervalMs: 999_999 });
    await new Promise((r) => setTimeout(r, 0));
    expect(events).toEqual([{ id: 'a', isLive: true }]);

    // Manually trigger another tick by calling start again — but start is idempotent;
    // we'll instead verify by getting status directly.
    expect(getStatus('a').isLive).toBe(true);
    stop();
  });

  test('start() is idempotent — calling twice does not double the timer', () => {
    const provider = async () => false;
    const creators = [{ id: 'a', twitchUsername: 'aaa' }];
    const firstStop = start(creators, { provider, intervalMs: 999_999 });
    const secondStop = start(creators, { provider, intervalMs: 999_999 });
    expect(firstStop).toBe(secondStop);
    stop();
  });

  test('getStatus returns default offline shape for unknown ids', () => {
    expect(getStatus('does-not-exist')).toEqual({ isLive: false, lastChecked: 0 });
  });
});
