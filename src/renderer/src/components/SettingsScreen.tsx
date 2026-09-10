import { useEffect, useState } from 'react';
import type { AppSettings } from '@shared/schemas/ipc-schemas';
import { RIOT_DISCLAIMER } from '../features/settings/disclaimer';

type Props = {
  dataVersion: string | undefined;
  onClose: () => void;
};

export function SettingsScreen({ dataVersion, onClose }: Props): JSX.Element {
  const [settings, setSettings] = useState<AppSettings | undefined>();

  useEffect(() => {
    void window.advisor.getSettings().then(setSettings);
  }, []);

  async function handleStrategyChange(strategyPreference: AppSettings['strategyPreference']): Promise<void> {
    const updated = await window.advisor.updateSettings({ strategyPreference });
    setSettings(updated);
  }

  if (!settings) return <div className="settings-screen">Loading settings...</div>;

  return (
    <div className="settings-screen">
      <header className="settings-screen__header">
        <h2>Settings</h2>
        <button type="button" onClick={onClose} aria-label="Close settings">
          x
        </button>
      </header>

      <section>
        <label htmlFor="strategy-select">Strategy preference</label>
        <select
          id="strategy-select"
          value={settings.strategyPreference}
          onChange={(e) => void handleStrategyChange(e.target.value as AppSettings['strategyPreference'])}
        >
          <option value="BALANCED">Balanced</option>
          <option value="SAFER">Safer / defensive</option>
          <option value="AGGRESSIVE">Aggressive / damage</option>
        </select>
      </section>

      <section>
        <h3>Shortcuts</h3>
        <dl>
          <dt>Show / hide overlay</dt>
          <dd>{settings.shortcuts.toggleOverlay}</dd>
          <dt>Toggle click-through</dt>
          <dd>{settings.shortcuts.toggleClickThrough}</dd>
        </dl>
      </section>

      <section>
        <h3>Data</h3>
        <p>Data Dragon version: {dataVersion ?? 'not loaded yet'}</p>
      </section>

      <section>
        <h3>About</h3>
        <p className="settings-screen__disclaimer">{RIOT_DISCLAIMER}</p>
      </section>
    </div>
  );
}
