import { ipcMain, type BrowserWindow } from 'electron';
import { IPC_CHANNELS, SetClickThroughSchema, StartMockMatchSchema } from '@shared/schemas/ipc-schemas';
import type { SettingsService } from '../services/settings-service';
import type { LiveClientService } from '../services/live-client-service';

/**
 * Registers the complete allowlisted IPC surface (section 14). Every
 * payload crossing this boundary, in either direction, is validated with
 * Zod before it's trusted.
 */
export function registerIpcHandlers(
  window: BrowserWindow,
  settingsService: SettingsService,
  liveClientService: LiveClientService,
): void {
  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, () => settingsService.getSettings());

  ipcMain.handle(IPC_CHANNELS.UPDATE_SETTINGS, (_event, patch: unknown) => {
    const updated = settingsService.updateSettings(patch);
    if (updated.strategyPreference) liveClientService.setStrategy(updated.strategyPreference);
    return updated;
  });

  ipcMain.handle(IPC_CHANNELS.SET_CLICK_THROUGH, (_event, payload: unknown) => {
    const { enabled } = SetClickThroughSchema.parse(payload);
    window.setIgnoreMouseEvents(enabled, { forward: true });
  });

  ipcMain.handle(IPC_CHANNELS.START_MOCK_MATCH, (_event, payload: unknown) => {
    const { scenarioId } = StartMockMatchSchema.parse(payload);
    liveClientService.startMockMatch(scenarioId);
  });

  ipcMain.handle(IPC_CHANNELS.STOP_MOCK_MATCH, () => {
    liveClientService.stopMockMatch();
  });
}
