import type { RecommendationSet } from '@shared/domain/recommendation';
import { findCatalogItem } from '@shared/config/items';
import { FACTOR_WEIGHTS } from '@shared/config/scoring';
import { LABEL_TEXT } from '../features/recommendations/copy';

type Props = {
  recommendations: Extract<RecommendationSet, { status: 'ok' }>;
  championName: string;
  currentGold: number;
  gameTimeSeconds: number;
};

const FACTOR_LABELS: Record<string, string> = {
  CHAMPION_FIT: 'Champion fit',
  ENEMY_COUNTER_VALUE: 'Enemy counter value',
  AFFORDABILITY: 'Affordability',
  INVENTORY_SYNERGY: 'Inventory synergy',
  GAME_PHASE_VALUE: 'Game-phase value',
  BUILD_PATH_QUALITY: 'Build-path quality',
  TEAM_UTILITY: 'Team utility',
};

export function ExpandedDetails({ recommendations, championName, currentGold, gameTimeSeconds }: Props): JSX.Element {
  const primaryItem = findCatalogItem(recommendations.primary.itemId);

  return (
    <div className="expanded-details" role="region" aria-label="Recommendation details">
      <section aria-labelledby="expanded-inputs-heading">
        <h3 id="expanded-inputs-heading">Inputs used</h3>
        <dl className="expanded-details__inputs">
          <dt>Champion</dt>
          <dd>{championName}</dd>
          <dt>Gold</dt>
          <dd>{currentGold}</dd>
          <dt>Game time</dt>
          <dd>{Math.floor(gameTimeSeconds / 60)}m</dd>
        </dl>
      </section>

      {primaryItem && (
        <section aria-labelledby="expanded-scoring-heading">
          <h3 id="expanded-scoring-heading">Why {primaryItem.name}: scoring breakdown</h3>
          <ul className="expanded-details__factors">
            {(Object.entries(recommendations.primary.factorScores) as Array<[string, number]>).map(
              ([factor, score]) => {
                const max = FACTOR_WEIGHTS[factor as keyof typeof FACTOR_WEIGHTS] ?? 1;
                return (
                  <li key={factor}>
                    <span>{FACTOR_LABELS[factor] ?? factor}</span>
                    <div className="expanded-details__bar" aria-hidden="true">
                      <div
                        className="expanded-details__bar-fill"
                        style={{ width: `${Math.min(100, (score / max) * 100)}%` }}
                      />
                    </div>
                    <span>
                      {score.toFixed(1)} / {max}
                    </span>
                  </li>
                );
              },
            )}
          </ul>
        </section>
      )}

      <section aria-labelledby="expanded-alternatives-heading">
        <h3 id="expanded-alternatives-heading">How the alternatives differ</h3>
        <ul className="expanded-details__alternatives">
          {recommendations.alternatives.map((alt) => {
            const item = findCatalogItem(alt.itemId);
            if (!item) return null;
            return (
              <li key={alt.itemId}>
                <strong>{item.name}</strong> ({LABEL_TEXT[alt.label]}) -- component path:{' '}
                {alt.componentPath.length > 0 ? alt.componentPath.join(', ') : 'basic item'}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
