import React from 'react';
import { EditorContent, BubbleMenu } from '@tiptap/react';
// Avoid named type import to bypass local bundler resolution issues
type TiptapEditor = import('@tiptap/core').Editor;
import { TiptapToolbar } from './TiptapToolbar';
import './TableBubbleMenu.css';
import './BubbleMenu.css';
import './FloatingPanel.css';

import '../style.css';
// Mantine UI imports removed to revert to previous version
 

// const lowlight = createLowlight(common);

export const TiptapEditor: React.FC<{ editor: TiptapEditor | null; currentFilePath?: string | null; setFilePath: (path: string | null) => void; onOpen?: () => void; onSave?: () => void; onSaveAs?: () => void; openFind?: boolean; openReplace?: boolean; onToggleColorScheme?: () => void; colorScheme?: 'light' | 'dark'; }> = ({ editor, currentFilePath, setFilePath, onOpen, onSave, onSaveAs, openFind, openReplace, onToggleColorScheme, colorScheme }) => {
  const [editingLink, setEditingLink] = React.useState(false);
  const [linkValue, setLinkValue] = React.useState('');
  const [findVisible, setFindVisible] = React.useState(false);
  const [replaceMode, setReplaceMode] = React.useState(false);
  const [findQuery, setFindQuery] = React.useState('');
  const [replaceText, setReplaceText] = React.useState('');
  const [slashVisible, setSlashVisible] = React.useState(false);
  const [slashFilter, setSlashFilter] = React.useState('');
  const [slashIndex, setSlashIndex] = React.useState(0);
  
  React.useEffect(() => {
    if (openFind) { setFindVisible(true); setReplaceMode(!!openReplace); }
  }, [openFind, openReplace]);

  const findNext = (startFrom?: number) => {
    if (!editor || !findQuery.trim()) return false;
    const needle = findQuery.trim().toLowerCase();
    const { doc, selection } = editor.state;
    const start = typeof startFrom === 'number' ? startFrom : selection.to;
    let found: { from: number; to: number } | null = null;
    let first: { from: number; to: number } | null = null;
    doc.descendants((node, pos) => {
      if (!node.isTextblock || found) return;
      const text = node.textContent.toLowerCase();
      if (!text || !text.includes(needle)) return;
      const base = Math.max(0, start - pos - 1);
      const idx = text.indexOf(needle, base);
      if (idx >= 0) {
        found = { from: pos + 1 + idx, to: pos + 1 + idx + needle.length };
      }
      if (!first) {
        const i = text.indexOf(needle);
        if (i >= 0) first = { from: pos + 1 + i, to: pos + 1 + i + needle.length };
      }
    });
    if (!found) found = first;
    if (found) {
      editor.chain().setTextSelection(found).scrollIntoView().focus().run();
      return true;
    }
    return false;
  };

  const findPrev = () => {
    if (!editor || !findQuery.trim()) return false;
    const needle = findQuery.trim().toLowerCase();
    const { doc, selection } = editor.state;
    const selFrom = selection.from;
    let best: { from: number; to: number } | null = null;
    doc.descendants((node, pos) => {
      if (!node.isTextblock) return;
      const text = node.textContent.toLowerCase();
      if (!text || !text.includes(needle)) return;
      let idx = text.indexOf(needle);
      while (idx >= 0) {
        const from = pos + 1 + idx;
        const to = from + needle.length;
        if (to <= selFrom) best = { from, to };
        idx = text.indexOf(needle, idx + 1);
      }
    });
    if (!best) {
      doc.descendants((node, pos) => {
        if (!node.isTextblock) return;
        const text = node.textContent.toLowerCase();
        if (!text || !text.includes(needle)) return;
        let last = -1, idx = text.indexOf(needle);
        while (idx >= 0) { last = idx; idx = text.indexOf(needle, idx + 1); }
        if (last >= 0) {
          const from = pos + 1 + last;
          const to = from + needle.length;
          best = { from, to };
        }
      });
    }
    if (best) {
      editor.chain().setTextSelection(best).scrollIntoView().focus().run();
      return true;
    }
    return false;
  };

  const replaceCurrent = () => {
    if (!editor || !findQuery.trim()) return;
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, '\n', '\n');
    if (selected.toLowerCase() === findQuery.trim().toLowerCase()) {
      editor.chain().focus().insertContentAt({ from, to }, replaceText).run();
      findNext(editor.state.selection.to);
    } else {
      if (findNext()) replaceCurrent();
    }
  };

  const replaceAll = () => {
    if (!editor || !findQuery.trim()) return;
    let count = 0;
    let found = findNext(0);
    while (found) {
      const { from, to } = editor.state.selection;
      editor.chain().focus().insertContentAt({ from, to }, replaceText).run();
      count++;
      found = findNext(editor.state.selection.to);
    }
    alert(`已替换 ${count} 处`);
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.ctrlKey && key === '/') {
        e.preventDefault();
        setSlashVisible(v => !v);
        setSlashFilter('');
        setSlashIndex(0);
      } else if (slashVisible) {
        if (key === 'escape') { setSlashVisible(false); }
        else if (key === 'arrowdown') { setSlashIndex(i => i + 1); }
        else if (key === 'arrowup') { setSlashIndex(i => Math.max(0, i - 1)); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slashVisible]);

  // 辅助：将 YouTube/Vimeo 等 URL 转换为可嵌入的 src
  const getEmbedUrl = (url: string) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com')) {
        const id = u.searchParams.get('v');
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      if (u.hostname === 'youtu.be') {
        const id = u.pathname.slice(1);
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      return url; // 其它直接返回
    } catch {
      return url;
    }
  };

  const slashItems = [
    // 标题与列表
    { key: 'h1', label: '一级标题', run: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
    { key: 'h2', label: '二级标题', run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { key: 'h3', label: '三级标题', run: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
    { key: 'bullet', label: '无序列表', run: () => editor?.chain().focus().toggleBulletList().run() },
    { key: 'ordered', label: '有序列表', run: () => editor?.chain().focus().toggleOrderedList().run() },
    { key: 'task', label: '任务列表', run: () => editor?.chain().focus().toggleTaskList().run() },
    { key: 'quote', label: '引用', run: () => editor?.chain().focus().toggleBlockquote().run() },
    { key: 'code', label: '代码块', run: () => editor?.chain().focus().toggleCodeBlock().run() },
    { key: 'hr', label: '分割线', run: () => editor?.chain().focus().setHorizontalRule().run() },
    { key: 'table', label: '插入表格…', run: () => {
      const rowsStr = window.prompt('表格行数', '3') || '3';
      const colsStr = window.prompt('表格列数', '3') || '3';
      const rows = Math.max(1, parseInt(rowsStr, 10) || 3);
      const cols = Math.max(1, parseInt(colsStr, 10) || 3);
      editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    } },
    { key: 'addRow', label: '表格：插入行', run: () => editor?.chain().focus().addRowAfter().run() },
    { key: 'addCol', label: '表格：插入列', run: () => editor?.chain().focus().addColumnAfter().run() },
    { key: 'delTable', label: '表格：删除表格', run: () => editor?.chain().focus().deleteTable().run() },

    // 文本样式与对齐
    { key: 'bold', label: '加粗', run: () => editor?.chain().focus().toggleBold().run() },
    { key: 'italic', label: '斜体', run: () => editor?.chain().focus().toggleItalic().run() },
    { key: 'underline', label: '下划线', run: () => editor?.chain().focus().toggleUnderline().run() },
    { key: 'strike', label: '删除线', run: () => editor?.chain().focus().toggleStrike().run() },
    { key: 'alignLeft', label: '左对齐', run: () => editor?.chain().focus().setTextAlign('left').run() },
    { key: 'alignCenter', label: '居中对齐', run: () => editor?.chain().focus().setTextAlign('center').run() },
    { key: 'alignRight', label: '右对齐', run: () => editor?.chain().focus().setTextAlign('right').run() },

    // 颜色与高亮（示例预设）
    { key: 'colorRed', label: '文字颜色：红', run: () => editor?.chain().focus().setColor('#e11d48').run() },
    { key: 'colorBlue', label: '文字颜色：蓝', run: () => editor?.chain().focus().setColor('#2563eb').run() },
    { key: 'unsetColor', label: '取消文字颜色', run: () => editor?.chain().focus().unsetColor().run() },
    { key: 'hlYellow', label: '高亮：黄', run: () => editor?.chain().focus().setHighlight({ color: '#fff59d' }).run() },
    { key: 'hlBlue', label: '高亮：蓝', run: () => editor?.chain().focus().setHighlight({ color: '#bbdefb' }).run() },
    { key: 'unsetHighlight', label: '取消高亮', run: () => editor?.chain().focus().unsetHighlight().run() },

    // 字体家族（示例）
    { key: 'fontGeorgia', label: '字体：Georgia', run: () => editor?.chain().focus().setFontFamily('Georgia, serif').run() },
    { key: 'fontMono', label: '字体：等宽', run: () => editor?.chain().focus().setFontFamily('ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace').run() },
    { key: 'fontReset', label: '字体：重置', run: () => editor?.chain().focus().unsetFontFamily?.().run?.() },

    // 链接/图片/视频
    { key: 'link', label: '插入链接…', run: () => {
      const url = window.prompt('链接地址', 'https://') || '';
      if (url.trim() === '') {
        editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      } else {
        editor?.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
      }
    } },
    { key: 'image', label: '插入图片…', run: () => {
      const url = window.prompt('图片 URL', 'https://') || '';
      if (!url.trim()) return;
      editor?.chain().focus().insertContent({ type: 'image', attrs: { src: url.trim() } }).run();
    } },
    { key: 'video', label: '插入视频…', run: () => {
      const url = window.prompt('YouTube/Vimeo URL', '') || '';
      if (!url.trim()) return;
      const embed = getEmbedUrl(url.trim());
      editor?.chain().focus().insertContent({ type: 'iframe', attrs: { src: embed } }).run();
    } },

    // 数学公式（兼容两种扩展）
    { key: 'mathInline', label: '行内公式…', run: () => {
      const latex = window.prompt('输入 LaTeX（行内）', 'c = \\sqrt{a^2 + b^2}') || '';
      if (!latex.trim()) return;
      editor?.chain().focus().insertContent({ type: 'inlineMath', attrs: { latex: latex.trim(), evaluate: 'no', display: 'no' } }).run();
    } },
    { key: 'mathBlock', label: '块级公式…', run: () => {
      const latex = window.prompt('输入 LaTeX（块级）', 'E = mc^2') || '';
      if (!latex.trim()) return;
      const ok = editor?.chain().focus().insertContent({ type: 'math', content: [{ type: 'text', text: latex.trim() }] }).run();
      if (!ok) {
        editor?.chain().focus().insertContent({ type: 'inlineMath', attrs: { latex: latex.trim(), evaluate: 'no', display: 'yes' } }).run();
      }
    } },
  ];
  const filteredSlash = slashFilter
    ? slashItems.filter(i => i.label.includes(slashFilter))
    : slashItems;
  const applySlash = (idx: number) => {
    const item = filteredSlash[idx];
    if (!item) return;
    item.run();
    setSlashVisible(false);
  };

  return (
    <div className="editor">
      <TiptapToolbar editor={editor} currentFilePath={currentFilePath} setFilePath={setFilePath} onOpen={onOpen} onSave={onSave} onSaveAs={onSaveAs} onToggleColorScheme={onToggleColorScheme} colorScheme={colorScheme} />
      {/* (M3.B) 链接浮动菜单：选中链接时显示，支持编辑与取消 */}
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100, placement: 'top' }}
          shouldShow={({ editor }) => editor.isActive('link')}
          className="bubble-menu-container"
        >
          <span className="link-url">
            {editor.getAttributes('link').href?.slice(0, 40) || ''}
          </span>
          {!editingLink && (
            <button
              onClick={() => {
                const currentUrl = editor.getAttributes('link').href || '';
                setLinkValue(currentUrl);
                setEditingLink(true);
              }}
              title="编辑链接"
              aria-label="编辑链接"
            >编辑</button>
          )}
          {editingLink && (
            <>
              <input
                className="bubble-menu-input"
                type="text"
                placeholder="输入链接地址"
                value={linkValue}
                onChange={e => setLinkValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const v = linkValue.trim();
                    if (v) editor.chain().focus().setLink({ href: v }).run();
                    setEditingLink(false);
                  } else if (e.key === 'Escape') {
                    setEditingLink(false);
                  }
                }}
                autoFocus
              />
              <button
                onClick={() => {
                  const v = linkValue.trim();
                  if (v) editor.chain().focus().setLink({ href: v }).run();
                  setEditingLink(false);
                }}
              >应用</button>
              <button onClick={() => setEditingLink(false)}>取消</button>
            </>
          )}
          <button
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="取消链接"
            aria-label="取消链接"
          >取消</button>
        </BubbleMenu>
      )}
      {/* (M3.D) 表格浮动菜单：当光标在 tableCell / tableHeader 内时显示 */}
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100, placement: 'bottom' }}
          shouldShow={({ editor }) => editor.isActive('tableCell') || editor.isActive('tableHeader')}
          className="table-bubble-menu-container"
        >
          <button onClick={() => editor.chain().focus().addColumnAfter().run()}>插入列 (→)</button>
          <button onClick={() => editor.chain().focus().addRowAfter().run()}>插入行 (↓)</button>
          <button onClick={() => editor.chain().focus().deleteColumn().run()}>删除列</button>
          <button onClick={() => editor.chain().focus().deleteRow().run()}>删除行</button>
          <button onClick={() => editor.chain().focus().deleteTable().run()} className="danger-button">删除表格</button>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
      {/* 查找/替换浮动面板 */}
      {findVisible && (
        <div className="floating-panel">
          <div className="floating-panel-row">
            <input
              className="floating-input"
              type="text"
              placeholder="查找内容"
              value={findQuery}
              onChange={e => setFindQuery((e.target as HTMLInputElement).value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) findNext();
                else if (e.key === 'Enter' && e.shiftKey) findPrev();
                else if (e.key === 'Escape') setFindVisible(false);
              }}
              autoFocus
            />
            <button onClick={() => findPrev()}>上一个</button>
            <button onClick={() => findNext()}>下一个</button>
            <button onClick={() => { setFindVisible(false); setReplaceMode(false); }}>关闭</button>
          </div>
          {replaceMode && (
            <div className="floating-panel-row">
              <input
                className="floating-input"
                type="text"
                placeholder="替换为"
                value={replaceText}
                onChange={e => setReplaceText((e.target as HTMLInputElement).value)}
              />
              <button onClick={() => replaceCurrent()}>替换</button>
              <button onClick={() => replaceAll()}>全部替换</button>
            </div>
          )}
        </div>
      )}

      {/* Slash 命令浮动面板（Ctrl+/ 打开） */}
      {slashVisible && (
        <div className="floating-panel slash-panel">
          <input
            className="floating-input"
            type="text"
            placeholder="输入命令关键字…"
            value={slashFilter}
            onChange={e => { setSlashFilter((e.target as HTMLInputElement).value); setSlashIndex(0); }}
            onKeyDown={e => {
              if (e.key === 'Enter') applySlash(slashIndex);
              else if (e.key === 'Escape') setSlashVisible(false);
            }}
            autoFocus
          />
          <div className="slash-list">
            {filteredSlash.map((item, i) => (
              <button key={item.key} onClick={() => applySlash(i)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};