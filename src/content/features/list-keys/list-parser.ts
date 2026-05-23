/**
 * Markdown のリスト行を解析する。
 *
 * 対応する bullet:
 * - 順序なし: `-`, `*`, `+`
 * - 順序あり: `1.`, `2.` ...
 * - チェックボックス: `- [ ]`, `- [x]`, `* [ ]`, `+ [ ]`
 */

export type ListLine = {
  /** 行頭のスペース数（インデント深さ） */
  indent: number;
  /** bullet 部分（例: '-', '*', '+', '1.', '- [ ]'） */
  marker: string;
  /** bullet の後のスペース（通常は ' '） */
  spaceAfterMarker: string;
  /** bullet 以降の本文（trim される前の生のまま） */
  content: string;
};

/**
 * 1行を解析する。リスト行でなければ null。
 *
 * 例:
 *   '  - foo'    => { indent: 2, marker: '-', spaceAfterMarker: ' ', content: 'foo' }
 *   '- [ ] task' => { indent: 0, marker: '- [ ]', spaceAfterMarker: ' ', content: 'task' }
 *   '1. item'    => { indent: 0, marker: '1.', spaceAfterMarker: ' ', content: 'item' }
 *   '  - '       => { indent: 2, marker: '-', spaceAfterMarker: ' ', content: '' }
 */
export function parseListLine(line: string): ListLine | null {
  // 行頭スペース（タブは2スペース換算で扱う）
  const indentMatch = /^([ \t]*)/.exec(line);
  const indentStr = indentMatch ? indentMatch[1] : '';
  const indent = indentStr.replace(/\t/g, '  ').length;
  const rest = line.slice(indentStr.length);

  // bullet 抽出
  // チェックボックスを先に試す
  const checkboxMatch = /^([-*+])\s+(\[[ xX]\])(\s+)(.*)$/.exec(rest);
  if (checkboxMatch) {
    return {
      indent,
      marker: `${checkboxMatch[1]} ${checkboxMatch[2]}`,
      spaceAfterMarker: checkboxMatch[3],
      content: checkboxMatch[4],
    };
  }

  // 通常の順序なしリスト
  const unorderedMatch = /^([-*+])(\s+)(.*)$/.exec(rest);
  if (unorderedMatch) {
    return {
      indent,
      marker: unorderedMatch[1],
      spaceAfterMarker: unorderedMatch[2],
      content: unorderedMatch[3],
    };
  }

  // 順序なしリストで本文が空（末尾スペース無し）: '-' のみ
  const unorderedEmptyMatch = /^([-*+])$/.exec(rest);
  if (unorderedEmptyMatch) {
    return {
      indent,
      marker: unorderedEmptyMatch[1],
      spaceAfterMarker: '',
      content: '',
    };
  }

  // 順序ありリスト
  const orderedMatch = /^(\d+\.)(\s+)(.*)$/.exec(rest);
  if (orderedMatch) {
    return {
      indent,
      marker: orderedMatch[1],
      spaceAfterMarker: orderedMatch[2],
      content: orderedMatch[3],
    };
  }

  // 順序ありで本文空
  const orderedEmptyMatch = /^(\d+\.)$/.exec(rest);
  if (orderedEmptyMatch) {
    return {
      indent,
      marker: orderedEmptyMatch[1],
      spaceAfterMarker: '',
      content: '',
    };
  }

  return null;
}

/**
 * bullet の本文が空かどうか（' - ' のみで内容なし、を含む）。
 */
export function isEmptyBullet(parsed: ListLine): boolean {
  return parsed.content.trim() === '';
}

/** インデント1段分の幅。 */
export const INDENT_WIDTH = 2;
