import { create } from 'zustand';

type UiStore = {
  expanded: boolean;
  settingsOpen: boolean;
  clickThrough: boolean;
  toggleExpanded: () => void;
  setSettingsOpen: (open: boolean) => void;
  setClickThrough: (enabled: boolean) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  expanded: false,
  settingsOpen: false,
  clickThrough: false,
  toggleExpanded: () => set((s) => ({ expanded: !s.expanded })),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setClickThrough: (enabled) => set({ clickThrough: enabled }),
}));
