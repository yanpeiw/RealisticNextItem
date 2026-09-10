import type { AdvisorDesktopApi } from '../../preload/api';

declare global {
  interface Window {
    advisor: AdvisorDesktopApi;
  }
}

export {};
