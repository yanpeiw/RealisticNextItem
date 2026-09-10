import type { ItemRecommendation } from '@shared/domain/recommendation';
import { findCatalogItem } from '@shared/config/items';
import { LABEL_TEXT, REASON_TEXT, TRADEOFF_TEXT } from '../features/recommendations/copy';
import { itemIconUrl } from '../features/recommendations/item-icon';

type Props = {
  recommendation: ItemRecommendation;
  dataVersion: string | undefined;
  emphasized?: boolean;
};

export function RecommendationCard({ recommendation, dataVersion, emphasized }: Props): JSX.Element {
  const item = findCatalogItem(recommendation.itemId);
  if (!item) {
    return <div className="rec-card rec-card--error">Unknown item ({recommendation.itemId})</div>;
  }

  return (
    <article className={`rec-card${emphasized ? ' rec-card--primary' : ''}`}>
      <header className="rec-card__header">
        <img
          className="rec-card__icon"
          src={itemIconUrl(item.iconId, dataVersion)}
          alt=""
          width={32}
          height={32}
        />
        <div className="rec-card__title">
          <span className="rec-card__item-name">{item.name}</span>
          <span className="rec-card__label">{LABEL_TEXT[recommendation.label]}</span>
        </div>
        <div className="rec-card__price">
          <span>{item.totalPrice}g</span>
          {recommendation.goldNeeded > 0 && (
            <span className="rec-card__gold-needed">need {recommendation.goldNeeded}g</span>
          )}
        </div>
      </header>

      <ul className="rec-card__reasons">
        {recommendation.reasons.slice(0, 2).map((code) => (
          <li key={code}>{REASON_TEXT[code]}</li>
        ))}
      </ul>

      <p className="rec-card__tradeoff">{TRADEOFF_TEXT[recommendation.tradeoffs[0]!]}</p>
    </article>
  );
}
