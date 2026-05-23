import type { Settings } from './types';

const STORAGE_KEY = 'github-plus:settings';

/**
 * chrome.storage.sync から設定を読む。
 * 未設定のキーは defaults で補完する。
 */
export async function loadSettings(defaults: Settings): Promise<Settings> {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  const stored = (result[STORAGE_KEY] ?? {}) as Settings;
  return { ...defaults, ...stored };
}

/**
 * chrome.storage.sync に設定を保存する。
 */
export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
}

/**
 * 設定変更を購読する。
 * 返り値は購読解除関数。
 */
export function onSettingsChanged(
  callback: (settings: Settings) => void,
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: chrome.storage.AreaName,
  ) => {
    if (areaName !== 'sync') return;
    if (!(STORAGE_KEY in changes)) return;
    const newValue = (changes[STORAGE_KEY].newValue ?? {}) as Settings;
    callback(newValue);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
