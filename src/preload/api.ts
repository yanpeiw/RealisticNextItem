import type { IpcRenderer } from 'electron';
import { IPC_CHANNELS, PublicGameStateSchema, AppSettingsSchema, type AppSettings, type AppSettingsPatch, type PublicGameState } from '@shared/schemas/ipc-schemas';

/**
 * The complete, minimal typed surface exposed to the renderer via
 * contextBridge (section 13). No arbitrary IPC, filesystem access, shell
 * commands, or raw Electron APIs are reachable from here.
 */
export type AdvisorDesktopApi = {
  subscribeToGameState(callback: (state: PublicGameState) => void): () => void;
  getSettings(): Promise<AppSettings>;
  updateSettings(patch: AppSettingsPatch): Promise<AppSettings>;
  setClickThrough(enabled: boolean): Promise<void>;
  startMockMatch(scenarioId: string): Promise<void>;
  stopMockMatch(): Promise<void>;
};

export function createAdvisorDesktopApi(ipcRenderer: IpcRenderer): AdvisorDesktopApi {
  return {
    subscribeToGameState(callback) {
      const listener = (_event: unknown, payload: unknown): void => {
        const parsed = PublicGameStateSchema.safeParse(payload);
        if (parsed.success) callback(parsed.data);
      };
      ipcRenderer.on(IPC_CHANNELS.GAME_STATE_CHANGED, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.GAME_STATE_CHANGED, listener);
    },
    async getSettings() {
      const result = await ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS);
      return AppSettingsSchema.parse(result);
    },
    async updateSettings(patch) {
      const result = await ipcRenderer.invoke(IPC_CHANNELS.UPDATE_SETTINGS, patch);
      return AppSettingsSchema.parse(result);
    },
    async setClickThrough(enabled) {
      await ipcRenderer.invoke(IPC_CHANNELS.SET_CLICK_THROUGH, { enabled });
    },
    async startMockMatch(scenarioId) {
      await ipcRenderer.invoke(IPC_CHANNELS.START_MOCK_MATCH, { scenarioId });
    },
    async stopMockMatch() {
      await ipcRenderer.invoke(IPC_CHANNELS.STOP_MOCK_MATCH);
    },
  };
}
