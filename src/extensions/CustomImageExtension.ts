import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ResizableImage } from '../components/ResizableImage';

export const CustomImage = Image.extend({
  addAttributes() {
    // 合并父扩展的默认属性（src、alt、title）
    const parent = (this as any).parent?.();
    return {
      ...(parent || {}),
      width: {
        default: null,
        renderHTML: (attributes: any) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        renderHTML: (attributes: any) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImage);
  },
});