import { useMemo, useState } from 'react';
import { recommendItems } from '@shared/engine/recommend-items';
import { ITEM_CATALOG } from '@shared/config/items';
import { MOCK_SCENARIOS } from '@shared/mock/scenarios';
import type { StrategyPreference } from '@shared/domain/recommendation';
import { RecommendationCard } from '../src/renderer/src/components/RecommendationCard';
import { ExpandedDetails } from '../src/renderer/src/components/ExpandedDetails';
import { RIOT_DISCLAIMER } from '../src/renderer/src/features/settings/disclaimer';

const FIXED_NOW = 1_700_000_000_000;

export function DemoApp(): JSX.Element {
  const [scenarioId, setScenarioId] = useState(MOCK_SCENARIOS[0]!.id);
  const scenario = MOCK_SCENARIOS.find((s) => s.id === scenarioId) ?? MOCK_SCENARIOS[0]!;

  const [gold, setGold] = useState(scenario.snapshot.activePlayer.currentGold ?? 0);
  const [gameMinutes, setGameMinutes] = useState(Math.round(scenario.snapshot.gameTimeSeconds / 60));
  const [strategy, setStrategy] = useState<StrategyPreference>('BALANCED');

  function handleScenarioChange(nextId: string): void {
    const next = MOCK_SCENARIOS.find((s) => s.id === nextId) ?? MOCK_SCENARIOS[0]!;
    setScenarioId(nextId);
    setGold(next.snapshot.activePlayer.currentGold ?? 0);
    setGameMinutes(Math.round(next.snapshot.gameTimeSeconds / 60));
  }

  const snapshot = useMemo(
    () => ({
      ...scenario.snapshot,
      gameTimeSeconds: gameMinutes * 60,
      activePlayer: { ...scenario.snapshot.activePlayer, currentGold: gold },
    }),
    [scenario, gold, gameMinutes],
  );

  const result = useMemo(
    () => recommendItems(snapshot, ITEM_CATALOG, strategy, FIXED_NOW),
    [snapshot, strategy],
  );

  return (
    <div className="demo">
      <header className="demo__banner">
        <h1>LoL Item Advisor -- Engine Demo</h1>
        <p>
          This page runs the actual, unmodified recommendation engine from{' '}
          <a href="https://github.com/yanpeiw/RealisticNextItem" target="_blank" rel="noreferrer">
            the repo
          </a>{' '}
          against a mock game snapshot, entirely in your browser -- no server, no League client. The
          real product is a Windows desktop overlay that reads your own live match locally; this is a
          way to try the decision logic without installing anything.
        </p>
      </header>

      <section className="demo__controls">
        <label>
          Scenario
          <select value={scenarioId} onChange={(e) => handleScenarioChange(e.target.value)}>
            {MOCK_SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Gold: {gold}
          <input
            type="range"
            min={0}
            max={5000}
            step={50}
            value={gold}
            onChange={(e) => setGold(Number(e.target.value))}
          />
        </label>

        <label>
          Game time: {gameMinutes}m
          <input
            type="range"
            min={0}
            max={40}
            step={1}
            value={gameMinutes}
            onChange={(e) => setGameMinutes(Number(e.target.value))}
          />
        </label>

        <label>
          Strategy
          <select value={strategy} onChange={(e) => setStrategy(e.target.value as StrategyPreference)}>
            <option value="BALANCED">Balanced</option>
            <option value="SAFER">Safer / defensive</option>
            <option value="AGGRESSIVE">Aggressive / damage</option>
          </select>
        </label>
      </section>

      <p className="demo__scenario-description">{scenario.description}</p>

      <main className="demo__output">
        {result.status === 'ok' && (
          <>
            <div className="demo__cards">
              <RecommendationCard recommendation={result.primary} dataVersion={undefined} emphasized />
              {result.alternatives.map((alt) => (
                <RecommendationCard key={alt.itemId} recommendation={alt} dataVersion={undefined} />
              ))}
            </div>
            <ExpandedDetails
              recommendations={result}
              championName={snapshot.activePlayer.championName}
              currentGold={gold}
              gameTimeSeconds={gameMinutes * 60}
            />
          </>
        )}
        {result.status === 'unsupported_champion' && (
          <p className="demo__message">
            {result.championName} isn&apos;t in the MVP&apos;s 10-champion roster, so the engine
            correctly declines to guess -- this is the same explicit unsupported state the real overlay
            shows.
          </p>
        )}
        {result.status === 'no_valid_candidates' && (
          <p className="demo__message">No confident recommendation for this combination.</p>
        )}
      </main>

      <footer className="demo__footer">{RIOT_DISCLAIMER}</footer>
    </div>
  );
}
