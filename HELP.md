# UltraText 帮助文档（含 M10 Windows 集成）

本帮助文档汇总项目主要功能与快捷键，并新增 M10 对 Windows Shell 的原生集成说明：文件关联、右键“新建 UltraText 文档”、安装与打包步骤。

## 概览
- 支持三种文件格式：`JSON`、`Markdown (MD)`、`Text (TXT)`。
- 富文本编辑器：加粗、斜体、下划线、删除线、标题、列表、引用、代码块。
- 颜色与字体：文字颜色、高亮背景、字体族选择。
- 媒体与链接：图片（本地/URL/拖拽）、视频（YouTube/Vimeo 等）、可编辑链接。
- 表格：插入表格、插入/删除行列、删除表格（浮动菜单）。
- 查找/替换：浮动面板，支持下一处/上一处、替换当前、批量替换。
- Slash 命令面板：通过 `Ctrl+/` 打开，快捷执行常用插入/格式化动作。
- 主题：亮色/暗色切换，自动记忆上次选择。

## 文件操作
- 打开文件：`Ctrl+O`
- 保存文件：`Ctrl+S`
- 另存为：`Ctrl+Shift+S`
- 支持格式与行为：
  - 打开时自动识别扩展名并转换为编辑器内容：`JSON`（结构）、`MD`（转换为 HTML）、`TXT`（按行转 `<br>`）。
  - 保存时根据当前文件格式输出内容：`JSON`（`getJSON()`）、`MD`（HTML 简转 Markdown）、`TXT`（纯文本）。
  - 拖拽本地图片到编辑器自动插入（支持多图）。
 - 启动时打开文件：在资源管理器双击 `.tiptap/.json/.md/.txt` 文件时，应用会读取文件并在编辑器中载入（M10）。
 - 空白启动：应用启动时不再注入默认文本，编辑器为空（占位提示“在此输入…”）。

## 查找 / 替换
- 打开查找：`Ctrl+F`
- 打开替换：`Ctrl+H`（在查找面板基础上开启替换输入）
- 面板内键位：
  - 定位下一处：在“查找内容”输入框按 `Enter`
  - 定位上一处：在“查找内容”输入框按 `Shift+Enter`
  - 关闭面板：`Esc`
- 替换：
  - 替换当前：点击“替换”或在“替换为”输入后回车
  - 全部替换：点击“全部替换”

## 编辑与格式化
（由 Tiptap `StarterKit` 与扩展提供，工具栏均有对应按钮）
- 加粗：`Ctrl+B`
- 斜体：`Ctrl+I`
- 下划线：`Ctrl+U`
- 删除线：`Ctrl+Shift+X`
- 标题：H1/H2/H3（工具栏与 Slash 命令支持）
- 引用：切换引用块
- 代码块：切换代码块
- 列表：无序列表、有序列表、任务列表（工具栏与 Slash 命令支持）
- 对齐：左对齐、居中、右对齐
- 分割线：插入水平分割线

## 颜色与字体
- 文字颜色：在颜色选择器中拖动即可对“当前选区”实时生效；支持“清除”恢复默认颜色。
- 高亮背景：选择高亮颜色；支持“清除背景”。
- 字体族：在“字体族”下拉框中选择或恢复“默认”。

## 链接与媒体
- 链接：选中文本后设置链接（可编辑、可取消，支持气泡菜单编辑）。
- 图片：
  - 本地图片：通过工具栏“插入本地图片”按钮选择文件。
  - URL 图片：通过工具栏“通过 URL 插入图片”（粘贴图标）输入地址，`Enter` 确认，`Esc` 取消。
  - 拖拽图片：将图片文件直接拖入编辑区域自动插入。
  - 可调大小：插入后可在图片控件上调整宽度（支持限制范围）。
- 视频：粘贴视频页面 URL（如 YouTube），会自动转换为可嵌入地址并插入。

## 表格操作（气泡菜单）
- 当光标位于表格单元格时，会显示表格气泡菜单：
  - 插入列（右侧）、插入行（下方）
  - 删除列、删除行
  - 删除表格
- 插入新表格：在工具栏点击“表格”后通过输入行数/列数并确认。

## 数学公式
- 行内公式：输入 LaTeX 后插入为行内公式。
- 块级公式：输入 LaTeX 后插入为块级公式（如不支持 block 节点，会以行内公式的“显示模式”兼容）。

