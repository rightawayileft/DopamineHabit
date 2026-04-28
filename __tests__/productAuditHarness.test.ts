import {
  backlogSynthesisFields,
  coreRouteSmokeChecks,
  productAuditAgents,
  productAuditSeeds,
} from '@/game/productAuditHarness';

describe('product audit harness', () => {
  it('defines the six planned product-audit agents with distinct seeds', () => {
    expect(productAuditAgents).toHaveLength(6);
    expect(new Set(productAuditAgents.map((agent) => agent.id)).size).toBe(6);
    expect(productAuditAgents.map((agent) => agent.seedId)).toEqual(
      expect.arrayContaining([
        'clean-first-run',
        'returning-with-tokens',
        'power-user-mature',
        'recovery-active-reward',
        'accessibility-reduced-motion',
        'stale-local-state',
      ]),
    );
  });

  it('keeps audit seed states complete enough for journey simulation', () => {
    const seedIds = new Set(productAuditSeeds.map((seed) => seed.id));

    expect(seedIds).toEqual(
      new Set([
        'clean-first-run',
        'first-loop-ready',
        'returning-with-tokens',
        'power-user-mature',
        'stale-local-state',
        'accessibility-reduced-motion',
        'recovery-active-reward',
      ]),
    );

    productAuditSeeds.forEach((seed) => {
      expect(seed.title.length).toBeGreaterThan(0);
      expect(seed.routeStart).toMatch(/^\//);
      expect(seed.state).toMatchObject({
        jars: expect.any(Array),
        habits: expect.any(Array),
        rewards: expect.any(Array),
        completions: expect.any(Array),
        tokens: expect.any(Array),
        spinResults: expect.any(Array),
        rewardGrants: expect.any(Array),
        integrityCheckIns: expect.any(Array),
      });
    });
  });

  it('smoke-checks that core product routes stay mapped to route files', () => {
    expect(coreRouteSmokeChecks.map((check) => check.filePath)).toEqual([
      'app/index.tsx',
      'app/spin.tsx',
      'app/rewards.tsx',
      'app/checkin.tsx',
      'app/settings.tsx',
      'app/stats.tsx',
    ]);
    coreRouteSmokeChecks.forEach((check) => {
      expect(check.route).toMatch(/^\//);
      expect(check.mustExpose.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('documents the backlog synthesis contract for agents', () => {
    expect(backlogSynthesisFields).toEqual([
      'ID',
      'Title',
      'Persona',
      'Journey',
      'Evidence',
      'User impact',
      'Severity',
      'Effort',
      'Opportunity',
      'Acceptance criteria',
      'Dependencies',
    ]);

    expect(productAuditAgents.map((agent) => agent.name)).toEqual(
      expect.arrayContaining(['Impatient First-Timer', 'Product Strategist']),
    );
  });
});
