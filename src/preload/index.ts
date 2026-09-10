import { contextBridge, ipcRenderer } from 'electron';
import { createAdvisorDesktopApi } from './api';

contextBridge.exposeInMainWorld('advisor', createAdvisorDesktopApi(ipcRenderer));
