import { detectClockTamper, evaluateRateLimit } from '@/game/integrity';

describe('integrity rules', () => {
  it('flags backward clock drift beyond five minutes', () => {
    const result = detectClockTamper('2026-04-23T12:10:00Z', '2026-04-23T12:04:59Z');

    expect(result.clockTamperDetected).toBe(true);
    expect(result.driftSeconds).toBeLessThan(-300);
  });

  it('allows small backward clock drift inside the threshold', () => {
    expect(
      detectClockTamper('2026-04-23T12:10:00Z', '2026-04-23T12:05:01Z')
        .clockTamperDetected,
    ).toBe(false);
  });

  it('rejects a second completion inside the per-habit rate limit', () => {
    const result = evaluateRateLimit(
      '2026-04-23T12:00:00Z',
      '2026-04-23T12:00:20Z',
      30,
    );

    expect(result.allowed).toBe(false);
    expect(result.secondsRemaining).toBe(10);
  });

  it('allows completion after the rate limit window', () => {
    expect(
      evaluateRateLimit('2026-04-23T12:00:00Z', '2026-04-23T12:00:30Z', 30).allowed,
    ).toBe(true);
  });
});
