import https from 'node:https';
import type { GameSnapshot } from '@shared/domain/game-snapshot';
import {
  ActivePlayerSchema,
  GameStatsSchema,
  PlayerListSchema,
  normalizeLiveClientPoll,
} from '@shared/schemas/live-client-schemas';

const LIVE_CLIENT_HOST = '127.0.0.1';
const LIVE_CLIENT_PORT = 2999;

/**
 * TLS verification is disabled ONLY for this exact loopback host/port, per
 * LOL_ITEM_ADVISOR_BRAIN.md section 7.1 and 16 -- League's Live Client Data
 * API serves a self-signed cert with no reachable CA to pin. This agent is
 * never reused for any other request, and NODE_TLS_REJECT_UNAUTHORIZED is
 * never touched.
 */
const liveClientAgent = new https.Agent({ rejectUnauthorized: false });

export type LiveClientPollResult =
  | { status: 'active'; snapshot: GameSnapshot }
  | { status: 'no-active-game' }
  | { status: 'malformed-response'; error: string };

function getJson(path: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        host: LIVE_CLIENT_HOST,
        port: LIVE_CLIENT_PORT,
        path,
        method: 'GET',
        agent: liveClientAgent,
        headers: { Accept: 'application/json' },
        timeout: 1500,
      },
      (response) => {
        let body = '';
        response.on('data', (chunk: Buffer) => {
          body += chunk.toString('utf-8');
        });
        response.on('end', () => {
          if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error(`${path} responded with status ${response.statusCode}`));
          }
        });
      },
    );
    request.on('timeout', () => request.destroy(new Error(`${path} timed out`)));
    request.on('error', reject);
    request.end();
  });
}

/**
 * Polls the three required Live Client Data endpoints in parallel, validates
 * every response with Zod, and normalizes the result into a GameSnapshot.
 * A connection failure is treated as "no match running", not an error --
 * see live-client-service.ts for the lifecycle state machine built on top
 * of this.
 */
export async function pollLiveClient(capturedAt: number): Promise<LiveClientPollResult> {
  let raw: { gameStats: unknown; activePlayer: unknown; playerList: unknown };
  try {
    const [gameStats, activePlayer, playerList] = await Promise.all([
      getJson('/liveclientdata/gamestats'),
      getJson('/liveclientdata/activeplayer'),
      getJson('/liveclientdata/playerlist'),
    ]);
    raw = { gameStats, activePlayer, playerList };
  } catch {
    return { status: 'no-active-game' };
  }

  const gameStatsResult = GameStatsSchema.safeParse(raw.gameStats);
  const activePlayerResult = ActivePlayerSchema.safeParse(raw.activePlayer);
  const playerListResult = PlayerListSchema.safeParse(raw.playerList);
  if (!gameStatsResult.success || !activePlayerResult.success || !playerListResult.success) {
    return { status: 'malformed-response', error: 'Live Client Data response failed schema validation' };
  }

  try {
    const snapshot = normalizeLiveClientPoll(
      {
        gameStats: gameStatsResult.data,
        activePlayer: activePlayerResult.data,
        playerList: playerListResult.data,
      },
      capturedAt,
    );
    return { status: 'active', snapshot };
  } catch (error) {
    return {
      status: 'malformed-response',
      error: error instanceof Error ? error.message : 'normalization failed',
    };
  }
}