## Slash 命令面板
- 打开/关闭：`Ctrl+/`
- 导航：`ArrowUp` / `ArrowDown`
- 应用命令：`Enter`
- 关闭：`Esc`
- 支持命令（示例）：
  - 标题：一级、二级、三级
  - 列表：无序、有序、任务
  - 引用、代码块、分割线
  - 表格：插入表格、删除表格
  - 文本格式：加粗、斜体、下划线、删除线
  - 对齐：左、居中、右
  - 链接、图片、视频、数学（行内/块级）

## 主题与外观
- 暗色/亮色切换：工具栏右侧按钮（太阳/月亮图标）。
- 主题记忆：会自动记住上次选择（`localStorage: ultratext-color-scheme`）。
- 文档与插入光标颜色：随主题自动适配，保证光标可见性与文本可读性。

## 快捷键总览
- 文件：`Ctrl+O`（打开）、`Ctrl+S`（保存）、`Ctrl+Shift+S`（另存为）
- 查找替换：`Ctrl+F`（查找）、`Ctrl+H`（替换）
- Slash：`Ctrl+/`（打开/关闭）
- 编辑格式：`Ctrl+B`（加粗）、`Ctrl+I`（斜体）、`Ctrl+U`（下划线）、`Ctrl+Shift+X`（删除线）
- 面板内辅助：`Enter`（下一处 / 应用）、`Shift+Enter`（上一处）、`Esc`（关闭）

—— 如需在应用内弹出“帮助 / 快捷键”界面，可在原生菜单中使用“View Shortcuts / Help”，或集成 Mantine 的 `HelpModal`。

---

## M10：Windows 原生集成

本版本将 UltraText 与 Windows Shell 深度集成，提供以下能力：

- 文件关联：`.tiptap`（UltraText Rich Text Document）
- 右键“新建”菜单：在桌面或任意文件夹右键 → 新建(N) → UltraText Document
- 双击打开：双击 `.tiptap` 文件即用 UltraText 打开并载入内容

### 文件格式说明

- `.tiptap`：JSON 结构的富文本，最小可用空白文档示例：

  ```json
  {
    "type": "doc",
    "content": [
      { "type": "paragraph" }
    ]
  }
  ```

- `.md`：打开时转换为 HTML 显示；保存时对 HTML 进行“简转换”为 Markdown
- `.txt`：打开时按行转换为 `<br>`；保存为纯文本

### 安装与“新建文档”原理

- 安装包会将模板文件 `empty.tiptap` 复制到安装目录，并在注册表写入：
  - `HKCR\.tiptap` → `UltraText.tiptap`
  - `HKCR\UltraText.tiptap\DefaultIcon` → 指向应用图标
  - `HKCR\UltraText.tiptap\shell\open\command` → 双击时调用 `UltraText.exe "%1"`
  - `HKCR\.tiptap\ShellNew\FileName` → 指向安装目录的 `empty.tiptap`

### 使用与验证

1. 运行安装包并完成安装
2. 在桌面右键 → 新建(N) → UltraText Document（出现 `.tiptap` 文件）
3. 双击该文件，应用启动并载入一个空白段落（来自模板）

---

## 打包与发布（开发者）

### 打包（Windows）

- 前提：`build/icon.ico` 已存在（256×256）
- 命令：

  ```bash
  npm run build:win
  ```

- 产物：`release/UltraText-<version>-Setup-x64.exe`

### GitHub 推送

1. 更新内容后提交：

   ```bash
   git add -A
   git commit -m "docs(help): 更新帮助文档，加入 M10 指南"
   git push -u origin main
   ```

2. `.gitignore` 已忽略 `release/`，防止安装包推到仓库

### 可选：创建 Release 并上传安装包

```bash
gh release create v0.1.0 \
  --title "UltraText v0.1.0 (M10)" \
  --notes "Windows Shell 集成：右键新建、文件关联、空白启动" \
  release/UltraText-0.1.0-Setup-x64.exe
```

---

## 故障排查

- 推送被拒绝：远程有更新 → `git pull --rebase origin main` 后再推送
- 行尾提示：出现 LF/CRLF 警告属正常，可通过 `.gitattributes` 或 `core.autocrlf` 调整
- Windows 路径过长：`git config --system core.longpaths true`
- 打包失败找不到模板：确保 `build/templates/empty.tiptap` 存在；NSIS 使用 `BUILD_RESOURCES_DIR` 指向 `build/`

---

祝使用愉快！若有问题或建议，欢迎在 GitHub Issue 反馈。