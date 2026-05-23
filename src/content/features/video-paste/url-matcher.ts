/**
 * GitHub の動画アップロード後の URL を識別する。
 *
 * メインターゲット：
 *   https://github.com/user-attachments/assets/<UUID>
 *
 * 動画ファイル（.mov, .mp4, .webm 等）を GitHub の description 欄にドロップすると
 *   1. 一時的に "Uploading XXX.mov…" プレースホルダが入る
 *   2. アップロード完了後、上記 URL に置換される
 * 当機能はこの完了後 URL がペーストされたとき、
 * または GitHub によって自動置換されたときに <video> タグで囲む。
 */

const GITHUB_ATTACHMENT_PATTERN =
  /^https:\/\/github\.com\/user-attachments\/assets\/[0-9a-f-]{10,}$/i;

/** 動画として扱う拡張子 */
const VIDEO_EXTENSIONS = ['mov', 'mp4', 'webm', 'm4v'];

/**
 * 与えられたテキスト（ペースト内容）が動画 URL かどうか判定する。
 *
 * 前後の空白は許容するが、複数行や URL 以外の文字を含む場合は false。
 * （誤動作回避のため、純粋な URL のみ true）
 */
export function isVideoUrl(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.includes('\n')) return false;
  if (trimmed.includes(' ')) return false;
  return GITHUB_ATTACHMENT_PATTERN.test(trimmed);
}

/**
 * 動画 URL を <video> タグで囲んだ文字列を返す。
 */
export function wrapWithVideoTag(url: string): string {
  return `<video src="${url.trim()}"></video>`;
}

/**
 * GitHub のアップロード中プレースホルダ全般のパターン。
 * 例:
 *   "Uploading 画面収録 2026-05-18 午後5.52.31.mov…"
 *   "![Uploading file.mp4…]()"
 * 末尾の … は U+2026 だが、稀に "..." (ピリオド3つ) も許容する。
 */
const VIDEO_PLACEHOLDER_RE = new RegExp(
  // 前置きの `![` は optional
  '(!\\[)?' +
    // Uploading <filename>.<ext>
    'Uploading\\s+[^\\n\\]]*?\\.(' +
    VIDEO_EXTENSIONS.join('|') +
    ')' +
    // 末尾の "…" or "..."（optional に近いが GitHub は付与する）
    '(?:\\u2026|\\.{3})?' +
    // 後置きの `]()` も optional
    '(\\]\\(\\))?',
  'i',
);

/**
 * テキストが動画のアップロード中プレースホルダかどうかを判定する。
 */
export function isVideoUploadPlaceholder(text: string): boolean {
  return VIDEO_PLACEHOLDER_RE.test(text.trim());
}

/**
 * テキストが GitHub の attachment URL かどうかを判定する。
 */
export function isAttachmentUrl(text: string): boolean {
  return GITHUB_ATTACHMENT_PATTERN.test(text.trim());
}

/**
 * 2つの文字列の最初に変化した範囲（"diff window"）を返す。
 *
 * GitHub が `Uploading XXX.mov…` プレースホルダを attachment URL に
 * 置換するとき、それは局所的な1箇所の置換なので、
 * 共通プレフィックス・サフィックスを除いた中央部分を取り出すと
 * 旧テキスト / 新テキストの差分が得られる。
 *
 * 差分がない場合は null。
 */
export type DiffWindow = {
  /** prev/current 共通の前から見た開始位置 */
  start: number;
  /** prev における変化部分の文字列 */
  oldText: string;
  /** current における変化部分の文字列 */
  newText: string;
};

export function findDiffWindow(prev: string, current: string): DiffWindow | null {
  if (prev === current) return null;

  // 共通プレフィックス
  let prefixLen = 0;
  const minLen = Math.min(prev.length, current.length);
  while (prefixLen < minLen && prev[prefixLen] === current[prefixLen]) {
    prefixLen++;
  }

  // 共通サフィックス（プレフィックスと重ならない範囲で）
  let suffixLen = 0;
  while (
    suffixLen < prev.length - prefixLen &&
    suffixLen < current.length - prefixLen &&
    prev[prev.length - 1 - suffixLen] === current[current.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  const oldText = prev.slice(prefixLen, prev.length - suffixLen);
  const newText = current.slice(prefixLen, current.length - suffixLen);

  return { start: prefixLen, oldText, newText };
}

/**
 * 動画アップロード完了による置換を検出する。
 *
 * prev に動画プレースホルダがあり、current で対応する位置が
 * GitHub の attachment URL になっている場合、その URL の位置と中身を返す。
 *
 * 検出できなければ null。
 */
export type VideoReplacement = {
  /** current 上の URL 開始位置 */
  start: number;
  /** current 上の URL 終了位置（URL の直後） */
  end: number;
  /** URL 本体 */
  url: string;
};

export function detectVideoUploadCompletion(
  prev: string,
  current: string,
): VideoReplacement | null {
  const diff = findDiffWindow(prev, current);
  if (!diff) return null;
  if (!isVideoUploadPlaceholder(diff.oldText)) return null;

  // diff.newText に URL が含まれていることを確認
  // 完了後は単独の URL に置換されるケースを想定
  const trimmed = diff.newText.trim();
  if (!isAttachmentUrl(trimmed)) return null;

  // URL 本体の位置を返す（newText 内の trim 分のオフセットを考慮）
  const leadingWs = diff.newText.length - diff.newText.trimStart().length;
  const urlStart = diff.start + leadingWs;
  const urlEnd = urlStart + trimmed.length;
  return { start: urlStart, end: urlEnd, url: trimmed };
}
