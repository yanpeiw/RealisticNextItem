import { app, globalShortcut, BrowserWindow, session } from 'electron';
import { createOverlayWindow } from './windows/overlay-window';
import { registerIpcHandlers } from './ipc/register-handlers';
import { SettingsService } from './services/settings-service';
import { DataDragonService } from './services/data-dragon-service';
import { LiveClientService } from './services/live-client-service';
import { IPC_CHANNELS, PublicGameStateSchema } from '@shared/schemas/ipc-schemas';

const settingsService = new SettingsService();
const dataDragonService = new DataDragonService();

let overlayWindow: BrowserWindow | undefined;
let liveClientService: LiveClientService | undefined;

function persistWindowBounds(window: BrowserWindow): void {
  const bounds = window.getBounds();
  settingsService.updateSettings({
    overlayPosition: { x: bounds.x, y: bounds.y },
    overlaySize: { width: bounds.width, height: bounds.height },
  });
}

function registerGlobalShortcuts(window: BrowserWindow): void {
  const { shortcuts } = settingsService.getSettings();
  let clickThroughEnabled = false;

  globalShortcut.register(shortcuts.toggleOverlay, () => {
    if (window.isVisible()) window.hide();
    else window.show();
  });

  globalShortcut.register(shortcuts.toggleClickThrough, () => {
    clickThroughEnabled = !clickThroughEnabled;
    window.setIgnoreMouseEvents(clickThroughEnabled, { forward: true });
    window.webContents.send('advisor:click-through-changed', clickThroughEnabled);
  });
}

function applyRestrictiveCsp(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://ddragon.leagueoflegends.com data:; connect-src 'self' https://ddragon.leagueoflegends.com https://127.0.0.1:2999;",
        ],
      },
    });
  });
}

app.whenReady().then(async () => {
  applyRestrictiveCsp();

  const settings = settingsService.getSettings();
  overlayWindow = createOverlayWindow(settings);

  liveClientService = new LiveClientService((state) => {
    if (!overlayWindow || overlayWindow.isDestroyed()) return;
    const withDataVersion =
      state.status === 'active'
        ? { ...state, dataVersion: dataDragonService.getStatus().version }
        : state;
    const validated = PublicGameStateSchema.parse(withDataVersion);
    overlayWindow.webContents.send(IPC_CHANNELS.GAME_STATE_CHANGED, validated);
  });
  liveClientService.setStrategy(settings.strategyPreference);
  liveClientService.start();

  registerIpcHandlers(overlayWindow, settingsService, liveClientService);
  registerGlobalShortcuts(overlayWindow);

  let persistTimer: ReturnType<typeof setTimeout> | undefined;
  const schedulePersist = (): void => {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => overlayWindow && persistWindowBounds(overlayWindow), 400);
  };
  overlayWindow.on('moved', schedulePersist);
  overlayWindow.on('resized', schedulePersist);

  void dataDragonService.initialize();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      overlayWindow = createOverlayWindow(settingsService.getSettings());
    }
  });
});

app.on('window-all-closed', () => {
  liveClientService?.stop();
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
