import type { GameSnapshot, PlayerSnapshot } from '../domain/game-snapshot';

/**
 * Deterministic mock-mode fixtures (section 17). These drive both the
 * "Try demo match" UI flow and a chunk of the engine's test suite, so the
 * whole recommendation loop is exercisable without an active League match.
 */

function enemy(championName: string, itemIds: number[] = []): PlayerSnapshot {
  return { championName, team: 'CHAOS', level: 9, itemIds };
}

function ally(championName: string, itemIds: number[] = []): PlayerSnapshot {
  return { championName, team: 'ORDER', level: 9, itemIds };
}

export type MockScenario = {
  id: string;
  label: string;
  description: string;
  snapshot: GameSnapshot;
};

export const MOCK_SCENARIOS: MockScenario[] = [
  {
    id: 'garen-vs-physical',
    label: 'Garen vs. a physical-damage team',
    description: 'Top-lane Garen facing a mostly AD enemy comp at 15 minutes.',
    snapshot: {
      capturedAt: 0,
      gameTimeSeconds: 15 * 60,
      gameMode: 'CLASSIC',
      mapNumber: 11,
      activePlayer: {
        championName: 'Garen',
        team: 'ORDER',
        role: 'TOP',
        level: 10,
        currentGold: 2800,
        itemIds: [1031],
      },
      allies: [ally('Warwick'), ally('Ahri'), ally('Jinx'), ally('Leona')],
      enemies: [enemy('Darius'), enemy('Warwick'), enemy('Jinx'), enemy('Ashe'), enemy('Leona')],
    },
  },
  {
    id: 'garen-vs-magic',
    label: 'Garen vs. a magic-damage team',
    description: 'Top-lane Garen facing a mostly AP enemy comp at 15 minutes.',
    snapshot: {
      capturedAt: 0,
      gameTimeSeconds: 15 * 60,
      gameMode: 'CLASSIC',
      mapNumber: 11,
      activePlayer: {
        championName: 'Garen',
        team: 'ORDER',
        role: 'TOP',
        level: 10,
        currentGold: 2800,
        itemIds: [1031],
      },
      allies: [ally('Warwick'), ally('Jinx'), ally('Ashe'), ally('Leona')],
      enemies: [enemy('Ahri'), enemy('Annie'), enemy('Amumu'), enemy('Lux'), enemy('Ashe')],
    },
  },
  {
    id: 'jinx-vs-tanks',
    label: 'Jinx facing multiple tanks',
    description: 'ADC Jinx into a tank-heavy frontline at 24 minutes.',
    snapshot: {
      capturedAt: 0,
      gameTimeSeconds: 24 * 60,
      gameMode: 'CLASSIC',
      mapNumber: 11,
      activePlayer: {
        championName: 'Jinx',
        team: 'ORDER',
        role: 'BOTTOM',
        level: 13,
        currentGold: 3600,
        itemIds: [1042],
      },
      allies: [ally('Leona'), ally('Ahri'), ally('Garen'), ally('Warwick')],
      enemies: [enemy('Amumu'), enemy('Garen'), enemy('Warwick'), enemy('Leona'), enemy('Annie')],
    },
  },
  {
    id: 'ahri-early-spike',
    label: 'Ahri needing an earlier affordable spike',
    description: 'Mid-lane Ahri at 9 minutes with modest gold, needing a cheap power spike.',
    snapshot: {
      capturedAt: 0,
      gameTimeSeconds: 9 * 60,
      gameMode: 'CLASSIC',
      mapNumber: 11,
      activePlayer: {
        championName: 'Ahri',
        team: 'ORDER',
        role: 'MIDDLE',
        level: 6,
        currentGold: 1450,
        itemIds: [],
      },
      allies: [ally('Garen'), ally('Jinx'), ally('Leona'), ally('Warwick')],
      enemies: [enemy('Annie'), enemy('Darius'), enemy('Ashe'), enemy('Lux'), enemy('Amumu')],
    },
  },
  {
    id: 'leona-vs-cc-and-magic',
    label: 'Leona facing heavy CC and magic damage',
    description: 'Support Leona into a hard-CC, AP-heavy enemy comp at 20 minutes.',
    snapshot: {
      capturedAt: 0,
      gameTimeSeconds: 20 * 60,
      gameMode: 'CLASSIC',
      mapNumber: 11,
      activePlayer: {
        championName: 'Leona',
        team: 'ORDER',
        role: 'UTILITY',
        level: 11,
        currentGold: 2600,
        itemIds: [],
      },
      allies: [ally('Jinx'), ally('Garen'), ally('Warwick'), ally('Ahri')],
      enemies: [enemy('Amumu'), enemy('Annie'), enemy('Ahri'), enemy('Lux'), enemy('Darius')],
    },
  },
  {
    id: 'cannot-afford-anything',
    label: 'Cannot afford any complete item',
    description: 'Ashe at 8 minutes with almost no gold -- the engine should still score components.',
    snapshot: {
      capturedAt: 0,
      gameTimeSeconds: 8 * 60,
      gameMode: 'CLASSIC',
      mapNumber: 11,
      activePlayer: {
        championName: 'Ashe',
        team: 'ORDER',
        role: 'BOTTOM',
        level: 5,
        currentGold: 180,
        itemIds: [],
      },
      allies: [ally('Leona'), ally('Garen'), ally('Warwick'), ally('Ahri')],
      enemies: [enemy('Darius'), enemy('Amumu'), enemy('Annie'), enemy('Lux'), enemy('Jinx')],
    },
  },
  {
    id: 'unsupported-champion',
    label: 'Unsupported champion',
    description: 'A champion outside the initial 10-champion MVP roster.',
    snapshot: {
      capturedAt: 0,
      gameTimeSeconds: 12 * 60,
      gameMode: 'CLASSIC',
      mapNumber: 11,
      activePlayer: {
        championName: 'Yasuo',
        team: 'ORDER',
        role: 'MIDDLE',
        level: 8,
        currentGold: 2200,
        itemIds: [],
      },
      allies: [ally('Garen'), ally('Jinx'), ally('Leona'), ally('Warwick')],
      enemies: [enemy('Darius'), enemy('Amumu'), enemy('Annie'), enemy('Lux'), enemy('Ashe')],
    },
  },
];

export function getMockScenario(scenarioId: string): MockScenario | undefined {
  return MOCK_SCENARIOS.find((scenario) => scenario.id === scenarioId);
}
