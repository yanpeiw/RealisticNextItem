import { useEffect, useState } from 'react';
import { connectGameStateSubscription, useGameStore } from './stores/game-store';
import { useUiStore } from './stores/ui-store';
import { OverlayHeader } from './features/overlay/OverlayHeader';
import { WaitingScreen } from './components/WaitingScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { RecommendationCard } from './components/RecommendationCard';
import { ExpandedDetails } from './components/ExpandedDetails';

export function App(): JSX.Element {
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | undefined>();
  const gameState = useGameStore((s) => s.gameState);
  const { expanded, settingsOpen, setSettingsOpen } = useUiStore();

  useEffect(() => {
    connectGameStateSubscription();
    void window.advisor.getSettings().then((settings) => setOnboardingCompleted(settings.onboardingCompleted));
  }, []);

  if (onboardingCompleted === undefined) {
    return <div className="app app--loading">Loading...</div>;
  }

  if (!onboardingCompleted) {
    return (
      <div className="app">
        <OnboardingScreen onComplete={() => setOnboardingCompleted(true)} />
      </div>
    );
  }

  const dataVersion = gameState.status === 'active' ? gameState.dataVersion : undefined;

  return (
    <div className="app">
      <OverlayHeader onOpenSettings={() => setSettingsOpen(true)} />

      {settingsOpen ? (
        <SettingsScreen dataVersion={dataVersion} onClose={() => setSettingsOpen(false)} />
      ) : (
        <main className="app__body">
          {gameState.status === 'waiting' && <WaitingScreen />}
          {gameState.status === 'ended' && <p className="app__ended">Match ended. Waiting for the next one...</p>}
          {gameState.status === 'active' && gameState.recommendations.status === 'ok' && (
            <>
              <RecommendationCard
                recommendation={gameState.recommendations.primary}
                dataVersion={dataVersion}
                emphasized
              />
              <div className="app__alternatives">
                {gameState.recommendations.alternatives.map((alt) => (
                  <RecommendationCard key={alt.itemId} recommendation={alt} dataVersion={dataVersion} />
                ))}
              </div>
              {expanded && (
                <ExpandedDetails
                  recommendations={gameState.recommendations}
                  championName={gameState.championName}
                  currentGold={gameState.currentGold}
                  gameTimeSeconds={gameState.gameTimeSeconds}
                />
              )}
            </>
          )}
          {gameState.status === 'active' && gameState.recommendations.status === 'unsupported_champion' && (
            <p className="app__unsupported">
              {gameState.recommendations.championName} isn&apos;t supported yet. Showing no recommendation --
              itemization is entirely up to you for this champion.
            </p>
          )}
          {gameState.status === 'active' && gameState.recommendations.status === 'no_valid_candidates' && (
            <p className="app__unsupported">No confident recommendation right now.</p>
          )}
        </main>
      )}
    </div>
  );
}
