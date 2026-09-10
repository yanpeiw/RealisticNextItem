import { describe, expect, it } from 'vitest';
import {
  ActivePlayerSchema,
  GameStatsSchema,
  PlayerListSchema,
  normalizeLiveClientPoll,
} from '@shared/schemas/live-client-schemas';

const VALID_GAME_STATS = { gameMode: 'CLASSIC', gameTime: 645.2, mapName: "Summoner's Rift", mapNumber: 11 };
const VALID_ACTIVE_PLAYER = { currentGold: 1250, level: 6, summonerName: 'Faker#KR1' };
const VALID_PLAYER_LIST = [
  { championName: 'Ahri', team: 'ORDER', level: 6, items: [{ itemID: 1052 }], summonerName: 'Faker#KR1' },
  { championName: 'Annie', team: 'CHAOS', level: 6, items: [], summonerName: 'Enemy#EUW' },
];

describe('live client schemas', () => {
  it('accepts a well-formed poll', () => {
    expect(() => GameStatsSchema.parse(VALID_GAME_STATS)).not.toThrow();
    expect(() => ActivePlayerSchema.parse(VALID_ACTIVE_PLAYER)).not.toThrow();
    expect(() => PlayerListSchema.parse(VALID_PLAYER_LIST)).not.toThrow();
  });

  it('rejects a malformed response instead of silently coercing it', () => {
    const malformed = { gameMode: 'CLASSIC', gameTime: 'not-a-number', mapNumber: 11 };
    expect(() => GameStatsSchema.parse(malformed)).toThrow();
  });

  it('normalizes a validated poll into a GameSnapshot, splitting allies from enemies', () => {
    const snapshot = normalizeLiveClientPoll(
      {
        gameStats: GameStatsSchema.parse(VALID_GAME_STATS),
        activePlayer: ActivePlayerSchema.parse(VALID_ACTIVE_PLAYER),
        playerList: PlayerListSchema.parse(VALID_PLAYER_LIST),
      },
      1_700_000_000_000,
    );

    expect(snapshot.activePlayer.championName).toBe('Ahri');
    expect(snapshot.activePlayer.currentGold).toBe(1250);
    expect(snapshot.enemies).toHaveLength(1);
    expect(snapshot.enemies[0]?.championName).toBe('Annie');
    expect(snapshot.allies).toHaveLength(0);
  });

  it('throws when the active player cannot be matched in the player list', () => {
    expect(() =>
      normalizeLiveClientPoll(
        {
          gameStats: GameStatsSchema.parse(VALID_GAME_STATS),
          activePlayer: ActivePlayerSchema.parse({ ...VALID_ACTIVE_PLAYER, summonerName: 'Nobody' }),
          playerList: PlayerListSchema.parse(VALID_PLAYER_LIST),
        },
        1_700_000_000_000,
      ),
    ).toThrow();
  });
});
