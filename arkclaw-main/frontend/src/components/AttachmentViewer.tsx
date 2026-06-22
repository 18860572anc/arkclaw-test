import { useMemo, useState } from 'react';
import { Empty, Modal, Typography } from '@arco-design/web-react';

const { Text } = Typography;

interface AttachmentItem {
  id?: string;
  filename: string;
  size: string;
}

const getAttachmentKind = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'png') return 'png' as const;
  return 'unsupported' as const;
};

const buildPreviewSvg = (filename: string, kind: ReturnType<typeof getAttachmentKind>) => {
  const palette = {
    png: { bg0: '#dbeafe', bg1: '#bfdbfe', accent: '#165dff', label: 'PNG PREVIEW' },
    unsupported: { bg0: '#f8fafc', bg1: '#e5e7eb', accent: '#4b5563', label: 'UNSUPPORTED' },
  }[kind];
  const title = filename.length > 28 ? `${filename.slice(0, 28)}...` : filename;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${palette.bg0}"/>
          <stop offset="100%" stop-color="${palette.bg1}"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="760" fill="url(#g)"/>
      <rect x="120" y="92" width="960" height="576" rx="28" fill="#ffffff" fill-opacity="0.85"/>
      <rect x="170" y="148" width="220" height="42" rx="21" fill="${palette.accent}" fill-opacity="0.12"/>
      <text x="280" y="175" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="${palette.accent}" font-weight="700">${palette.label}</text>
      <text x="600" y="344" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" fill="${palette.accent}" font-weight="700">${kind === 'png' ? '▣' : '!'}</text>
      <text x="600" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#1d2129" font-weight="700">${title}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export default function AttachmentViewer({
  attachments,
  emptyText = '暂无附件',
}: {
  attachments: AttachmentItem[];
  emptyText?: string;
}) {
  const [activeId, setActiveId] = useState<string>('');
  const [detailVisible, setDetailVisible] = useState(false);

  const activeAttachment = useMemo(() => {
    if (!activeId) return undefined;
    return attachments.find((item) => (item.id ?? item.filename) === activeId);
  }, [activeId, attachments]);

  if (!attachments.length) {
    return (
      <div className="attachment-viewer attachment-viewer--empty">
        <Empty description={emptyText} />
      </div>
    );
  }

  return (
    <>
      <div className="attachment-viewer">
        {attachments.map((item) => {
          const key = item.id ?? item.filename;
          return (
            <button
              className="attachment-viewer__item"
              type="button"
              key={key}
              onClick={() => {
                setActiveId(key);
                setDetailVisible(true);
              }}
            >
              {item.filename}
            </button>
          );
        })}
      </div>
      <Modal
        title={activeAttachment ? `${activeAttachment.filename} · 附件详情` : '附件详情'}
        visible={detailVisible}
        footer={null}
        className="attachment-detail-modal-shell"
        onCancel={() => setDetailVisible(false)}
      >
        {activeAttachment ? (
          <div className="attachment-detail-modal">
            {getAttachmentKind(activeAttachment.filename) === 'png' ? (
              <img
                className="attachment-detail-modal__image"
                src={buildPreviewSvg(activeAttachment.filename, 'png')}
                alt={activeAttachment.filename}
              />
            ) : null}
            {getAttachmentKind(activeAttachment.filename) === 'unsupported' ? (
              <div className="attachment-detail-modal__unsupported">
                <img
                  className="attachment-detail-modal__image"
                  src={buildPreviewSvg(activeAttachment.filename, 'unsupported')}
                  alt={activeAttachment.filename}
                />
                <Text type="secondary">当前仅支持 PNG 附件预览。</Text>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
