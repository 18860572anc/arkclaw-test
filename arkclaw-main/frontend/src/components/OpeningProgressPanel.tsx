import { Button, Progress, Space, Tag, Timeline, Typography } from '@arco-design/web-react';
import { IconDown, IconUp } from '@arco-design/web-react/icon';
import { useState } from 'react';
import type { ReactNode } from 'react';

const { Text } = Typography;

export type OpeningProgressStatus =
  | 'not_started'
  | 'pending_payment'
  | 'payment_review'
  | 'pending_assign'
  | 'pending_handle'
  | 'purchasing'
  | 'waiting_confirm'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type OpeningProgressTimelineItem = {
  id: string;
  time: string;
  title: string;
  detail: string;
};

export type OpeningProgressPanelProps = {
  status?: OpeningProgressStatus;
  orderId?: string;
  taskId?: string;
  owner?: string;
  updatedAt?: string;
  estimatedAt?: string;
  failureReason?: string;
  compact?: boolean;
  actions?: ReactNode;
  timeline?: OpeningProgressTimelineItem[];
};

const isOrderRecord = (title: string) => title.includes('订单创建') || title.includes('下单');
const isPaymentRecord = (title: string) => (
  title.includes('支付')
  || title.includes('付款')
  || title.includes('对公')
  || title.includes('财务审核')
  || title.includes('到账')
  || title.includes('凭证')
);
const isResultRecord = (title: string) => (
  title.includes('完成开通')
  || title.includes('开通完成')
  || title.includes('取消')
  || title.includes('关闭')
);

const failureSafeDeliveryDetail = (detail: string) => (
  detail || '交付人员处理官网代购、企业组合包开通和基础配置。'
);

const simplifyTimeline = (timeline: OpeningProgressTimelineItem[]) => {
  const orderRecord = timeline.find((item) => isOrderRecord(item.title));
  const paymentRecord = timeline.find((item) => isPaymentRecord(item.title));
  const resultRecord = timeline.find((item) => isResultRecord(item.title));
  const deliveryRecord = timeline.find((item) => (
    !isOrderRecord(item.title)
    && !isPaymentRecord(item.title)
    && !isResultRecord(item.title)
  ));

  return [orderRecord, paymentRecord, deliveryRecord ? {
    ...deliveryRecord,
    title: '交付处理',
    detail: failureSafeDeliveryDetail(deliveryRecord.detail),
  } : undefined, resultRecord].filter(Boolean) as OpeningProgressTimelineItem[];
};

const steps = [
  { key: 'ordered', label: '已下单' },
  { key: 'payment', label: '付款确认' },
  { key: 'delivery', label: '交付处理中' },
  { key: 'available', label: '已开通' },
] as const;

const statusMeta: Record<OpeningProgressStatus, { text: string; color: string; step: number; description: string }> = {
  not_started: { text: '已下单', color: 'gray', step: 0, description: '订单已创建，等待客户完成支付或提交付款凭证。' },
  pending_payment: { text: '待付款', color: 'orange', step: 0, description: '订单已创建，等待客户完成支付或提交付款凭证。' },
  payment_review: { text: '付款确认中', color: 'arcoblue', step: 1, description: '付款信息正在确认，对公转账需交付核对流水并由财务终审到账。' },
  pending_assign: { text: '待分配交付', color: 'gold', step: 2, description: '付款已确认，等待交付管理员分配办理人。' },
  pending_handle: { text: '待交付办理', color: 'arcoblue', step: 2, description: '交付办理人已确定，等待开始官网代购和基础配置。' },
  purchasing: { text: '交付处理中', color: 'purple', step: 2, description: '交付正在处理官网代购、企业组合包开通和基础配置。' },
  waiting_confirm: { text: '交付处理中', color: 'cyan', step: 2, description: '交付已提交开通，正在确认企业组合包和基础配置生效。' },
  completed: { text: '已开通', color: 'green', step: 3, description: '企业组合包已生效，客户管理员可以继续分配席位。' },
  failed: { text: '交付处理中', color: 'purple', step: 2, description: '交付正在处理官网代购、企业组合包开通和基础配置。' },
  cancelled: { text: '已取消', color: 'gray', step: 0, description: '订单已关闭，不再进入交付开通流程。' },
};

export const normalizeOpeningProgressStatus = (status?: string, orderStatus?: string): OpeningProgressStatus => {
  if (status && status in statusMeta) return status as OpeningProgressStatus;
  if (orderStatus === 'pending') return 'pending_payment';
  if (orderStatus === 'pending_review') return 'payment_review';
  if (orderStatus === 'paid') return 'not_started';
  if (orderStatus === 'refunded' || orderStatus === 'cancelled') return 'cancelled';
  return 'not_started';
};

export default function OpeningProgressPanel({
  status,
  orderId,
  taskId,
  owner,
  updatedAt,
  estimatedAt,
  failureReason,
  compact,
  actions,
  timeline = [],
}: OpeningProgressPanelProps) {
  const [recordVisible, setRecordVisible] = useState(false);
  const normalizedStatus = normalizeOpeningProgressStatus(status);
  const meta = statusMeta[normalizedStatus];
  const percent = Math.round((meta.step / (steps.length - 1)) * 100);
  const visibleTimeline = simplifyTimeline(timeline);

  return (
    <div className={`opening-progress-panel${compact ? ' opening-progress-panel--compact' : ''}`}>
      <div className="opening-progress-panel__head">
        <div>
          <Space size={8}>
            <Tag color={meta.color}>{meta.text}</Tag>
            {taskId ? <Text type="secondary">任务 {taskId}</Text> : null}
          </Space>
          <p>{failureReason || meta.description}</p>
        </div>
        {actions ? <div className="opening-progress-panel__actions">{actions}</div> : null}
      </div>

      <div className="opening-progress-panel__bar">
        <Progress percent={percent} showText={false} />
        <div className="opening-progress-panel__steps">
          {steps.map((step, index) => (
            <span key={step.key} className={index <= meta.step ? 'is-done' : ''}>{step.label}</span>
          ))}
        </div>
      </div>

      <div className="opening-progress-panel__meta">
        <span>订单 {orderId || '-'}</span>
        <span>负责人 {owner || '待分配'}</span>
        <span>更新 {updatedAt || '-'}</span>
        {estimatedAt ? <span>预计 {estimatedAt}</span> : null}
      </div>

      {!compact && visibleTimeline.length ? (
        <div className="opening-progress-panel__records">
          <Button
            type="text"
            size="small"
            icon={recordVisible ? <IconUp /> : <IconDown />}
            onClick={() => setRecordVisible((visible) => !visible)}
          >
            处理记录
          </Button>
          {recordVisible ? (
            <Timeline>
              {visibleTimeline.map((item) => (
                <Timeline.Item key={item.id} label={item.time}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </Timeline.Item>
              ))}
            </Timeline>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
