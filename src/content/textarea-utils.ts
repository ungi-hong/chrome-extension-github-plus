/**
 * Textarea 操作の共通ユーティリティ。
 *
 * 重要：
 * - `textarea.value = ...` のような直接代入は undo 履歴を破壊するので使わない。
 * - 値を書き換えたら必ず `input` イベントを bubbles: true で発火する。
 *   GitHub の React state とプレビューはこれで追従する。
 */

/**
 * 現在のカーソル位置に文字列を挿入する。
 * - 選択範囲がある場合はそれを置換する
 * - undo 履歴を保つために `setRangeText` を使う
 * - 挿入後カーソルは末尾に移動する
 */
export function insertAtCursor(
  textarea: HTMLTextAreaElement,
  text: string,
): void {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  textarea.setRangeText(text, start, end, 'end');
  dispatchInput(textarea);
}

/**
 * 指定範囲を別文字列に置き換える。
 * - undo 履歴を保つために `setRangeText` を使う
 */
export function replaceRange(
  textarea: HTMLTextAreaElement,
  start: number,
  end: number,
  text: string,
  selectionMode: 'end' | 'start' | 'preserve' | 'select' = 'end',
): void {
  textarea.setRangeText(text, start, end, selectionMode);
  dispatchInput(textarea);
}

/**
 * input イベントを発火する。
 * GitHub の React state を追従させるために必須。
 */
export function dispatchInput(textarea: HTMLTextAreaElement): void {
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * カーソル位置を含む行の情報を返す。
 */
export type LineInfo = {
  /** 行の開始インデックス（textarea.value 内） */
  lineStart: number;
  /** 行の終了インデックス（改行を含まない） */
  lineEnd: number;
  /** 行の内容（改行を含まない） */
  lineText: string;
  /** 行内でのカーソル位置（0 始まり） */
  cursorInLine: number;
};

export function getCurrentLine(textarea: HTMLTextAreaElement): LineInfo {
  const value = textarea.value;
  const cursor = textarea.selectionStart;
  const lineStart = value.lastIndexOf('\n', cursor - 1) + 1;
  const nextNewline = value.indexOf('\n', cursor);
  const lineEnd = nextNewline === -1 ? value.length : nextNewline;
  return {
    lineStart,
    lineEnd,
    lineText: value.slice(lineStart, lineEnd),
    cursorInLine: cursor - lineStart,
  };
}
