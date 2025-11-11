; build/installer.nsh
; NSIS 脚本：在安装时添加“右键 -> 新建 -> UltraText 文档”入口

!macro customInstall
  ; 1) 复制空白模板到安装目录
  ; ${__DIR__} 指向本脚本所在目录 (build/)
  ; electron-builder defines BUILD_RESOURCES_DIR pointing to the `build/` folder
  File /oname=$INSTDIR\empty.tiptap "${BUILD_RESOURCES_DIR}\templates\empty.tiptap"

  ; 2) 注册 .tiptap 文件类型与打开命令
  WriteRegStr HKCR ".tiptap" "" "UltraText.tiptap"
  WriteRegStr HKCR "UltraText.tiptap" "" "UltraText Document"
  ; 图标：默认使用可执行文件的第一个图标资源
  WriteRegStr HKCR "UltraText.tiptap\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME},0"
  ; 双击打开命令：将文件路径作为第一个参数传给应用
  WriteRegStr HKCR "UltraText.tiptap\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'

  ; 3) 在“新建”菜单中注册 ShellNew：复制模板文件
  WriteRegStr HKCR ".tiptap\ShellNew" "" ""
  WriteRegStr HKCR ".tiptap\ShellNew" "FileName" "$INSTDIR\empty.tiptap"
!macroend