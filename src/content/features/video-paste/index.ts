import type { Feature } from '../../../shared/types';
import { dispatchInput, insertAtCursor } from '../../textarea-utils';
import {
  detectVideoUploadCompletion,
  isVideoUrl,
  wrapWithVideoTag,
} from './url-matcher';

/**
 * Video Paste 機能。
 *
 * 動画 URL を自動で <video src="URL"></video> で囲む。
 * トリガーは2種類：
 *
 * 1. ペースト: 動画 URL（https://github.com/user-attachments/assets/<UUID>）を
 *    ユーザーが直接ペーストしたタイミング
 *
 * 2. アップロード完了による置換: ユーザーが動画ファイルをドロップ／添付すると
 *    GitHub がまず "Uploading XXX.mov…" プレースホルダを入れる。アップロード
 *    完了時にこれを実URL に置換するので、その置換タイミングを input イベントで
 *    検知し、自動で <video> タグで囲む。
 */
export const videoPasteFeature: Feature = {
  id: 'video-paste',
  label: 'Video Paste',
  description:
    '動画URL（https://github.com/user-attachments/assets/...）をペーストしたとき、または動画アップロード完了でプレースホルダが置換されたときに、自動的に <video> タグで囲みます。',
  defaultEnabled: true,
  attach(textarea) {
    // ---- Paste ハンドラ ----
    const pasteHandler = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain') ?? '';
      if (!isVideoUrl(text)) return;
      e.preventDefault();
      insertAtCursor(textarea, wrapWithVideoTag(text));
    };
    textarea.addEventListener('paste', pasteHandler);

    // ---- Upload 完了検知用 input ハンドラ ----
    // 直前の value を保持しておき、変化があるたびに diff を取って
    // 動画プレースホルダ → URL への置換であれば <video> で囲む
    let prevValue = textarea.value;
    let isApplying = false; // 自分の書換による再帰を防ぐ

    const inputHandler = () => {
      if (isApplying) {
        prevValue = textarea.value;
        return;
      }
      const current = textarea.value;
      const detected = detectVideoUploadCompletion(prevValue, current);
      if (!detected) {
        prevValue = current;
        return;
      }

      // 既に <video src=... で囲まれていれば触らない（多重適用防止）
      const before = current.slice(Math.max(0, detected.start - 13), detected.start);
      if (before.endsWith('<video src="')) {
        prevValue = current;
        return;
      }

      // 該当 URL を <video> で囲んだ文字列に置換
      isApplying = true;
      try {
        const wrapped = wrapWithVideoTag(detected.url);
        // setRangeText は focus 不要で動作する
        textarea.setRangeText(wrapped, detected.start, detected.end, 'end');
        dispatchInput(textarea);
      } finally {
        isApplying = false;
      }
      prevValue = textarea.value;
    };
    textarea.addEventListener('input', inputHandler);

    // ---- cleanup ----
    return () => {
      textarea.removeEventListener('paste', pasteHandler);
      textarea.removeEventListener('input', inputHandler);
    };
  },
};
