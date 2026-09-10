import type { GameSnapshot } from '@shared/domain/game-snapshot';
import type { StrategyPreference } from '@shared/domain/recommendation';
import type { PublicGameState } from '@shared/schemas/ipc-schemas';
import { recommendItems } from '@shared/engine/recommend-items';
import { ITEM_CATALOG } from '@shared/config/items';
import { pollLiveClient } from '../adapters/live-client-adapter';
import { MockGameAdapter } from '../adapters/mock-game-adapter';

const WAITING_POLL_INTERVAL_MS = 2000;
const ACTIVE_POLL_INTERVAL_MS = 1000;
const SUCCESSES_TO_ENTER_ACTIVE = 2;
const FAILURES_TO_LEAVE_ACTIVE = 3;

/**
 * Owns the waiting/active/ended lifecycle (section 9 and 15): polls either
 * the real Live Client Data API or the mock adapter, feeds validated
 * snapshots to the pure recommendation engine, and reports a sanitized
 * PublicGameState to whoever is listening (main/ipc wires this to the
 * renderer over the allowlisted IPC channel).
 */
export class LiveClientService {
  private readonly mockAdapter = new MockGameAdapter();
  private state: 'WAITING' | 'ACTIVE' = 'WAITING';
  private consecutiveSuccesses = 0;
  private consecutiveFailures = 0;
  private strategy: StrategyPreference = 'BALANCED';
  private timer: ReturnType<typeof setTimeout> | undefined;
  private lastEmittedHash: string | undefined;
  private lastActivePayload: Extract<PublicGameState, { status: 'active' }> | undefined;

  constructor(private readonly onStateChange: (state: PublicGameState) => void) {}

  setStrategy(strategy: StrategyPreference): void {
    this.strategy = strategy;
  }

  start(): void {
    this.scheduleNextPoll(0);
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  startMockMatch(scenarioId: string): void {
    this.mockAdapter.start(scenarioId);
    this.consecutiveSuccesses = 0;
    this.consecutiveFailures = 0;
  }

  stopMockMatch(): void {
    this.mockAdapter.stop();
    this.resetToWaiting();
  }

  private scheduleNextPoll(delayMs: number): void {
    this.timer = setTimeout(() => {
      void this.pollOnce().finally(() => {
        const interval = this.state === 'ACTIVE' ? ACTIVE_POLL_INTERVAL_MS : WAITING_POLL_INTERVAL_MS;
        this.scheduleNextPoll(interval);
      });
    }, delayMs);
  }

  private async pollOnce(): Promise<void> {
    const capturedAt = Date.now();
    const snapshot = this.mockAdapter.isRunning()
      ? this.mockAdapter.poll(capturedAt)
      : await this.pollRealGame(capturedAt);

    if (snapshot) {
      this.handleSuccessfulPoll(snapshot);
    } else {
      this.handleFailedPoll();
    }
  }

  private async pollRealGame(capturedAt: number): Promise<GameSnapshot | undefined> {
    const result = await pollLiveClient(capturedAt);
    // A malformed response and "no active game" are both treated as a
    // failed poll for lifecycle purposes -- neither should crash the app,
    // and both are recoverable on the next tick.
    return result.status === 'active' ? result.snapshot : undefined;
  }

  private handleSuccessfulPoll(snapshot: GameSnapshot): void {
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses += 1;

    if (this.state === 'WAITING' && this.consecutiveSuccesses < SUCCESSES_TO_ENTER_ACTIVE) {
      return;
    }
    this.state = 'ACTIVE';

    const recommendations = recommendItems(snapshot, ITEM_CATALOG, this.strategy, Date.now());
    if (recommendations.snapshotHash !== this.lastEmittedHash) {
      this.lastEmittedHash = recommendations.snapshotHash;
      this.lastActivePayload = {
        status: 'active',
        championName: snapshot.activePlayer.championName,
        currentGold: snapshot.activePlayer.currentGold ?? 0,
        gameTimeSeconds: snapshot.gameTimeSeconds,
        recommendations,
      };
    }
    if (this.lastActivePayload) this.onStateChange(this.lastActivePayload);
  }

  private handleFailedPoll(): void {
    this.consecutiveSuccesses = 0;
    this.consecutiveFailures += 1;

    if (this.state === 'ACTIVE') {
      if (this.consecutiveFailures >= FAILURES_TO_LEAVE_ACTIVE) {
        this.onStateChange({ status: 'ended' });
        this.resetToWaiting();
      }
      // Otherwise: tolerate 1-2 temporary poll failures and keep showing
      // the last valid recommendation (no emission needed -- the renderer
      // already has it).
      return;
    }

    this.onStateChange({ status: 'waiting' });
  }

  private resetToWaiting(): void {
    this.state = 'WAITING';
    this.consecutiveSuccesses = 0;
    this.consecutiveFailures = 0;
    this.lastEmittedHash = undefined;
    this.lastActivePayload = undefined;
  }
}
