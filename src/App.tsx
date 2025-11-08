import React from 'react';
import { useEditor } from '@tiptap/react';
// Avoid named type import to bypass local bundler resolution issues
type TiptapEditor = import('@tiptap/core').Editor;
import type { EditorView } from 'prosemirror-view';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { CustomImage } from './extensions/CustomImageExtension';
import Iframe from 'tiptap-extension-iframe';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Placeholder from '@tiptap/extension-placeholder';
import Mathematics from 'tiptap-math';
import { MathExtension } from '@aarkue/tiptap-math-extension';
import { TiptapEditor as EditorViewComponent } from './components/TiptapEditor';
import './style.css';
import { MantineProvider } from '@mantine/core';
import { HelpModal } from './components/HelpModal';
import { marked } from 'marked';

// 配置 marked：开启 GFM 与换行保留
marked.setOptions({
  gfm: true,
  breaks: true,
});

type FileFormat = 'json' | 'md' | 'txt';

function App() {
  const [currentFilePath, setCurrentFilePath] = React.useState<string | null>(null);
  const [currentFormat, setCurrentFormat] = React.useState<FileFormat>('json');
  const [isDirty, setIsDirty] = React.useState<boolean>(false);
  const [openFind, setOpenFind] = React.useState<boolean>(false);
  const [openReplace, setOpenReplace] = React.useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = React.useState<boolean>(false);
  const [colorScheme, setColorScheme] = React.useState<'light' | 'dark'>(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('ultratext-color-scheme') : null;
      if (saved === 'light' || saved === 'dark') return saved as 'light' | 'dark';
    } catch {}
    return 'light';
  });
  const toggleColorScheme = React.useCallback(() => {
    setColorScheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  React.useEffect(() => {
    try { window.localStorage.setItem('ultratext-color-scheme', colorScheme); } catch {}
  }, [colorScheme]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '在此输入…',
        showOnlyWhenEditable: true,
        emptyEditorClass: 'is-editor-empty',
        emptyNodeClass: 'is-empty',
        includeChildren: true,
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      TextStyle,
      Color,
      FontFamily,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CustomImage,
      Iframe,
      Mathematics,
      MathExtension.configure({ addInlineMath: true, evaluation: false }),
    ],
    // 启动时不注入任何默认文字，保持空白
    content: '',
    autofocus: 'end',
    onUpdate: () => setIsDirty(true),
    editorProps: {
      handleDOMEvents: {
        drop(view: EditorView, event: DragEvent) {
          event.preventDefault();
          const hasFiles = (event.dataTransfer?.files?.length || 0) > 0;
          if (!hasFiles) return false;
          const files = Array.from(event.dataTransfer!.files);
          const imageFiles = files.filter(file => /image/i.test(file.type));
          if (imageFiles.length === 0) return false;
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (!pos) return false;
          imageFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
              const src = reader.result as string;
              const { schema } = view.state;
              const node = schema.nodes.image.create({ src });
              const tr = view.state.tr.insert(pos.pos, node);
              view.dispatch(tr);
            };
            reader.readAsDataURL(file);
          });
          return true;
        },
      },
    },
  });

  React.useEffect(() => {
    const title = currentFilePath ? `UltraText - ${currentFilePath}` : 'UltraText';
    document.title = title;
  }, [currentFilePath]);

  const detectFormatFromPath = (filePath?: string | null): FileFormat => {
    const ext = (filePath || '').toLowerCase();
    if (ext.endsWith('.md') || ext.endsWith('.markdown')) return 'md';
    if (ext.endsWith('.txt')) return 'txt';
    return 'json';
  };

  const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const mdToHtml = (md: string) => marked.parse(md);

  const htmlToMdBasic = (html: string, fallbackText: string) => {
    // 极简：转换标题、换行，其它回退为纯文本
    let md = html
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n\n');
    // 移除其它标签（保留文本）
    md = md.replace(/<[^>]+>/g, '');
    md = md.trim();
    return md || fallbackText;
  };

  const handleOpenFile = async () => {
    const hasElectronApi = typeof window !== 'undefined' && !!(window as any).api;
    if (!hasElectronApi || typeof window.api.openFile !== 'function') {
      alert('当前为浏览器预览模式，文件功能需在 Electron 中使用（请运行 npm run dev 或使用安装包运行）。');
      return;
    }
    try {
      if (isDirty) {
        const proceed = confirm('当前文档尚未保存，确定要打开其他文件吗？未保存的修改将丢失。');
        if (!proceed) return;
      }
      const resp = await window.api.openFile();
      if (!resp || resp.canceled) return;
      if (resp.error) { alert(`打开失败: ${resp.error}`); return; }
      const raw = resp.content || '';
      const fmt = detectFormatFromPath(resp.filePath);
      let contentForEditor: any = raw;
      if (fmt === 'json') {
        try {
          contentForEditor = JSON.parse(raw);
        } catch {
          alert('JSON 文件格式不正确');
          return;
        }
      } else if (fmt === 'md') {
        contentForEditor = mdToHtml(raw);
      } else {
        // txt：按行转 <br>
        const safe = escapeHtml(raw);
        contentForEditor = `<p>${safe.replace(/\n/g, '<br>')}</p>`;
      }
      editor?.commands.setContent(contentForEditor, false);
      editor?.commands.focus();
      setCurrentFilePath(resp.filePath || null);
      setCurrentFormat(fmt);
      setIsDirty(false);
    } catch (err) {
      alert(`打开错误: ${String(err)}`);
    }
  };

  const getContentByFormat = (fmt: FileFormat): string => {
    if (!editor) return '';
    if (fmt === 'json') {
      return JSON.stringify(editor.getJSON(), null, 2);
    }
    if (fmt === 'md') {
      const html = editor.getHTML();
      const txt = editor.getText();
      return htmlToMdBasic(html, txt);
    }
    // txt
    return editor.getText();
  };

  const handleSaveFile = async () => {
    const hasElectronApi = typeof window !== 'undefined' && !!(window as any).api;
    if (!hasElectronApi || typeof window.api.saveFile !== 'function') {
      alert('当前为浏览器预览模式，文件功能需在 Electron 中使用（请运行 npm run dev 或使用安装包运行）。');
      return;
    }
    try {
      const fmt = currentFormat || detectFormatFromPath(currentFilePath);
      const content = getContentByFormat(fmt);
      const resp = await window.api.saveFile({
        suggestedPath: currentFilePath ?? null,
        content,
        preferredFormat: fmt,
      });
      if (!resp || resp.canceled) return;
      if (resp.error) { alert(`保存失败: ${resp.error}`); return; }
      setCurrentFilePath(resp.filePath || currentFilePath);
      setCurrentFormat(fmt);
      setIsDirty(false);
    } catch (err) {
      alert(`保存错误: ${String(err)}`);
    }
  };

  const handleSaveFileAs = async () => {
    const hasElectronApi = typeof window !== 'undefined' && !!(window as any).api;
    if (!hasElectronApi || typeof window.api.saveFile !== 'function') {
      alert('当前为浏览器预览模式，文件功能需在 Electron 中使用（请运行 npm run dev 或使用安装包运行）。');
      return;
    }
    try {
      const fmt = currentFormat || detectFormatFromPath(currentFilePath);
      const content = getContentByFormat(fmt);
      // 如果有 showSaveDialog，则先选路径；否则传 null 由主进程弹窗。
      let targetPath: string | null = null;
      if (typeof window.api.showSaveDialog === 'function') {
        const pick = await window.api.showSaveDialog(currentFilePath ?? undefined, fmt);
        if (pick?.canceled) return; if (pick?.error) { alert(`选择保存位置失败: ${pick.error}`); return; }
        targetPath = pick?.filePath ?? null;
      }
      const resp = await window.api.saveFile({ suggestedPath: targetPath, content, preferredFormat: fmt });
      if (!resp || resp.canceled) return;
      if (resp.error) { alert(`保存失败: ${resp.error}`); return; }
      setCurrentFilePath(resp.filePath || currentFilePath);
      setCurrentFormat(fmt);
      setIsDirty(false);
    } catch (err) {
      alert(`保存错误: ${String(err)}`);
    }
  };

  // 原生菜单事件：Open / Save / Save As / Find / Replace
  React.useEffect(() => {
    const has = typeof window !== 'undefined' && !!(window as any).api && typeof window.api.onMenuAction === 'function';
    if (!has) return;
    const off = window.api.onMenuAction((cmd) => {
      if (cmd === 'open') handleOpenFile();
      else if (cmd === 'save') handleSaveFile();
      else if (cmd === 'saveAs') handleSaveFileAs();
      else if (cmd === 'find') { setOpenFind(true); setOpenReplace(false); }
      else if (cmd === 'replace') { setOpenFind(true); setOpenReplace(true); }
      else if (cmd === 'show-help') { setIsHelpModalOpen(true); }
    });
    return () => { if (typeof off === 'function') off(); };
  }, [handleOpenFile, handleSaveFile, handleSaveFileAs]);

  // 浏览器预览或无原生菜单时：Ctrl+F / Ctrl+H 打开浮动面板；Ctrl+Shift+/? 打开帮助
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.ctrlKey && !e.shiftKey && key === 'f') {
        e.preventDefault(); setOpenFind(true); setOpenReplace(false);
      } else if (e.ctrlKey && !e.shiftKey && key === 'h') {
        e.preventDefault(); setOpenFind(true); setOpenReplace(true);
      } else if (e.ctrlKey && e.shiftKey && (e.key === '?' || key === '/')) {
        // 预览环境便捷打开帮助
        e.preventDefault(); setIsHelpModalOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // 未保存提示：关闭窗口时提示
  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  return (
    <MantineProvider defaultColorScheme="light" forceColorScheme={colorScheme} withCssVariables withGlobalStyles>
      <div className="app" data-color-scheme={colorScheme}>
        <EditorViewComponent
          editor={editor as TiptapEditor | null}
          currentFilePath={currentFilePath}
          setFilePath={setCurrentFilePath}
          onOpen={handleOpenFile}
          onSave={handleSaveFile}
          onSaveAs={handleSaveFileAs}
          openFind={openFind}
          openReplace={openReplace}
          onToggleColorScheme={toggleColorScheme}
          colorScheme={colorScheme}
        />
        {currentFilePath && (
          <div className="file-status-bar">
            {`当前文件：${currentFilePath}  格式：${currentFormat.toUpperCase()}${isDirty ? ' *' : ''}`}
          </div>
        )}
        <HelpModal opened={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
      </div>
    </MantineProvider>
  );
}

export default App;
