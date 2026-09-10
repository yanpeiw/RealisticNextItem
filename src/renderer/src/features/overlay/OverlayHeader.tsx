import { useUiStore } from '../../stores/ui-store';

type Props = {
  onOpenSettings: () => void;
};

export function OverlayHeader({ onOpenSettings }: Props): JSX.Element {
  const { expanded, toggleExpanded, clickThrough, setClickThrough } = useUiStore();

  async function handleToggleClickThrough(): Promise<void> {
    const next = !clickThrough;
    setClickThrough(next);
    await window.advisor.setClickThrough(next);
  }

  return (
    <header className="overlay-header" data-drag-region>
      <span className="overlay-header__title">LoL Item Advisor</span>
      <div className="overlay-header__actions">
        <button type="button" onClick={toggleExpanded} aria-pressed={expanded} title="Toggle details">
          {expanded ? 'Less' : 'More'}
        </button>
        <button
          type="button"
          onClick={() => void handleToggleClickThrough()}
          aria-pressed={clickThrough}
          title="Toggle click-through"
        >
          {clickThrough ? 'Locked' : 'Lock'}
        </button>
        <button type="button" onClick={onOpenSettings} title="Settings" aria-label="Settings">
          ⚙
        </button>
      </div>
    </header>
  );
}
