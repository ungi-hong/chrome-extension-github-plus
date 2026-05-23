/**
 * 各機能（Feature）が実装すべきインターフェース。
 *
 * すべての機能は `src/content/features/<id>/` 配下に閉じ込められ、
 * このインターフェースを通してだけ外と接続する。
 * 機能間の相互 import は ESLint で禁止されている。
 */
export type Feature = {
  /** 内部ID。設定保存のキーに使う。kebab-case 推奨。 */
  id: string;
  /** Options ページに表示するラベル。 */
  label: string;
  /** Options ページに表示する説明文。 */
  description: string;
  /** 初期状態で有効か。 */
  defaultEnabled: boolean;
  /**
   * 対象 textarea が検出されたときに呼ばれる。
   * 返り値は cleanup 関数（イベント解除）。
   */
  attach: (textarea: HTMLTextAreaElement) => () => void;
};

/**
 * 設定の永続化形式。
 * key は Feature の id、value は有効/無効。
 */
export type Settings = Record<string, boolean>;
