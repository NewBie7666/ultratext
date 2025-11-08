import React from 'react';
// Avoid named type import to bypass local bundler resolution issues
type TiptapEditor = import('@tiptap/core').Editor;
import './TiptapToolbar.css';
import { ScrollArea, Group, ActionIcon, Button, Divider, Tooltip, ColorInput, Select } from '@mantine/core';
import { FaBold, FaItalic, FaStrikethrough, FaUnderline, FaListUl, FaListOl, FaQuoteLeft, FaAlignLeft, FaAlignCenter, FaAlignRight, FaCode, FaTable, FaImage, FaLink, FaTasks, FaMinus, FaFont, FaTint, FaPaste, FaYoutube, FaEquals, FaCalculator, FaFolderOpen, FaSave, FaMoon, FaSun } from 'react-icons/fa';

type Props = {
  editor: TiptapEditor | null;
  currentFilePath?: string | null;
  setFilePath: (path: string | null) => void;
  onOpen?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onToggleColorScheme?: () => void;
  colorScheme?: 'light' | 'dark';
};

export const TiptapToolbar: React.FC<Props> = ({ editor, currentFilePath, setFilePath, onOpen, onSave, onSaveAs, onToggleColorScheme, colorScheme }) => {
  if (!editor) return null;
  const hasCodeBlock = !!editor.schema.nodes.codeBlock;
  const hasElectronApi = typeof window !== 'undefined' && !!(window as any).api;

  // 统一尺寸（参考 M7.5修复2.md）：所有 Mantine 组件统一一个 size
  const TOOLBAR_SIZE: 'sm' = 'sm';
  const ICON_SIZE = 18; // 图标视觉大小

  // 插入图片：本地文件 + URL 输入
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const [urlValue, setUrlValue] = React.useState('');
  // 链接输入
  const [showLinkInput, setShowLinkInput] = React.useState(false);
  const [linkValue, setLinkValue] = React.useState('');
  // 表格尺寸面板
  const [showTablePanel, setShowTablePanel] = React.useState(false);
  const [tableRows, setTableRows] = React.useState<number>(3);
  const [tableCols, setTableCols] = React.useState<number>(3);
  // 视频 URL 输入
  const [showVideoInput, setShowVideoInput] = React.useState(false);
  const [videoUrl, setVideoUrl] = React.useState('');
  // 数学公式输入（行内/块级）
  const [showInlineMathInput, setShowInlineMathInput] = React.useState(false);
  const [inlineMathValue, setInlineMathValue] = React.useState('c = \\sqrt{a^2 + b^2}');
  const [showBlockMathInput, setShowBlockMathInput] = React.useState(false);
  const [blockMathValue, setBlockMathValue] = React.useState('E = mc^2');

  // 统一收起临时面板/输入框
  const resetTransientUi = () => {
    setShowUrlInput(false);
    setShowLinkInput(false);
    setShowTablePanel(false);
    setShowVideoInput(false);
    setShowInlineMathInput(false);
    setShowBlockMathInput(false);
  };
  const handleInsertImageClick = () => {
    resetTransientUi();
    fileInputRef.current?.click();
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !/image/i.test(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      editor.chain().focus().setImage({ src }).run();
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };
  const openUrlInput = () => setShowUrlInput(true);
  const confirmUrlInsert = () => {
    const url = urlValue.trim();
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
    setUrlValue('');
    setShowUrlInput(false);
  };
  const onUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      confirmUrlInsert();
    } else if (e.key === 'Escape') {
      setShowUrlInput(false);
      setUrlValue('');
    }
  };

  // 移除：在表格前后插入段落功能

  // (M3.A) 强化表格插入：弹窗询问行列数
  const insertTablePrompt = () => {
    // 改为显示内联面板
    setShowUrlInput(false);
    setShowLinkInput(false);
    setShowTablePanel(prev => !prev);
  };
  const confirmTableInsert = () => {
    const rows = Math.max(1, Math.floor(tableRows || 0));
    const cols = Math.max(1, Math.floor(tableCols || 0));
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setShowTablePanel(false);
  };
  const onTableKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      confirmTableInsert();
    } else if (e.key === 'Escape') {
      setShowTablePanel(false);
    }
  };

  // (M3.A) 链接设置：内联输入，留空取消
  const openLinkInput = () => {
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkValue(previousUrl);
    setShowUrlInput(false);
    setShowTablePanel(false);
    setShowLinkInput(prev => !prev);
  };
  const confirmLinkSet = () => {
    const url = linkValue.trim();
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setShowLinkInput(false);
  };
  const onLinkKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      confirmLinkSet();
    } else if (e.key === 'Escape') {
      setShowLinkInput(false);
    }
  };

  // (M4.B) YouTube/Youtube 短链接转嵌入 URL
  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com')) {
        const vid = u.searchParams.get('v');
        if (vid) return `https://www.youtube.com/embed/${vid}`;
      }
      if (u.hostname === 'youtu.be') {
        const vid = u.pathname.slice(1);
        if (vid) return `https://www.youtube.com/embed/${vid}`;
      }
      return url;
    } catch {
      return url;
    }
  };
  const confirmVideoInsert = () => {
    const raw = videoUrl.trim();
    if (!raw) return;
    const embed = getYouTubeEmbedUrl(raw);
    // 使用通用插入 API，避免链式命令类型报错
    editor.chain().focus().insertContent({ type: 'iframe', attrs: { src: embed } }).run();
    setVideoUrl('');
    setShowVideoInput(false);
  };
  const onVideoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      confirmVideoInsert();
    } else if (e.key === 'Escape') {
      setShowVideoInput(false);
      setVideoUrl('');
    }
  };

  // (M4.C) 数学公式插入
  const confirmInlineMathInsert = () => {
    const latex = inlineMathValue.trim();
    if (!latex) return;
    editor
      .chain()
      .focus()
      .insertContent({ type: 'inlineMath', attrs: { latex, evaluate: 'no', display: 'no' } })
      .run();
    setShowInlineMathInput(false);
  };
  const onInlineMathKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      confirmInlineMathInsert();
    } else if (e.key === 'Escape') {
      setShowInlineMathInput(false);
    }
  };
  const confirmBlockMathInsert = () => {
    const latex = blockMathValue.trim();
    if (!latex) return;
    // 优先使用 block 节点（tiptap-math 的 "math"）
    const inserted = editor
      .chain()
      .focus()
      .insertContent({ type: 'math', content: [{ type: 'text', text: latex }] })
      .run();
    if (!inserted) {
      // 兼容：如果无 block math 扩展，则降级为 inlineMath 的块模式
      editor
        .chain()
        .focus()
        .insertContent({ type: 'inlineMath', attrs: { latex, evaluate: 'no', display: 'yes' } })
        .run();
    }
    setShowBlockMathInput(false);
  };
  const onBlockMathKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      confirmBlockMathInsert();
    } else if (e.key === 'Escape') {
      setShowBlockMathInput(false);
    }
  };

  // (M5) 文件打开/保存
  const handleOpenFile = async () => {
    if (!hasElectronApi || typeof window.api.openFile !== 'function') {
      alert('当前为浏览器预览模式，文件功能需在 Electron 中使用（请运行 npm run dev 或使用安装包运行）。');
      return;
    }
    try {
      const resp = await window.api.openFile();
      if (!resp || resp.canceled) return;
      if (resp.error) {
        alert(`打开失败: ${resp.error}`);
        return;
      }
      const content = resp.content || '';
      let json;
      try {
        json = JSON.parse(content);
      } catch (e) {
        alert('文件内容不是有效的 Tiptap JSON 格式');
        return;
      }
      // 使用非链式 API 设置内容，避免 setContent 在链式命令中不生效
      editor.commands.setContent(json, false);
      editor.commands.focus();
      setFilePath(resp.filePath || null);
    } catch (err) {
      alert(`打开错误: ${String(err)}`);
    }
  };

  const handleSaveFile = async () => {
    if (!hasElectronApi || typeof window.api.saveFile !== 'function') {
      alert('当前为浏览器预览模式，文件功能需在 Electron 中使用（请运行 npm run dev 或使用安装包运行）。');
      return;
    }
    try {
      const json = editor.getJSON();
      const resp = await window.api.saveFile({
        suggestedPath: currentFilePath ?? null,
        content: JSON.stringify(json, null, 2),
      });
      if (!resp || resp.canceled) return;
      if (resp.error) {
        alert(`保存失败: ${resp.error}`);
        return;
      }
      if (resp.filePath) setFilePath(resp.filePath);
    } catch (err) {
      alert(`保存错误: ${String(err)}`);
    }
  };

  // Fallback：另存为（如果未提供外部回调），直接让主进程弹窗
  const handleSaveFileAsFallback = async () => {
    if (!hasElectronApi || typeof window.api.saveFile !== 'function') {
      alert('当前为浏览器预览模式，文件功能需在 Electron 中使用（请运行 npm run dev 或使用安装包运行）。');
      return;
    }
    try {
      const json = editor.getJSON();
      const resp = await window.api.saveFile({ suggestedPath: null, content: JSON.stringify(json, null, 2), preferredFormat: 'json' });
      if (!resp || resp.canceled) return;
      if (resp.error) { alert(`保存失败: ${resp.error}`); return; }
      if (resp.filePath) setFilePath(resp.filePath);
    } catch (err) {
      alert(`保存错误: ${String(err)}`);
    }
  };

  return (
    <div className="toolbar-container">
      <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
      <ScrollArea type="auto" offsetScrollbars w="100%">
        <Group wrap="nowrap" gap="xs" align="center" p="xs">
          {/* (M5) 打开/保存 */}
          <Button.Group>
            <Tooltip label="打开文件" withArrow>
              <Button size={TOOLBAR_SIZE} variant="default" onClick={() => { resetTransientUi(); onOpen ? onOpen() : handleOpenFile(); }} disabled={!hasElectronApi} leftSection={<FaFolderOpen size={ICON_SIZE} />}>
                打开
              </Button>
            </Tooltip>
            <Tooltip label="保存文件" withArrow>
              <Button size={TOOLBAR_SIZE} variant="default" onClick={() => { resetTransientUi(); onSave ? onSave() : handleSaveFile(); }} disabled={!hasElectronApi} leftSection={<FaSave size={ICON_SIZE} />}>
                保存
              </Button>
            </Tooltip>
            <Tooltip label="另存为" withArrow>
              <Button size={TOOLBAR_SIZE} variant="default" onClick={() => { resetTransientUi(); onSaveAs ? onSaveAs() : handleSaveFileAsFallback(); }} disabled={!hasElectronApi} leftSection={<FaSave size={ICON_SIZE} />}>
                另存为
              </Button>
            </Tooltip>
          </Button.Group>

          <Divider orientation="vertical" mx="xs" />

          <ActionIcon.Group>
            <Tooltip label="加粗" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant={editor.isActive('bold') ? 'filled' : 'default'} onClick={() => { resetTransientUi(); editor.chain().focus().toggleBold().run(); }} aria-label="加粗">
                <FaBold size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="斜体" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant={editor.isActive('italic') ? 'filled' : 'default'} onClick={() => { resetTransientUi(); editor.chain().focus().toggleItalic().run(); }} aria-label="斜体">
                <FaItalic size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="下划线" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant={editor.isActive('underline') ? 'filled' : 'default'} onClick={() => { resetTransientUi(); editor.chain().focus().toggleUnderline().run(); }} aria-label="下划线">
                <FaUnderline size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="删除线" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant={editor.isActive('strike') ? 'filled' : 'default'} onClick={() => { resetTransientUi(); editor.chain().focus().toggleStrike().run(); }} aria-label="删除线">
                <FaStrikethrough size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>

          <Divider orientation="vertical" mx="xs" />

          <ActionIcon.Group>
            <Tooltip label="左对齐" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant={editor.isActive({ textAlign: 'left' }) ? 'filled' : 'default'} onClick={() => { resetTransientUi(); editor.chain().focus().setTextAlign('left').run(); }} aria-label="左对齐">
                <FaAlignLeft size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="居中对齐" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant={editor.isActive({ textAlign: 'center' }) ? 'filled' : 'default'} onClick={() => { resetTransientUi(); editor.chain().focus().setTextAlign('center').run(); }} aria-label="居中对齐">
                <FaAlignCenter size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="右对齐" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant={editor.isActive({ textAlign: 'right' }) ? 'filled' : 'default'} onClick={() => { resetTransientUi(); editor.chain().focus().setTextAlign('right').run(); }} aria-label="右对齐">
                <FaAlignRight size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>

          <Divider orientation="vertical" mx="xs" />

          <ActionIcon.Group>
            <Tooltip label="无序列表" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant={editor.isActive('bulletList') ? 'filled' : 'default'} onClick={() => { resetTransientUi(); editor.chain().focus().toggleBulletList().run(); }} aria-label="无序列表">
                <FaListUl size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="有序列表" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant={editor.isActive('orderedList') ? 'filled' : 'default'} onClick={() => { resetTransientUi(); editor.chain().focus().toggleOrderedList().run(); }} aria-label="有序列表">
                <FaListOl size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="引用" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant={editor.isActive('blockquote') ? 'filled' : 'default'} onClick={() => { resetTransientUi(); editor.chain().focus().toggleBlockquote().run(); }} aria-label="引用">
                <FaQuoteLeft size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>

          {hasCodeBlock && (
            <ActionIcon.Group>
              <Tooltip label="代码块" withArrow>
                <ActionIcon size={TOOLBAR_SIZE} variant={editor.isActive('codeBlock') ? 'filled' : 'default'} onClick={() => { resetTransientUi(); editor.chain().focus().toggleCodeBlock().run(); }} aria-label="代码块">
                  <FaCode size={ICON_SIZE} />
                </ActionIcon>
              </Tooltip>
            </ActionIcon.Group>
          )}

          <Divider orientation="vertical" mx="xs" />

          {/* 插入表格 */}
          <ActionIcon.Group>
            <Tooltip label="插入表格" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant="default" onClick={insertTablePrompt} aria-label="插入表格">
                <FaTable size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>
          {showTablePanel && (
            <div className="toolbar-panel" role="group" aria-label="表格尺寸">
              <span>行</span>
              <input
                type="number"
                min={1}
                className="toolbar-number-input"
                value={tableRows}
                onChange={e => setTableRows(parseInt(e.target.value || '1', 10))}
                onKeyDown={onTableKeyDown}
                autoFocus
              />
              <span>列</span>
              <input
                type="number"
                min={1}
                className="toolbar-number-input"
                value={tableCols}
                onChange={e => setTableCols(parseInt(e.target.value || '1', 10))}
                onKeyDown={onTableKeyDown}
              />
              <Button size={TOOLBAR_SIZE} variant="default" onClick={confirmTableInsert} title="插入">插入</Button>
              <Button size={TOOLBAR_SIZE} variant="default" onClick={() => setShowTablePanel(false)} title="取消">取消</Button>
            </div>
          )}

          {/* 插入本地图片 */}
          <ActionIcon.Group>
            <Tooltip label="插入本地图片" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant="default" onClick={handleInsertImageClick} aria-label="插入本地图片">
                <FaImage size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>

          {/* 通过 URL 插入图片 */}
          <ActionIcon.Group>
            <Tooltip label="通过 URL 插入图片" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant="default" onClick={() => { setShowLinkInput(false); setShowTablePanel(false); setShowUrlInput(prev => !prev); }} aria-label="通过 URL 插入图片">
                <FaPaste size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>
          {showUrlInput && (
            <input
              className="toolbar-url-input"
              type="text"
              placeholder="粘贴图片 URL 后按 Enter"
              value={urlValue}
              onChange={e => setUrlValue(e.target.value)}
              onKeyDown={onUrlKeyDown}
              autoFocus
            />
          )}

          {/* 插入视频 (YouTube/Vimeo) */}
          <ActionIcon.Group>
            <Tooltip label="插入视频" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant="default" onClick={() => { setShowUrlInput(false); setShowLinkInput(false); setShowTablePanel(false); setShowInlineMathInput(false); setShowBlockMathInput(false); setShowVideoInput(prev => !prev); }} aria-label="插入视频">
                <FaYoutube size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>
          {showVideoInput && (
            <input
              className="toolbar-url-input"
              type="text"
              placeholder="粘贴视频 URL 后按 Enter"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              onKeyDown={onVideoKeyDown}
              autoFocus
            />
          )}

          <Divider orientation="vertical" mx="xs" />

          {/* (M3.A) 链接按钮 */}
          <ActionIcon.Group>
            <Tooltip label="设置链接" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant={editor.isActive('link') ? 'filled' : 'default'} onClick={openLinkInput} aria-label="设置链接">
                <FaLink size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>
          {showLinkInput && (
            <input
              className="toolbar-url-input"
              type="text"
              placeholder="输入链接地址，Enter 确认 / Esc 取消"
              value={linkValue}
              onChange={e => setLinkValue(e.target.value)}
              onKeyDown={onLinkKeyDown}
              autoFocus
            />
          )}

          {/* 数学公式：行内 ($) */}
          <ActionIcon.Group>
            <Tooltip label="行内公式" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant="default" onClick={() => { setShowUrlInput(false); setShowLinkInput(false); setShowTablePanel(false); setShowVideoInput(false); setShowBlockMathInput(false); setShowInlineMathInput(prev => !prev); }} aria-label="行内公式">
                <FaEquals size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>
          {showInlineMathInput && (
            <input
              className="toolbar-url-input"
              type="text"
              placeholder="输入 LaTeX（行内），Enter 确认 / Esc 取消"
              value={inlineMathValue}
              onChange={e => setInlineMathValue(e.target.value)}
              onKeyDown={onInlineMathKeyDown}
              autoFocus
            />
          )}

          {/* 数学公式：块级 ($$) */}
          <ActionIcon.Group>
            <Tooltip label="块级公式" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant="default" onClick={() => { setShowUrlInput(false); setShowLinkInput(false); setShowTablePanel(false); setShowVideoInput(false); setShowInlineMathInput(false); setShowBlockMathInput(prev => !prev); }} aria-label="块级公式">
                <FaCalculator size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>
          {showBlockMathInput && (
            <input
              className="toolbar-url-input"
              type="text"
              placeholder="输入 LaTeX（块级），Enter 确认 / Esc 取消"
              value={blockMathValue}
              onChange={e => setBlockMathValue(e.target.value)}
              onKeyDown={onBlockMathKeyDown}
              autoFocus
            />
          )}

          {/* (M3.A) 任务列表 / 分割线 */}
          <ActionIcon.Group>
            <Tooltip label="任务列表" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant={editor.isActive('taskList') ? 'filled' : 'default'} onClick={() => { resetTransientUi(); editor.chain().focus().toggleTaskList().run(); }} aria-label="任务列表">
                <FaTasks size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="插入分割线" withArrow>
              <ActionIcon size={TOOLBAR_SIZE} variant="default" onClick={() => { resetTransientUi(); editor.chain().focus().setHorizontalRule().run(); }} aria-label="插入分割线">
                <FaMinus size={ICON_SIZE} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>

          <Divider orientation="vertical" mx="xs" />

          {/* (M3.C) 字体颜色 */}
          <Group gap="xs" align="center" wrap="nowrap">
            <ActionIcon size={TOOLBAR_SIZE} variant="default" aria-label="字体颜色">
              <FaFont size={ICON_SIZE} />
            </ActionIcon>
            <ColorInput
              size={TOOLBAR_SIZE}
              withPreview
              format="hex"
              w={120}
              popoverProps={{ withinPortal: true, zIndex: 1100, position: 'bottom-start', closeOnClickOutside: false, trapFocus: false }}
              value={editor.getAttributes('textStyle').color || '#000000'}
              onMouseDownCapture={() => { /* 记录当前选区，供拖动过程中使用 */
                const sel = editor.state.selection; (editor as any)._lastColorSelection = { from: sel.from, to: sel.to };
              }}
              onChange={(color) => {
                // 避免每次 onChange 抢夺焦点，保持拖动顺畅
                const last = (editor as any)._lastColorSelection;
                if (last && typeof last.from === 'number' && typeof last.to === 'number') {
                  editor.chain().setTextSelection(last).setColor(color).run();
                } else {
                  editor.chain().setColor(color).run();
                }
              }}
            />
            <Button size={TOOLBAR_SIZE} variant="default" onClick={() => {
              const last = (editor as any)._lastColorSelection;
              if (last && typeof last.from === 'number' && typeof last.to === 'number') {
                editor.chain().setTextSelection(last).unsetColor().run();
              } else {
                editor.chain().focus().unsetColor().run();
              }
            }}>清除</Button>
          </Group>

          {/* (M3.C) 高亮颜色 */}
          <Group gap="xs" align="center" wrap="nowrap">
            <ActionIcon size={TOOLBAR_SIZE} variant="default" aria-label="高亮颜色">
              <FaTint size={ICON_SIZE} />
            </ActionIcon>
            <ColorInput
              size={TOOLBAR_SIZE}
              withPreview
              format="hex"
              w={120}
              popoverProps={{ withinPortal: true, zIndex: 1100, position: 'bottom-start', closeOnClickOutside: false, trapFocus: false }}
              onMouseDownCapture={() => {
                const sel = editor.state.selection; (editor as any)._lastHighlightSelection = { from: sel.from, to: sel.to };
              }}
              onChange={(color) => {
                const last = (editor as any)._lastHighlightSelection;
                if (last && typeof last.from === 'number' && typeof last.to === 'number') {
                  editor.chain().setTextSelection(last).setHighlight({ color }).run();
                } else {
                  editor.chain().setHighlight({ color }).run();
                }
              }}
            />
            <Button
              size={TOOLBAR_SIZE}
              variant="default"
              onClick={() => {
                const last = (editor as any)._lastHighlightSelection;
                if (last && typeof last.from === 'number' && typeof last.to === 'number') {
                  editor.chain().setTextSelection(last).unsetHighlight().run();
                } else {
                  editor.chain().focus().unsetHighlight().run();
                }
              }}
            >清除背景</Button>
          </Group>

          {/* (M3.C) 字体族 */}
          <Select
            size={TOOLBAR_SIZE}
            w={180}
            comboboxProps={{ withinPortal: true, zIndex: 1000, position: 'bottom-start' }}
            classNames={{ dropdown: 'toolbar-select-dropdown' }}
            placeholder="字体族"
            value={editor.getAttributes('fontFamily')?.fontFamily || ''}
            onChange={(v) => {
              resetTransientUi();
              const val = v || '';
              if (!val) {
                editor.chain().focus().unsetFontFamily().run();
              } else {
                editor.chain().focus().setFontFamily(val).run();
              }
            }}
            data={[
              { value: '', label: '默认' },
              { value: 'Inter', label: 'Inter' },
              { value: 'system-ui', label: 'system-ui' },
              { value: 'serif', label: 'serif' },
              { value: 'monospace', label: 'monospace' },
              { value: 'Arial', label: 'Arial' },
              { value: 'Times New Roman', label: 'Times New Roman' },
            ]}
          />

          {/* 暗色模式切换 */}
          <Divider orientation="vertical" mx={4} />
          <Tooltip label={colorScheme === 'dark' ? '切换到亮色' : '切换到暗色'} withArrow position="bottom">
            <ActionIcon
              size={TOOLBAR_SIZE}
              variant="default"
              aria-label="切换暗色模式"
              onClick={() => {
                resetTransientUi();
                if (typeof onToggleColorScheme === 'function') onToggleColorScheme();
              }}
            >
              {colorScheme === 'dark' ? <FaSun size={ICON_SIZE} /> : <FaMoon size={ICON_SIZE} />}
            </ActionIcon>
          </Tooltip>
        </Group>
      </ScrollArea>
    </div>
  );
};