import { describe, it, expect } from 'vitest';
import {
  isVideoUrl,
  wrapWithVideoTag,
  isVideoUploadPlaceholder,
  isAttachmentUrl,
  findDiffWindow,
  detectVideoUploadCompletion,
} from './url-matcher';

describe('isVideoUrl', () => {
  it('GitHub user-attachments の UUID 形式を true にする', () => {
    expect(
      isVideoUrl(
        'https://github.com/user-attachments/assets/068fdea1-a09b-4747-9a48-88057696206a',
      ),
    ).toBe(true);
  });

  it('前後の空白は許容する', () => {
    expect(
      isVideoUrl(
        '  https://github.com/user-attachments/assets/068fdea1-a09b-4747-9a48-88057696206a  ',
      ),
    ).toBe(true);
  });

  it('複数行のテキストは false', () => {
    expect(
      isVideoUrl(
        'https://github.com/user-attachments/assets/068fdea1-a09b-4747-9a48-88057696206a\nfoo',
      ),
    ).toBe(false);
  });

  it('URL の前後に余計なテキストがある場合は false', () => {
    expect(
      isVideoUrl(
        'see this: https://github.com/user-attachments/assets/068fdea1-a09b-4747-9a48-88057696206a',
      ),
    ).toBe(false);
  });

  it('mp4 直 URL は false（今回はスコープ外）', () => {
    expect(isVideoUrl('https://example.com/video.mp4')).toBe(false);
  });

  it('YouTube は false', () => {
    expect(isVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      false,
    );
  });

  it('普通の GitHub URL は false', () => {
    expect(isVideoUrl('https://github.com/user/repo/pull/1')).toBe(false);
  });

  it('user-attachments の image など別パスは false', () => {
    expect(
      isVideoUrl('https://github.com/user-attachments/files/123/file.zip'),
    ).toBe(false);
  });

  it('空文字は false', () => {
    expect(isVideoUrl('')).toBe(false);
  });
});

describe('wrapWithVideoTag', () => {
  it('<video src="URL"></video> 形式で囲む', () => {
    const url =
      'https://github.com/user-attachments/assets/068fdea1-a09b-4747-9a48-88057696206a';
    expect(wrapWithVideoTag(url)).toBe(`<video src="${url}"></video>`);
  });

  it('前後空白を trim する', () => {
    const url =
      'https://github.com/user-attachments/assets/068fdea1-a09b-4747-9a48-88057696206a';
    expect(wrapWithVideoTag(`  ${url}  `)).toBe(`<video src="${url}"></video>`);
  });
});

describe('isVideoUploadPlaceholder', () => {
  it('.mov の Uploading プレースホルダを true', () => {
    expect(
      isVideoUploadPlaceholder('Uploading 画面収録 2026-05-18 午後5.52.31.mov…'),
    ).toBe(true);
  });

  it('.mp4 / .webm / .m4v も true', () => {
    expect(isVideoUploadPlaceholder('Uploading test.mp4…')).toBe(true);
    expect(isVideoUploadPlaceholder('Uploading test.webm…')).toBe(true);
    expect(isVideoUploadPlaceholder('Uploading test.m4v…')).toBe(true);
  });

  it('"..." (ピリオド3つ) でも true', () => {
    expect(isVideoUploadPlaceholder('Uploading test.mov...')).toBe(true);
  });

  it('Markdown image syntax で囲まれた形式も true', () => {
    expect(isVideoUploadPlaceholder('![Uploading test.mov…]()')).toBe(true);
  });

  it('画像（.png）の Uploading は false', () => {
    expect(isVideoUploadPlaceholder('Uploading test.png…')).toBe(false);
  });

  it('普通のテキストは false', () => {
    expect(isVideoUploadPlaceholder('hello world')).toBe(false);
  });
});

describe('isAttachmentUrl', () => {
  it('user-attachments URL は true', () => {
    expect(
      isAttachmentUrl(
        'https://github.com/user-attachments/assets/514c9fa3-8ebf-4758-95ef-8444ff7db48c',
      ),
    ).toBe(true);
  });

  it('別の URL は false', () => {
    expect(isAttachmentUrl('https://example.com/foo')).toBe(false);
  });
});

describe('findDiffWindow', () => {
  it('完全一致なら null', () => {
    expect(findDiffWindow('hello', 'hello')).toBeNull();
  });

  it('途中の置換を検出する', () => {
    const result = findDiffWindow('abc OLD xyz', 'abc NEW xyz');
    expect(result).toEqual({ start: 4, oldText: 'OLD', newText: 'NEW' });
  });

  it('先頭の置換を検出する', () => {
    const result = findDiffWindow('OLD xyz', 'NEW xyz');
    expect(result).toEqual({ start: 0, oldText: 'OLD', newText: 'NEW' });
  });

  it('末尾の置換を検出する', () => {
    const result = findDiffWindow('abc OLD', 'abc NEW');
    expect(result).toEqual({ start: 4, oldText: 'OLD', newText: 'NEW' });
  });

  it('挿入を検出する', () => {
    const result = findDiffWindow('abc xyz', 'abc INSERTED xyz');
    expect(result).toEqual({ start: 4, oldText: '', newText: 'INSERTED ' });
  });
});

describe('detectVideoUploadCompletion', () => {
  const URL =
    'https://github.com/user-attachments/assets/514c9fa3-8ebf-4758-95ef-8444ff7db48c';

  it('Uploading XXX.mov… → URL の置換を検出', () => {
    const prev = 'foo Uploading 画面収録 2026-05-18 午後5.52.31.mov… bar';
    const current = `foo ${URL} bar`;
    const result = detectVideoUploadCompletion(prev, current);
    expect(result).not.toBeNull();
    expect(result?.url).toBe(URL);
    expect(result?.start).toBe(4);
    expect(result?.end).toBe(4 + URL.length);
  });

  it('行頭の Uploading からの置換', () => {
    const prev = 'Uploading test.mov…';
    const current = URL;
    const result = detectVideoUploadCompletion(prev, current);
    expect(result).not.toBeNull();
    expect(result?.url).toBe(URL);
  });

  it('画像（.png）の Uploading 置換は null', () => {
    const prev = 'Uploading test.png…';
    const current = URL;
    expect(detectVideoUploadCompletion(prev, current)).toBeNull();
  });

  it('ユーザータイピング（無関係な変更）は null', () => {
    const prev = 'hello';
    const current = 'hello world';
    expect(detectVideoUploadCompletion(prev, current)).toBeNull();
  });

  it('差分なしは null', () => {
    expect(detectVideoUploadCompletion('same', 'same')).toBeNull();
  });

  it('置換先が URL でない場合は null（例: テキスト編集）', () => {
    const prev = 'Uploading test.mov…';
    const current = 'edited text';
    expect(detectVideoUploadCompletion(prev, current)).toBeNull();
  });

  it('![Uploading test.mov…]() 形式でも検出', () => {
    const prev = '![Uploading test.mov…]()';
    const current = URL;
    const result = detectVideoUploadCompletion(prev, current);
    expect(result).not.toBeNull();
    expect(result?.url).toBe(URL);
  });
});
