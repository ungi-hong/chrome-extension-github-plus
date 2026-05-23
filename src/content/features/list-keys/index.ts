import type { Feature } from '../../../shared/types';
import { getCurrentLine, replaceRange } from '../../textarea-utils';
import { INDENT_WIDTH, isEmptyBullet, parseListLine } from './list-parser';

/**
 * List Keys 機能。
 *
 * Obsidian/Notion/Typora 互換の Markdown リスト編集を GitHub textarea に提供する：
 * - Tab          : リスト行のインデントを1段深くする
 * - Shift+Tab    : リスト行のインデントを1段浅くする
 * - Enter (空 bullet, インデント1段以上) : 1段アウトデント
 * - Enter (空 bullet, インデント0)       : GitHub デフォルトに任せる（bullet 消える）
 * - Enter (内容あり)                     : GitHub デフォルトに任せる（bullet 継続）
 */
export const listKeysFeature: Feature = {
  id: 'list-keys',
  label: 'List Keys',
  description:
    'Markdownリスト内で Tab/Shift+Tab でインデント、空の "- " で Enter するとアウトデント（Obsidian/Notion 互換）。',
  defaultEnabled: true,
  attach(textarea) {
    const handler = (e: KeyboardEvent) => {
      // 修飾キー（Cmd/Ctrl/Alt）が押されているケースは触らない
      // ただし Shift+Tab は対象なので除外
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'Tab') {
        handleTab(e, textarea);
        return;
      }
      if (e.key === 'Enter') {
        handleEnter(e, textarea);
        return;
      }
    };
    textarea.addEventListener('keydown', handler);
    return () => textarea.removeEventListener('keydown', handler);
  },
};

function handleTab(e: KeyboardEvent, ta: HTMLTextAreaElement): void {
  const line = getCurrentLine(ta);
  const parsed = parseListLine(line.lineText);
  if (!parsed) return; // リスト行でない場合は通常の Tab に任せる（フォーカス移動）

  e.preventDefault();

  // 現在のカーソル/選択範囲を覚えておく
  const origStart = ta.selectionStart;
  const origEnd = ta.selectionEnd;

  if (e.shiftKey) {
    // Shift+Tab: アウトデント
    if (parsed.indent < INDENT_WIDTH) return; // これ以上戻せない
    // 行頭のスペース INDENT_WIDTH 個を削除
    replaceRange(ta, line.lineStart, line.lineStart + INDENT_WIDTH, '');
    // カーソルも左に INDENT_WIDTH 分シフト（ただし行頭より前には行かない）
    const newStart = Math.max(line.lineStart, origStart - INDENT_WIDTH);
    const newEnd = Math.max(line.lineStart, origEnd - INDENT_WIDTH);
    ta.setSelectionRange(newStart, newEnd);
  } else {
    // Tab: インデント
    const indentStr = ' '.repeat(INDENT_WIDTH);
    replaceRange(ta, line.lineStart, line.lineStart, indentStr);
    // カーソルも右に INDENT_WIDTH 分シフト
    ta.setSelectionRange(origStart + INDENT_WIDTH, origEnd + INDENT_WIDTH);
  }
}

function handleEnter(e: KeyboardEvent, ta: HTMLTextAreaElement): void {
  // Shift+Enter / Cmd+Enter / IME 変換中は触らない
  if (e.shiftKey || e.isComposing) return;

  const line = getCurrentLine(ta);
  const parsed = parseListLine(line.lineText);
  if (!parsed) return;
  if (!isEmptyBullet(parsed)) return; // 内容あり → GitHub に任せる
  if (parsed.indent < INDENT_WIDTH) return; // 最上位 → GitHub に任せる（bullet 削除される）

  // アウトデント：現在行を1段戻した bullet で置換
  e.preventDefault();
  const newIndent = ' '.repeat(parsed.indent - INDENT_WIDTH);
  const newLine = `${newIndent}${parsed.marker}${parsed.spaceAfterMarker || ' '}`;
  replaceRange(ta, line.lineStart, line.lineEnd, newLine);
  // カーソルを行末へ
  const newCursor = line.lineStart + newLine.length;
  ta.setSelectionRange(newCursor, newCursor);
}

// テスト用に内部関数を export
export const __test__ = {
  handleTab,
  handleEnter,
};
