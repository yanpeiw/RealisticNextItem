import Store from 'electron-store';
import { AppSettingsSchema, DEFAULT_SETTINGS, SettingsPatchSchema, type AppSettings } from '@shared/schemas/ipc-schemas';

/**
 * The only thing this app persists to disk: user settings and overlay
 * position/size. No match data, snapshots, or identity ever reaches here
 * (see LOL_ITEM_ADVISOR_BRAIN.md section 12 and section 16).
 */
export class SettingsService {
  private readonly store: Store<AppSettings>;

  constructor() {
    this.store = new Store<AppSettings>({
      name: 'advisor-settings',
      defaults: DEFAULT_SETTINGS,
    });
  }

  getSettings(): AppSettings {
    const raw = this.store.store;
    const parsed = AppSettingsSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
    // Corrupt or pre-migration settings file: fall back to defaults rather
    // than crash the app.
    this.store.set(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }

  updateSettings(patch: unknown): AppSettings {
    const validPatch = SettingsPatchSchema.parse(patch);
    const next = { ...this.getSettings(), ...validPatch };
    const validated = AppSettingsSchema.parse(next);
    this.store.set(validated);
    return validated;
  }
}
