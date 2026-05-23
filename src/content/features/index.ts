import type { Feature } from '../../shared/types';
import { videoPasteFeature } from './video-paste';
import { listKeysFeature } from './list-keys';

/**
 * 全機能のリスト。
 *
 * 新機能を追加するときは：
 * 1. `src/content/features/<new-id>/` ディレクトリを作る
 * 2. `index.ts` で `Feature` 型の object を export
 * 3. ここに import を追加して配列に並べる
 *
 * 機能間の相互 import は ESLint で禁止されている（.eslintrc.json 参照）。
 */
export const ALL_FEATURES: readonly Feature[] = [
  videoPasteFeature,
  listKeysFeature,
] as const;

/**
 * Feature.id をキーにした defaults Settings を生成する。
 */
export function buildDefaultSettings(): Record<string, boolean> {
  const defaults: Record<string, boolean> = {};
  for (const f of ALL_FEATURES) {
    defaults[f.id] = f.defaultEnabled;
  }
  return defaults;
}
