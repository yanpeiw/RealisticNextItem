import { describe, expect, it } from 'vitest';
import { recommendItems } from '@shared/engine/recommend-items';
import { scoreItem } from '@shared/engine/score-item';
import { buildMatchContext } from '@shared/engine/build-context';
import { ITEM_CATALOG, findCatalogItem } from '@shared/config/items';
import { MOCK_SCENARIOS, getMockScenario } from '@shared/mock/scenarios';
import type { GameSnapshot } from '@shared/domain/game-snapshot';

const FIXED_NOW = 1_700_000_000_000;

function scenario(id: string): GameSnapshot {
  const found = getMockScenario(id);
  if (!found) throw new Error(`missing fixture: ${id}`);
  return found.snapshot;
}

describe('recommendItems', () => {
  it('is deterministic for the same input', () => {
    const snapshot = scenario('garen-vs-physical');
    const first = recommendItems(snapshot, ITEM_CATALOG, 'BALANCED', FIXED_NOW);
    const second = recommendItems(snapshot, ITEM_CATALOG, 'BALANCED', FIXED_NOW);
    expect(second).toEqual(first);
  });

  it('never mutates the snapshot or catalog it is given', () => {
    const snapshot = scenario('garen-vs-physical');
    const snapshotCopy = structuredClone(snapshot);
    const catalogCopy = structuredClone(ITEM_CATALOG);

    recommendItems(snapshot, ITEM_CATALOG, 'BALANCED', FIXED_NOW);

    expect(snapshot).toEqual(snapshotCopy);
    expect(ITEM_CATALOG).toEqual(catalogCopy);
  });

  it('excludes items that are not purchasable or not available on Summoner\'s Rift', () => {
    const snapshot = scenario('garen-vs-physical');
    const unavailableItem = { ...ITEM_CATALOG[0]!, id: 999999, purchasable: false };
    const catalog = [...ITEM_CATALOG, unavailableItem];

    const result = recommendItems(snapshot, catalog, 'BALANCED', FIXED_NOW);

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      const ids = [result.primary.itemId, ...result.alternatives.map((a) => a.itemId)];
      expect(ids).not.toContain(999999);
    }
  });

  it('excludes items already owned', () => {
    const snapshot = scenario('garen-vs-physical');
    const owned = { ...snapshot, activePlayer: { ...snapshot.activePlayer, itemIds: [3143] } };

    const result = recommendItems(owned, ITEM_CATALOG, 'BALANCED', FIXED_NOW);

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      const ids = [result.primary.itemId, ...result.alternatives.map((a) => a.itemId)];
      expect(ids).not.toContain(3143);
    }
  });

  it('returns three unique items when three valid candidates exist', () => {
    for (const { snapshot } of MOCK_SCENARIOS) {
      const result = recommendItems(snapshot, ITEM_CATALOG, 'BALANCED', FIXED_NOW);
      if (result.status !== 'ok') continue;
      const ids = [result.primary.itemId, ...result.alternatives.map((a) => a.itemId)];
      expect(new Set(ids).size).toBe(3);
    }
  });

  it('gives every "ok" recommendation at least one reason and one tradeoff', () => {
    for (const { id, snapshot } of MOCK_SCENARIOS) {
      const result = recommendItems(snapshot, ITEM_CATALOG, 'BALANCED', FIXED_NOW);
      if (result.status !== 'ok') continue;
      for (const rec of [result.primary, ...result.alternatives]) {
        expect(rec.reasons.length, `${id}: ${rec.itemId} reasons`).toBeGreaterThan(0);
        expect(rec.tradeoffs.length, `${id}: ${rec.itemId} tradeoffs`).toBeGreaterThan(0);
      }
    }
  });

  it('returns an explicit unsupported-champion result for champions outside the roster', () => {
    const result = recommendItems(scenario('unsupported-champion'), ITEM_CATALOG, 'BALANCED', FIXED_NOW);
    expect(result.status).toBe('unsupported_champion');
    if (result.status === 'unsupported_champion') {
      expect(result.championName).toBe('Yasuo');
    }
  });

  it('still produces a result when the player cannot afford any complete item', () => {
    const result = recommendItems(scenario('cannot-afford-anything'), ITEM_CATALOG, 'BALANCED', FIXED_NOW);
    expect(result.status).toBe('ok');
  });
});

