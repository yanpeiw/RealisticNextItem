import { BrowserWindow, screen } from 'electron';
import { join } from 'node:path';
import { is } from '../utils/environment';
import type { AppSettings } from '@shared/schemas/ipc-schemas';

const MIN_WIDTH = 300;
const MIN_HEIGHT = 160;
const MAX_WIDTH = 900;
const MAX_HEIGHT = 700;

/**
 * The overlay: transparent, frameless, always-on-top, draggable from its own
 * header (see renderer OverlayHeader), resizable within safe bounds, and
 * restorable to its last position -- but only if that position still lands
 * on a connected display (section 10).
 */
export function createOverlayWindow(settings: AppSettings): BrowserWindow {
  const bounds = clampToVisibleDisplay(settings.overlayPosition, settings.overlaySize);

  const window = new BrowserWindow({
    ...bounds,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    maxWidth: MAX_WIDTH,
    maxHeight: MAX_HEIGHT,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    hasShadow: false,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: join(__dirname, '../preload/index.mjs'),
    },
  });

  window.setAlwaysOnTop(true, 'screen-saver');

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  window.once('ready-to-show', () => window.show());

  return window;
}

function clampToVisibleDisplay(
  position: { x: number; y: number },
  size: { width: number; height: number },
): { x: number; y: number; width: number; height: number } {
  const width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, size.width));
  const height = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, size.height));

  const isOnAnyDisplay = screen.getAllDisplays().some((display) => {
    const { x, y, width: w, height: h } = display.workArea;
    return position.x >= x && position.y >= y && position.x < x + w && position.y < y + h;
  });

  if (isOnAnyDisplay) {
    return { x: position.x, y: position.y, width, height };
  }

  const primary = screen.getPrimaryDisplay().workArea;
  return { x: primary.x + 80, y: primary.y + 80, width, height };
}
