import type { GameSnapshot } from '@shared/domain/game-snapshot';
import { getMockScenario } from '@shared/mock/scenarios';

/**
 * Drives the "Try demo match" flow (section 17). Advances the fixture's
 * game clock a little on every poll so the UI visibly updates, without
 * requiring an active League match.
 */
export class MockGameAdapter {
  private activeScenarioId: string | undefined;
  private elapsedSeconds = 0;

  start(scenarioId: string): void {
    if (!getMockScenario(scenarioId)) {
      throw new Error(`Unknown mock scenario: ${scenarioId}`);
    }
    this.activeScenarioId = scenarioId;
    this.elapsedSeconds = 0;
  }

  stop(): void {
    this.activeScenarioId = undefined;
    this.elapsedSeconds = 0;
  }

  isRunning(): boolean {
    return this.activeScenarioId !== undefined;
  }

  poll(capturedAt: number): GameSnapshot | undefined {
    if (!this.activeScenarioId) return undefined;
    const scenario = getMockScenario(this.activeScenarioId);
    if (!scenario) return undefined;

    this.elapsedSeconds += 1;
    return {
      ...scenario.snapshot,
      capturedAt,
      gameTimeSeconds: scenario.snapshot.gameTimeSeconds + this.elapsedSeconds,
    };
  }
}
