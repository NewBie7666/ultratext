export {};

declare global {
  interface Window {
    api: {
      openFile: () => Promise<{
        canceled?: boolean;
        filePath?: string;
        content?: string;
        error?: string;
      }>;
      saveFile: (payload: {
        suggestedPath?: string | null;
        content: string;
        preferredFormat?: 'json' | 'md' | 'txt';
      }) => Promise<{
        canceled?: boolean;
        filePath?: string;
        error?: string;
      }>;
      showSaveDialog: (
        suggestedPath?: string,
        preferredFormat?: 'json' | 'md' | 'txt'
      ) => Promise<{
        canceled?: boolean;
        filePath?: string;
        error?: string;
      }>;
      onMenuAction: (
        callback: (command: 'open' | 'save' | 'saveAs' | 'find' | 'replace' | 'show-help') => void
      ) => () => void;
    };
  }
}