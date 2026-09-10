import { useState } from 'react';
import { DEFAULT_SETTINGS } from '@shared/schemas/ipc-schemas';
import { RIOT_DISCLAIMER } from '../features/settings/disclaimer';

type Props = {
  onComplete: () => void;
};

export function OnboardingScreen({ onComplete }: Props): JSX.Element {
  const [saving, setSaving] = useState(false);

  async function handleContinue(): Promise<void> {
    setSaving(true);
    try {
      await window.advisor.updateSettings({ onboardingCompleted: true });
      onComplete();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="onboarding">
      <h2>Welcome to LoL Item Advisor</h2>
      <ul className="onboarding__points">
        <li>Reads only your own client&apos;s local, in-game data -- nothing hidden or fog-of-war.</li>
        <li>Never clicks, buys, or controls the game for you. You make every purchase.</li>
        <li>Works only while a supported Summoner&apos;s Rift match is active.</li>
      </ul>

      <p className="onboarding__shortcuts">
        Default shortcuts: <kbd>{DEFAULT_SETTINGS.shortcuts.toggleOverlay}</kbd> to show/hide,{' '}
        <kbd>{DEFAULT_SETTINGS.shortcuts.toggleClickThrough}</kbd> to toggle click-through. Change these
        later in Settings.
      </p>

      <p className="onboarding__disclaimer">{RIOT_DISCLAIMER}</p>

      <button type="button" onClick={handleContinue} disabled={saving}>
        {saving ? 'Saving...' : 'Got it'}
      </button>
    </div>
  );
}
