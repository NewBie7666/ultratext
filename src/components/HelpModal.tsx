import React from 'react';
import { Modal, ScrollArea } from '@mantine/core';
import { marked } from 'marked';
import helpMd from '../../HELP.md?raw';

type HelpModalProps = {
  opened: boolean;
  onClose: () => void;
};

export const HelpModal: React.FC<HelpModalProps> = ({ opened, onClose }) => {
  const html = React.useMemo(() => marked.parse(helpMd), []);

  return (
    <Modal opened={opened} onClose={onClose} title="帮助 & 快捷键" size="lg">
      <ScrollArea.Autosize mah={600} p="sm">
        <div className="help-modal-markdown" dangerouslySetInnerHTML={{ __html: html }} />
      </ScrollArea.Autosize>
    </Modal>
  );
};

export default HelpModal;