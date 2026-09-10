import { useState } from 'react';
import { MOCK_SCENARIOS } from '@shared/mock/scenarios';

export function WaitingScreen(): JSX.Element {
  const [scenarioId, setScenarioId] = useState(MOCK_SCENARIOS[0]!.id);
  const [starting, setStarting] = useState(false);

  async function handleStartDemo(): Promise<void> {
    setStarting(true);
    try {
      await window.advisor.startMockMatch(scenarioId);
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="waiting-screen">
      <p className="waiting-screen__status">Waiting for a League match</p>
      <p className="waiting-screen__hint">
        The overlay activates automatically once a supported Summoner&apos;s Rift match starts.
      </p>

      <div className="waiting-screen__demo">
        <label htmlFor="scenario-select">Try demo match</label>
        <select id="scenario-select" value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
          {MOCK_SCENARIOS.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={handleStartDemo} disabled={starting}>
          {starting ? 'Starting...' : 'Start demo'}
        </button>
      </div>
    </div>
  );
}
