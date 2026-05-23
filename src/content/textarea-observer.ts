/**
 * GitHub の Markdown 編集対象 textarea を検出・監視するモジュール。
 *
 * GitHub は新旧両 UI とも実体は素の <textarea>（ProseMirror/CodeMirror ではない）。
 * Edit / Reply / Review など動的に追加される textarea にも対応するため
 * MutationObserver で document 全体を監視する。
 *
 * 重複バインドを避けるため、対応済み要素には `data-gh-plus-bound` を付与する。
 */

/**
 * GitHub の Markdown 編集 textarea を識別するセレクタ。
 * 新 UI（Primer React MarkdownEditor）と旧 UI を両方カバーする。
 */
const TEXTAREA_SELECTOR = [
  'textarea[data-testid="markdown-editor-textarea"]',
  'textarea.js-comment-field',
  'textarea[name="comment[body]"]',
  'textarea[name="issue[body]"]',
  'textarea[name="pull_request[body]"]',
  'textarea#new_comment_field',
  'textarea#issue_body',
  'textarea#pull_request_body',
].join(', ');

const BOUND_ATTR = 'data-gh-plus-bound';

/**
 * 検出されたすべての対象 textarea を追跡し、機能の attach/detach を司る。
 */
export class TextareaObserver {
  /** key: textarea, value: 各機能の cleanup 関数の配列 */
  private bindings = new Map<HTMLTextAreaElement, Array<() => void>>();

  /** textarea が新規に検出されたときに呼ばれる callback */
  private onTextareaFound: (ta: HTMLTextAreaElement) => Array<() => void>;

  private observer: MutationObserver | null = null;

  constructor(
    onTextareaFound: (ta: HTMLTextAreaElement) => Array<() => void>,
  ) {
    this.onTextareaFound = onTextareaFound;
  }

  /** 監視を開始する。document.body 配下を再帰的に監視する。 */
  start(): void {
    // 既に存在する textarea を処理
    this.scan(document);

    // 以降の追加を監視
    this.observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof Element)) continue;
          this.scan(node);
        }
      }
    });
    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  /** 監視を停止し、すべての binding をクリアする。 */
  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    for (const cleanups of this.bindings.values()) {
      for (const cleanup of cleanups) cleanup();
    }
    this.bindings.clear();
  }

  /**
   * すべての textarea で機能を再 attach する（設定変更時に呼ぶ）。
   */
  rebindAll(): void {
    const textareas = Array.from(this.bindings.keys());
    for (const ta of textareas) {
      const cleanups = this.bindings.get(ta);
      if (cleanups) {
        for (const cleanup of cleanups) cleanup();
      }
      const newCleanups = this.onTextareaFound(ta);
      this.bindings.set(ta, newCleanups);
    }
  }

  /**
   * 指定 root 配下の対象 textarea を探して bind する。
   */
  private scan(root: Document | Element): void {
    const matches = root.querySelectorAll(TEXTAREA_SELECTOR);
    for (const el of matches) {
      if (el instanceof HTMLTextAreaElement) {
        this.bind(el);
      }
    }
    // root 自身が textarea の場合
    if (
      root instanceof HTMLTextAreaElement &&
      root.matches(TEXTAREA_SELECTOR)
    ) {
      this.bind(root);
    }
  }

  private bind(ta: HTMLTextAreaElement): void {
    if (ta.hasAttribute(BOUND_ATTR)) return;
    ta.setAttribute(BOUND_ATTR, '1');
    const cleanups = this.onTextareaFound(ta);
    this.bindings.set(ta, cleanups);
  }
}
