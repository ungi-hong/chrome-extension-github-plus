import { describe, it, expect } from 'vitest';
import { parseListLine, isEmptyBullet } from './list-parser';

describe('parseListLine', () => {
  it('シンプルな - で始まる行を解析', () => {
    expect(parseListLine('- foo')).toEqual({
      indent: 0,
      marker: '-',
      spaceAfterMarker: ' ',
      content: 'foo',
    });
  });

  it('インデントありの - 行', () => {
    expect(parseListLine('  - foo')).toEqual({
      indent: 2,
      marker: '-',
      spaceAfterMarker: ' ',
      content: 'foo',
    });
  });

  it('* で始まる行', () => {
    expect(parseListLine('* bar')).toEqual({
      indent: 0,
      marker: '*',
      spaceAfterMarker: ' ',
      content: 'bar',
    });
  });

  it('+ で始まる行', () => {
    expect(parseListLine('+ baz')).toEqual({
      indent: 0,
      marker: '+',
      spaceAfterMarker: ' ',
      content: 'baz',
    });
  });

  it('順序ありリスト', () => {
    expect(parseListLine('1. item')).toEqual({
      indent: 0,
      marker: '1.',
      spaceAfterMarker: ' ',
      content: 'item',
    });
  });

  it('チェックボックス（未チェック）', () => {
    expect(parseListLine('- [ ] task')).toEqual({
      indent: 0,
      marker: '- [ ]',
      spaceAfterMarker: ' ',
      content: 'task',
    });
  });

  it('チェックボックス（チェック済み）', () => {
    expect(parseListLine('- [x] done')).toEqual({
      indent: 0,
      marker: '- [x]',
      spaceAfterMarker: ' ',
      content: 'done',
    });
  });

  it('空の bullet（"- " のみ）', () => {
    expect(parseListLine('- ')).toEqual({
      indent: 0,
      marker: '-',
      spaceAfterMarker: ' ',
      content: '',
    });
  });

  it('空の bullet（"-" のみ、末尾スペース無し）', () => {
    expect(parseListLine('-')).toEqual({
      indent: 0,
      marker: '-',
      spaceAfterMarker: '',
      content: '',
    });
  });

  it('インデント深い空 bullet', () => {
    expect(parseListLine('    - ')).toEqual({
      indent: 4,
      marker: '-',
      spaceAfterMarker: ' ',
      content: '',
    });
  });

  it('タブはスペース2個換算', () => {
    expect(parseListLine('\t- foo')?.indent).toBe(2);
  });

  it('リストでない行は null', () => {
    expect(parseListLine('普通のテキスト')).toBeNull();
    expect(parseListLine('')).toBeNull();
    expect(parseListLine('  ')).toBeNull();
  });

  it('-Foo のように間にスペースがないものは null', () => {
    expect(parseListLine('-foo')).toBeNull();
  });
});

describe('isEmptyBullet', () => {
  it('content が空文字なら true', () => {
    const parsed = parseListLine('- ');
    expect(parsed && isEmptyBullet(parsed)).toBe(true);
  });

  it('content が空白だけでも true', () => {
    const parsed = parseListLine('-   ');
    expect(parsed && isEmptyBullet(parsed)).toBe(true);
  });

  it('content がある場合は false', () => {
    const parsed = parseListLine('- foo');
    expect(parsed && isEmptyBullet(parsed)).toBe(false);
  });
});
