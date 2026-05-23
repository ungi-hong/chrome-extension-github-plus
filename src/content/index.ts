/**
 * Content script のエントリーポイント。
 * GitHub のページに注入され、有効な機能を textarea に attach する。
 */

import { loadSettings, onSettingsChanged } from '../shared/settings';
import type { Settings } from '../shared/types';
import { ALL_FEATURES, buildDefaultSettings } from './features';
import { TextareaObserver } from './textarea-observer';

async function main(): Promise<void> {
  const defaults = buildDefaultSettings();
  let currentSettings: Settings = await loadSettings(defaults);

  const observer = new TextareaObserver((textarea) => {
    const cleanups: Array<() => void> = [];
    for (const feature of ALL_FEATURES) {
      if (currentSettings[feature.id]) {
        cleanups.push(feature.attach(textarea));
      }
    }
    return cleanups;
  });

  observer.start();

  // 設定変更を購読し、全 textarea を再 attach
  onSettingsChanged((newSettings) => {
    currentSettings = { ...defaults, ...newSettings };
    observer.rebindAll();
  });
}

main().catch((err) => {
  // 拡張機能側のエラーがページ側に漏れないようログだけ出す
  console.error('[github-plus] init failed:', err);
});