describe('scoreItem: enemy damage-type reactivity', () => {
  it('scores armor items higher against a physical-heavy enemy team', () => {
    const armorItem = findCatalogItem(3143)!; // Randuin's Omen

    const physicalContext = buildMatchContext(scenario('garen-vs-physical'), 'BALANCED')!;
    const magicContext = buildMatchContext(scenario('garen-vs-magic'), 'BALANCED')!;

    const physicalScore = scoreItem(armorItem, physicalContext)!.factorScores.ENEMY_COUNTER_VALUE;
    const magicScore = scoreItem(armorItem, magicContext)!.factorScores.ENEMY_COUNTER_VALUE;

    expect(physicalScore).toBeGreaterThan(magicScore);
  });

  it('scores magic-resist items higher against a magic-heavy enemy team', () => {
    const mrItem = findCatalogItem(3102)!; // Spirit Visage

    const physicalContext = buildMatchContext(scenario('garen-vs-physical'), 'BALANCED')!;
    const magicContext = buildMatchContext(scenario('garen-vs-magic'), 'BALANCED')!;

    const physicalScore = scoreItem(mrItem, physicalContext)!.factorScores.ENEMY_COUNTER_VALUE;
    const magicScore = scoreItem(mrItem, magicContext)!.factorScores.ENEMY_COUNTER_VALUE;

    expect(magicScore).toBeGreaterThan(physicalScore);
  });

  it('increases anti-heal value only when healing/sustain threats are significant', () => {
    const antiHealItem = findCatalogItem(3165)!; // Morellonomicon

    // garen-vs-physical has 2 SUSTAINED enemies (Darius, Warwick); garen-vs-magic has 0.
    const highSustainContext = buildMatchContext(scenario('garen-vs-physical'), 'BALANCED')!;
    const noSustainContext = buildMatchContext(scenario('garen-vs-magic'), 'BALANCED')!;

    const highScore = scoreItem(antiHealItem, highSustainContext)!.factorScores.ENEMY_COUNTER_VALUE;
    const lowScore = scoreItem(antiHealItem, noSustainContext)!.factorScores.ENEMY_COUNTER_VALUE;

    expect(highScore).toBeGreaterThan(lowScore);
  });

  it('penalizes a redundant anti-heal purchase when one is already owned', () => {
    const snapshot = scenario('garen-vs-physical');
    const alreadyOwnsAntiHeal: GameSnapshot = {
      ...snapshot,
      activePlayer: { ...snapshot.activePlayer, itemIds: [3123] }, // Executioner's Calling
    };
    const context = buildMatchContext(alreadyOwnsAntiHeal, 'BALANCED')!;
    const morello = findCatalogItem(3165)!;

    const scored = scoreItem(morello, context)!;

    expect(scored.appliedPenalties).toContain('REDUNDANT_UNIQUE_EFFECT');
  });

  it('improves build-path score when the player can afford a component now', () => {
    const item = findCatalogItem(3031)!; // Infinity Edge
    const flushContext = buildMatchContext(scenario('jinx-vs-tanks'), 'BALANCED')!; // 3600 gold
    const brokeContext = buildMatchContext(scenario('cannot-afford-anything'), 'BALANCED')!; // 180 gold

    const flushScore = scoreItem(item, flushContext)!.factorScores.BUILD_PATH_QUALITY;
    const brokeScore = scoreItem(item, brokeContext)!.factorScores.BUILD_PATH_QUALITY;

    expect(flushScore).toBeGreaterThan(brokeScore);
  });
});
