import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/core';

export const ResizableImage: React.FC<NodeViewProps> = ({ node, updateAttributes, selected }) => {
  const src: string = node.attrs.src || '';
  const alt: string = node.attrs.alt || '';
  const widthAttr = node.attrs.width;
  const heightAttr = node.attrs.height;

  const [localWidth, setLocalWidth] = React.useState<number>(
    typeof widthAttr === 'number' ? widthAttr : 320,
  );
  const [editableSrc, setEditableSrc] = React.useState<string>(src);
  const [loadError, setLoadError] = React.useState<boolean>(false);
  const [loadedOnce, setLoadedOnce] = React.useState<boolean>(false);

  React.useEffect(() => {
    // 当外部 src 发生变化时，同步到可编辑输入框
    setEditableSrc(src);
    setLoadError(false);
  }, [src]);

  React.useEffect(() => {
    if (typeof widthAttr === 'number') {
      setLocalWidth(widthAttr);
    }
  }, [widthAttr]);

  const onWidthChange = (value: number) => {
    const clamped = Math.max(50, Math.min(2000, Math.floor(value)));
    setLocalWidth(clamped);
    updateAttributes({ width: clamped });
  };

  const onAltChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    updateAttributes({ alt: e.target.value });
  };

  const onSrcKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      const url = editableSrc.trim();
      if (!url) return;
      setLoadError(false);
      updateAttributes({ src: url });
    } else if (e.key === 'Escape') {
      setEditableSrc(src);
      setLoadError(false);
    }
  };

  const handleImgLoad: React.ReactEventHandler<HTMLImageElement> = (e) => {
    setLoadError(false);
    setLoadedOnce(true);
    const naturalWidth = (e.target as HTMLImageElement).naturalWidth || 320;
    // 默认宽度取自然宽度并限制在 [100, 800]
    const clamped = Math.max(100, Math.min(800, Math.floor(naturalWidth)));
    if (!widthAttr) {
      setLocalWidth(clamped);
      updateAttributes({ width: clamped });
    }
  };

  const handleImgError: React.ReactEventHandler<HTMLImageElement> = () => {
    setLoadError(true);
  };

  const showPlaceholder = !src || loadError;

  return (
    <NodeViewWrapper className="resizable-image-wrapper" data-selected={selected ? 'true' : 'false'}>
      {!showPlaceholder && (
        <img
          src={src}
          alt={alt}
          onLoad={handleImgLoad}
          onError={handleImgError}
          style={{
            display: 'block',
            maxWidth: '100%',
            width: localWidth ? `${localWidth}px` : undefined,
            height: heightAttr ? `${heightAttr}px` : undefined,
            objectFit: 'contain',
            borderRadius: 4,
          }}
        />
      )}

      {showPlaceholder && (
        <div className="resizable-image-placeholder" contentEditable={false}>
          <span style={{ color: '#666', marginRight: 8 }}>
            {loadError ? '图片加载失败，请检查地址' : '未设置图片地址'}
          </span>
          <input
            type="text"
            placeholder="粘贴图片 URL，Enter 确认 / Esc 取消"
            value={editableSrc}
            onChange={(e) => setEditableSrc(e.target.value)}
            onKeyDown={onSrcKeyDown}
            style={{ flex: 1 }}
          />
        </div>
      )}

      <div className="resizable-image-controls" contentEditable={false}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          宽度
          <input
            type="range"
            min={100}
            max={800}
            step={10}
            value={localWidth}
            onChange={(e) => onWidthChange(Number(e.target.value))}
          />
          <input
            type="number"
            min={50}
            max={2000}
            step={10}
            value={localWidth}
            onChange={(e) => onWidthChange(Number(e.target.value))}
            style={{ width: 80 }}
          />
          px
        </label>
        <input
          type="text"
          placeholder="Alt 文本"
          value={alt}
          onChange={onAltChange}
          style={{ marginLeft: 12, flex: 1 }}
        />
      </div>
    </NodeViewWrapper>
  );
};