import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Input,
  Message,
  Modal,
  Progress,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { IconEdit, IconRefresh } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '../../services/mockApi';
import type { EmployeeQuota, SeatLevel, SeatPlan, TenantOpeningStatus, TenantOpeningStatusCode } from '../../types/domain';
import type { PurchaseDraft } from './PurchasePage';

const { Text, Title } = Typography;
const PURCHASE_DRAFT_STORAGE_KEY = 'arkclaw_purchase_draft';

type CodingPlanKey = 'lite' | 'pro';
type SeatChangeType = 'new' | 'upgrade';

const codingPlanMeta: Record<CodingPlanKey, { name: string; price: number }> = {
  lite: { name: 'CodingPlan Team Lite', price: 120 },
  pro: { name: 'CodingPlan Team Pro', price: 600 },
};

const seatPricing: Record<SeatLevel, { base: number; priceLabel: string; codingPlan: CodingPlanKey }> = {
  lite: { base: 210, priceLabel: '¥210/月', codingPlan: 'lite' },
  standard: { base: 430, priceLabel: '¥430/月', codingPlan: 'lite' },
  pro: { base: 860, priceLabel: '¥860/月', codingPlan: 'pro' },
  ultimate: { base: 1720, priceLabel: '¥1,720/月', codingPlan: 'pro' },
};

const seatNameMap: Record<SeatLevel, string> = {
  lite: '轻量版（含 Team Lite）',
  standard: '标准版',
  pro: '高级版（含 Team Pro）',
  ultimate: '旗舰版',
};

const seatChangeTypeLabelMap: Record<SeatChangeType, string> = {
  new: '新购',
  upgrade: '升配',
};

function getSeatChangeTypeLabel(type: SeatChangeType) {
  return seatChangeTypeLabelMap[type];
}

function seatIncludesCodingPlan(level: SeatLevel) {
  return level === 'lite' || level === 'pro';
}

const openingStatusColorMap: Record<TenantOpeningStatusCode, string> = {
  pending_payment: 'gray',
  pending_review: 'orange',
  pending_assign: 'gold',
  pending_handle: 'arcoblue',
  purchasing: 'purple',
  waiting_confirm: 'cyan',
  completed: 'green',
  failed: 'red',
};

type SeatViewMode = 'list' | 'summary';
type CodingPlanDuration = '1' | '3' | '12';

export default function SeatPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState<SeatPlan[]>([]);
  const [quotas, setQuotas] = useState<EmployeeQuota[]>([]);
  const [openingStatus, setOpeningStatus] = useState<TenantOpeningStatus>();
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<SeatViewMode>('list');
  const [keyword, setKeyword] = useState('');
  const [filterField, setFilterField] = useState<'name' | 'email' | 'group'>('name');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [draftSeats, setDraftSeats] = useState<Record<SeatLevel, number>>({
    lite: 0,
    standard: 0,
    pro: 0,
    ultimate: 0,
  });
  const [autoRenew, setAutoRenew] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [serviceTermsVisible, setServiceTermsVisible] = useState(false);
  const [modelTermsVisible, setModelTermsVisible] = useState(false);
  const [changeGuideVisible, setChangeGuideVisible] = useState(false);
  const [codingPlanDuration, setCodingPlanDuration] = useState<CodingPlanDuration>('1');
  const [draftBindings, setDraftBindings] = useState<Record<SeatLevel, boolean>>({
    lite: false,
    standard: false,
    pro: false,
    ultimate: false,
  });

  const loadData = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }

    const data = await mockApi.getSeats();
    setSeats(data.seats);
    setQuotas(data.quotas);
    setOpeningStatus(data.openingStatus);
    setLoading(false);
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const filteredQuotas = useMemo(() => {
    return quotas.filter((item) => item[filterField].toLowerCase().includes(keyword.toLowerCase()));
  }, [filterField, keyword, quotas]);

  const totalPurchased = useMemo(
    () => seats.reduce((sum, seat) => sum + seat.used, 0),
    [seats],
  );

  const totalRemaining = useMemo(
    () => seats.reduce((sum, seat) => sum + Math.max(seat.used - seat.active, 0), 0),
    [seats],
  );

  const expireAt = seats.find((seat) => seat.expiresAt)?.expiresAt ?? '-';
  const changedSeatLines = useMemo(() => {
    return seats
      .map((seat) => {
        const target = draftSeats[seat.level];
        const delta = target - seat.used;
        const pricing = seatPricing[seat.level];
        const changeType: SeatChangeType = seat.used === 0 && target > 0 ? 'new' : 'upgrade';
        return {
          seat,
          target,
          delta,
          changeType,
          count: Math.abs(delta),
          amount: Math.abs(delta) * pricing.base,
        };
      })
      .filter((item) => item.delta !== 0);
  }, [draftSeats, seats]);
  const codingPlanLines = useMemo(() => {
    const totals: Record<CodingPlanKey, number> = { lite: 0, pro: 0 };

    changedSeatLines.forEach((line) => {
      if (seatIncludesCodingPlan(line.seat.level)) return;
      if (!draftBindings[line.seat.level]) return;
      if (line.delta <= 0) return;
      totals[seatPricing[line.seat.level].codingPlan] += line.target;
    });

    return (Object.keys(totals) as CodingPlanKey[])
      .map((key) => ({
        key,
        name: codingPlanMeta[key].name,
        count: totals[key],
        amount: totals[key] * codingPlanMeta[key].price * Number(codingPlanDuration),
      }))
      .filter((item) => item.count > 0);
  }, [changedSeatLines, codingPlanDuration, draftBindings]);
  const estimatePayable = useMemo(
    () => changedSeatLines.reduce((sum, item) => sum + (item.delta > 0 ? item.amount : 0), 0) +
      codingPlanLines.reduce((sum, item) => sum + item.amount, 0),
    [changedSeatLines, codingPlanLines],
  );
  const estimateRefund = useMemo(
    () => changedSeatLines.reduce((sum, item) => sum + (item.delta < 0 ? item.amount : 0), 0),
    [changedSeatLines],
  );
  const estimateAmount = Math.max(estimatePayable - estimateRefund, 0);

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      width: 180,
      render: (_: unknown, record: EmployeeQuota, index: number) => (
        <div className="seat-user-cell">
          <span className={`seat-user-avatar seat-user-avatar--${index % 4}`}>{record.name.slice(0, 1)}</span>
          <span>{record.name}</span>
        </div>
      ),
    },
    { title: '邮箱', dataIndex: 'email', width: 220 },
    {
      title: '配额来源',
      dataIndex: 'source',
      width: 120,
      render: (value: string) => <Tag className="seat-source-tag">{value}</Tag>,
    },
    { title: '轻量（已用/总配额）', dataIndex: 'lite', width: 150 },
    { title: '标准（已用/总数）', dataIndex: 'standard', width: 150 },
    { title: '高级（已用/总数）', dataIndex: 'pro', width: 150 },
    { title: '旗舰（已用/总数）', dataIndex: 'ultimate', width: 150 },
    { title: '用户组', dataIndex: 'group', width: 120 },
    {
      title: '操作',
      width: 88,
      render: () => (
        <Button
          type="text"
          size="mini"
          onClick={() => Message.info('员工配额编辑能力待接入')}
        >
          编辑
        </Button>
      ),
    },
  ];

  const openChangeModal = () => {
    setDraftSeats(
      seats.reduce<Record<SeatLevel, number>>(
        (acc, seat) => ({ ...acc, [seat.level]: seat.used }),
        { lite: 0, standard: 0, pro: 0, ultimate: 0 },
      ),
    );
    setAutoRenew(false);
    setAgreed(false);
    setCodingPlanDuration('1');
    setDraftBindings({ lite: false, standard: false, pro: false, ultimate: false });
    setModalVisible(true);
  };

  const updateDraftSeat = (level: SeatLevel, delta: number) => {
    const currentSeat = seats.find((seat) => seat.level === level);
    const currentUsed = currentSeat?.used ?? 0;
    const minimumAllowed = currentUsed;
    const nextValue = Math.max(draftSeats[level] + delta, 0);

    if (nextValue < minimumAllowed) {
      Message.warning('当前仅支持新购和升配');
      return;
    }

    setDraftSeats((current) => ({
      ...current,
      [level]: nextValue,
    }));
    if (nextValue <= currentUsed) {
      setDraftBindings((current) => ({ ...current, [level]: false }));
    }
  };

  const handleConfirm = () => {
    if (!changedSeatLines.length) {
      Message.warning('请至少变更 1 个席位后再确认');
      return;
    }

    const draft: PurchaseDraft = {
      type: 'seat_sub',
      orderAction: '变更',
      orderType: [
        ...changedSeatLines.map((item) => `${seatNameMap[item.seat.level]} ${getSeatChangeTypeLabel(item.changeType)} ${item.count}席`),
        ...codingPlanLines.map((item) => `${item.name} +${item.count}`),
      ].join('、'),
      amount: estimateAmount,
      cycleMonths: 1,
      seats: changedSeatLines.reduce((sum, item) => sum + Math.max(item.delta, 0), 0),
      lines: [
        ...changedSeatLines.map((item) => ({
          plan: seatNameMap[item.seat.level],
          count: item.count,
          bindCodingPlan: false,
          action: getSeatChangeTypeLabel(item.changeType),
          amount: item.amount,
          unitLabel: '席',
          summary: `${seatNameMap[item.seat.level]} ${getSeatChangeTypeLabel(item.changeType)} ${item.count}席`,
        })),
        ...codingPlanLines.map((item) => ({
          plan: item.name,
          count: item.count,
          bindCodingPlan: true,
          action: '新增',
          amount: item.amount,
          unitLabel: '份',
          summary: `${item.name} +${item.count}`,
        })),
      ],
    };

    window.sessionStorage.setItem(PURCHASE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setModalVisible(false);
    navigate('/tenant/payment', { state: { purchaseDraft: draft } });
  };

  if (loading) {
    return <Spin className="page-spin" tip="加载席位管理" />;
  }

  return (
    <div className="seat-page">
      <div className="seat-page__header">
        <div className="seat-page__header-main">
          <Title heading={3}>席位管理</Title>
          <div className="seat-page__summary">
            <strong>已购买席位总数 {totalPurchased}</strong>
            <span>剩余 {totalRemaining}</span>
            <span>{expireAt} 到期</span>
          </div>
        </div>
        <Space size={8}>
          <Button icon={<IconEdit />} type="primary" onClick={openChangeModal}>
            席位变更
          </Button>
          <Button className="seat-page__icon-button" icon={<IconRefresh />} onClick={() => loadData()} />
        </Space>
      </div>

      <div className="seat-page__quota-link">
        <Button type="text" size="mini" onClick={() => Message.info('配额中心待接入')}>
          配额中心
        </Button>
      </div>

      <section className="seat-opening-panel">
        <div className="seat-opening-panel__main">
          <Tag color={openingStatus ? openingStatusColorMap[openingStatus.code] : 'gray'}>{openingStatus?.text ?? '企业开通状态未知'}</Tag>
          <strong>企业开通状态</strong>
          <Text type={openingStatus?.code === 'failed' ? 'error' : 'secondary'}>
            {openingStatus?.failureReason ?? openingStatus?.description ?? '请刷新后查看最新开通状态。'}
          </Text>
        </div>
        <div className="seat-opening-panel__meta">
          <span>订单 {openingStatus?.orderId ?? '-'}</span>
          <span>任务 {openingStatus?.taskId ?? '-'}</span>
          <span>更新 {openingStatus?.updatedAt ?? '-'}</span>
        </div>
      </section>

      <div className="seat-page__cards">
        {seats.map((seat) => (
          <SeatStatCard key={seat.level} seat={seat} />
        ))}
      </div>

      <section className="seat-quota-panel">
        <div className="seat-quota-panel__header">
          <div className="users-subheading users-subheading--departments">
            <strong>员工配额</strong>
            <span>共 {filteredQuotas.length} 人</span>
          </div>
          <div className="seat-view-switch">
            <button
              type="button"
              className={viewMode === 'list' ? 'is-active' : ''}
              onClick={() => setViewMode('list')}
            >
              三列表
            </button>
            <button
              type="button"
              className={viewMode === 'summary' ? 'is-active' : ''}
              onClick={() => setViewMode('summary')}
            >
              总信息
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <>
            <div className="seat-quota-toolbar">
              <Space size={8}>
                <Select value={filterField} className="compact-select" onChange={(value) => setFilterField(value as 'name' | 'email' | 'group')}>
                  <Select.Option value="name">姓名</Select.Option>
                  <Select.Option value="email">邮箱</Select.Option>
                  <Select.Option value="group">用户组</Select.Option>
                </Select>
                <Input.Search
                  placeholder={`搜索${filterField === 'name' ? '姓名' : filterField === 'email' ? '邮箱' : '用户组'}`}
                  className="table-search"
                  value={keyword}
                  onChange={setKeyword}
                />
              </Space>
              <Button disabled={selectedRowKeys.length === 0}>批量编辑配额</Button>
            </div>

            <div className="users-table-wrap">
              <Table
                rowKey="id"
                className="users-table seat-table"
                columns={columns}
                data={filteredQuotas}
                borderCell={false}
                pagination={{ pageSize: 10, sizeCanChange: true, showTotal: true }}
                rowSelection={{
                  type: 'checkbox',
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys as string[]),
                }}
              />
              <div className="seat-selection-bar">
                <span>已选 {selectedRowKeys.length} 条</span>
                <Button size="small" disabled={selectedRowKeys.length === 0}>
                  批量编辑配额
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="seat-summary-shell">
            <aside className="seat-summary-sidebar">
              <Input.Search
                placeholder="搜索名称"
                value={keyword}
                onChange={setKeyword}
              />
            </aside>
            <div className="seat-summary-empty">
              <div className="seat-summary-empty__icon" />
              <p>请先前往「用户管理」完成员工信息导入</p>
              <Button
                type="primary"
                size="small"
                onClick={() => navigate('/tenant/users', { state: { tab: 'employees' } })}
              >
                前往导入
              </Button>
            </div>
          </div>
        )}
      </section>

      <Modal
        title="席位变更"
        visible={modalVisible}
        footer={null}
        className="seat-change-modal"
        style={{ width: 860 }}
        onCancel={() => setModalVisible(false)}
      >
        <div className="seat-change-layout">
          <div className="seat-change-list">
            {seats.map((seat) => {
              const pricing = seatPricing[seat.level];
              const codingPlan = codingPlanMeta[pricing.codingPlan];
              const includesCodingPlan = seatIncludesCodingPlan(seat.level);
              const added = Math.max(draftSeats[seat.level] - seat.used, 0);
              return (
                <div className="seat-change-item" key={seat.level}>
                  <div className="seat-change-item__main">
                    <div className="seat-change-item__copy">
                      <div className="seat-change-item__title">
                        <strong>{seatNameMap[seat.level]}</strong>
                        <span>{pricing.priceLabel}</span>
                      </div>
                      <span>当前席位: {seat.used}</span>
                      {includesCodingPlan ? null : (
                        <label className="seat-change-bind">
                          <Checkbox
                            checked={draftBindings[seat.level]}
                            disabled={added <= 0}
                            onChange={(checked) => setDraftBindings((current) => ({ ...current, [seat.level]: checked }))}
                          />
                          <span>绑定 <strong>{codingPlan.name}</strong> (¥{codingPlan.price}/月)</span>
                        </label>
                      )}
                    </div>
                    <div className="seat-change-item__actions">
                      <Text>已分配 {seat.active}/{seat.used}</Text>
                      <div className="seat-stepper">
                        <button type="button" onClick={() => updateDraftSeat(seat.level, -1)}>-</button>
                        <span>{draftSeats[seat.level]}</span>
                        <button type="button" onClick={() => updateDraftSeat(seat.level, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

            <div className="seat-bill-panel">
              <div className="seat-bill-panel__section">
                <strong>变更概览</strong>
              <p>
                详情请参见
                <button
                  type="button"
                  className="seat-bill-guide-link"
                  onClick={() => setChangeGuideVisible(true)}
                >
                  席位变更计费说明
                </button>
              </p>
            </div>
            <div className="seat-bill-lines">
              {changedSeatLines.length ? (
                <div className="seat-bill-group">
                  {changedSeatLines.map((item) => (
                    <div key={item.seat.level}>
                      <span>{item.seat.name} <em>{getSeatChangeTypeLabel(item.changeType)} {item.count}</em></span>
                      <strong>{item.delta > 0 ? '+' : '-'}¥{item.amount}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p>暂无新增席位</p>
              )}
            </div>
            <div className="seat-bill-panel__section">
              <span>Claw 席位到期时间</span>
              <p>{expireAt}</p>
            </div>
            <div className="seat-bill-lines seat-bill-lines--coding">
              {codingPlanLines.length ? (
                <div className="seat-bill-group">
                  {codingPlanLines.map((item) => (
                    <div key={item.key}>
                      <span>{item.name} <em>+{item.count}</em></span>
                      <strong>¥{item.amount}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p>暂无 CodingPlan 变更</p>
              )}
            </div>
            <label className="seat-bill-duration">
              <span>CodingPlan 购买时长:</span>
              <Select
                value={codingPlanDuration}
                size="small"
                onChange={(value) => setCodingPlanDuration(value as CodingPlanDuration)}
              >
                <Select.Option value="1">1个月</Select.Option>
              <Select.Option value="3">3个月</Select.Option>
              <Select.Option value="12">1年</Select.Option>
              </Select>
            </label>
            <div className="seat-bill-panel__section">
              <span>预估应付金额</span>
              <div className="seat-bill-price">¥{estimateAmount}</div>
              {estimateRefund > 0 ? <p>含预估可退剩余价值 ¥{estimateRefund}</p> : null}
            </div>
            <div className="seat-checkbox-stack">
              <Checkbox checked={autoRenew} disabled onChange={setAutoRenew}>
                到期自动续订
              </Checkbox>
              <Checkbox checked={agreed} onChange={setAgreed}>
                <span className="seat-agreement-text">
                  我已阅读并同意
                  <button
                    type="button"
                    className="seat-agreement-link"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setServiceTermsVisible(true);
                    }}
                  >
                    《服务条款》
                  </button>
                  <button
                    type="button"
                    className="seat-agreement-link"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setModelTermsVisible(true);
                    }}
                  >
                    《模型服务协议》
                  </button>
                </span>
              </Checkbox>
            </div>
            <Button type="primary" long disabled={!agreed || !changedSeatLines.length} onClick={handleConfirm}>
              确认变更
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="ArkClaw 企业版服务专用条款"
        visible={serviceTermsVisible}
        footer={null}
        className="seat-terms-modal"
        onCancel={() => setServiceTermsVisible(false)}
      >
        <ArkClawServiceTerms />
      </Modal>

      <Modal
        title="席位变更计费说明"
        visible={changeGuideVisible}
        footer={null}
        className="seat-terms-modal seat-change-guide-modal"
        onCancel={() => setChangeGuideVisible(false)}
      >
        <SeatChangeGuide />
      </Modal>

      <Modal
        title="豆包大模型服务协议"
        visible={modelTermsVisible}
        footer={null}
        className="seat-terms-modal seat-terms-modal--model"
        onCancel={() => setModelTermsVisible(false)}
      >
        <DoubaoModelTerms />
      </Modal>
    </div>
  );
}

function SeatStatCard({ seat }: { seat: SeatPlan }) {
  const percent = seat.used ? Math.round((seat.active / seat.used) * 100) : 0;
  const remaining = Math.max(seat.used - seat.active, 0);

  return (
    <div className="seat-manage-card">
      <div className="seat-manage-card__head">
        <strong>{seat.name}</strong>
        <Text>总配额 {seat.quota}</Text>
      </div>
      <Progress percent={percent} showText={false} size="small" />
      <div className="seat-manage-card__row">
        <Text>已分配/已购买</Text>
        <span>{seat.active}/{seat.used}</span>
        <Text>剩余 {remaining}</Text>
      </div>
      <div className="seat-manage-card__row">
        <Text>每个员工最多申请</Text>
        <span>{seat.maxApplyPerEmployee}</span>
        <Button className="seat-manage-card__edit" icon={<IconEdit />} size="mini" type="text" />
      </div>
    </div>
  );
}

function ArkClawServiceTerms() {
  return (
    <div className="seat-legal-doc">
      <section>
        <h3>1. 专用条款的适用性</h3>
        <p>1.1 本专用条款适用于您向火山引擎订购或（和）使用的 <strong>ArkClaw 企业版服务</strong>（“本服务”）。</p>
        <p>1.2 一旦您订购或（和）使用了本服务，本专用条款将与火山引擎官网公示并不时修订的《火山引擎服务条款》《火山引擎隐私政策》《产品和服务协议》、订购协议/服务订单、《服务等级协议》（如有）和服务规则等共同构成完整协议。</p>
        <p>1.3 本专用条款未明确约定事项，将遵照您与火山引擎订立的其他适用协议或服务规则的约定。</p>
      </section>
      <section>
        <h3>2. 使用说明</h3>
        <p>2.1 使用本服务的过程中需依赖火山引擎的其他已有产品。除遵守本专用条款之外，您还需要遵守您授权调用的已有产品相关协议，包括但不限于方舟服务《火山方舟大模型服务平台专用条款》以及您调用的模型对应服务协议。您理解并同意 OpenClaw 是三方开源软件，部署和使用行为需遵守相应开源规则。如您选择参与 Coding Plan 计划，请您务必充分理解并同意 CodingPlan 活动规则。</p>
        <p>2.2 本服务提供 AI 助手搭建能力，支持一键部署 OpenClaw 并配置您需要的 Skills。本服务为企业版，您可以授权员工或其他被授权用户使用本服务。<strong>您理解 AI 技术目前在快速发展阶段，应当对最终用户对本服务的使用做好安全管控，并对最终用户的使用行为承担所有责任。</strong></p>
        <p>若您利用火山方舟或者其他平台的第三方 AI 模型服务，您应遵守相关法律法规，确保您对最终用户提供的 AI 模型服务符合法规要求，并独立承担责任。除另有约定外，火山引擎仅通过技术工具为您提供纯技术性服务，对于服务生成数据的效果、准确性与合法性不做任何形式的承诺或保证。</p>
        <p><strong>对于因您自身原因（包括但不限于配置不当、密钥泄露、使用第三方 Skills 等）导致的数据安全事件，火山引擎不承担责任。</strong></p>
        <h4>2.3 不当使用限制</h4>
        <ol>
          <li>使用本服务的最终用户数量超过订单中载明的许可数量；</li>
          <li>以违法违规或侵犯任何人权利的方式使用本服务；</li>
          <li>对本服务的任何算法、源代码、机制等进行反向工程；</li>
          <li>利用本服务开发、训练或改善其他与火山引擎及其关联方存在竞争关系的算法、模型等；</li>
          <li>以任何方式试图从本服务中单独提取火山引擎数据、授权内容等；</li>
          <li>将本服务使用于任何对主体资格有要求的服务中，包括但不限于医疗服务、法律服务等；</li>
          <li>利用本服务用于任何决策行为；</li>
          <li>删除、篡改、隐匿本服务在输出内容中生成的深度合成服务标识；</li>
          <li>其他可能损害火山引擎及其关联方利益的使用方式；</li>
          <li>大量占用云计算资源，影响火山引擎或火山引擎用户网络、服务器、产品或服务正常运行。</li>
        </ol>
        <p><strong>2.4 火山引擎尊重并保护所有使用本服务用户的个人信息、隐私等权利。您需要确认使用本服务时输入的内容是否包含您或他人的个人信息，如涉及个人信息、隐私、保密或敏感信息，应遵循相关法律规定。</strong></p>
        <h4>2.5 第三方软件或技术</h4>
        <p>您可能会通过本服务使用第三方软件或技术，包括开源代码和公共领域代码。本服务如使用第三方软件或技术，将按照相关法规或约定展示相关协议或文件。您应遵守这些要求，否则第三方或国家机关可能对您采取诉讼、罚款或其他制裁措施，您应自行承担法律责任。</p>
        <p><strong>您确认并承诺，如自行安装或使用任何第三方软件或服务，需自行遵守三方软件或服务的协议或规则。请谨慎选择第三方 Skills，充分评估后再接入本服务，火山引擎对您使用第三方软件或服务的行为及导致的任何后果不承担责任。</strong></p>
        <h4>2.6 数据安全责任</h4>
        <p>双方承认并认可，您为个人信息处理委托方，火山引擎为根据您委托进行个人信息处理活动的受托方。您应保证个人信息来源合法，遵守主服务协议及适用法律对于个人信息处理的相关规定，并在火山引擎处理您提供的个人信息之前进行个人信息保护影响评估。</p>
        <p>若火山引擎有正当理由认为您的个人信息处理指示不满足个人信息安全需要或违反适用法律，有权要求您停止相关行为，并采取或要求您采取有效补救措施控制或消除安全风险。</p>
      </section>
      <section>
        <h3>3. 服务试（使）用说明</h3>
        <p>3.1 火山引擎可能通过邀测、公测等方式，在一定期限或额度内提供免费服务，具体以火山引擎公布的信息为准。免费期间或额度内不需支付费用，但不排除日后收取费用的可能，届时将提前公布收费政策及规范。</p>
        <p>3.2 在试（使）用期间，火山引擎会对服务可用性和可靠性提供技术支撑，但不对任何服务可用性、可靠性做出承诺；《服务等级协议》将在您开通使用产品和服务正式发布版本后开始适用。</p>
      </section>
    </div>
  );
}

function SeatChangeGuide() {
  return (
    <div className="seat-legal-doc seat-change-guide">
      <p className="seat-legal-doc__lead">
        若当前 ArkClaw 席位规格无法满足业务需求时，可执行变更席位操作，调整席位规格和调整席位数量。
      </p>
      <section>
        <h3>变更类型</h3>
        <ul>
          <li>新购：席位数量从 0 变为 1。</li>
          <li>升配：增加未分配席位的数量。</li>
        </ul>
      </section>
      <section>
        <h3>变更规则</h3>
        <h4>已分配席位变更规则</h4>
        <p>适用于对已分配席位进行升级时，目标规格还有剩余可分配席位的场景。</p>
        <ul>
          <li>仅运行中和已停止状态的 ArkClaw 实例支持席位等级变更。</li>
          <li>实例升级后，若原模型仍在新席位配置的模型范围内，保持模型不变；若原模型不在新席位配置的模型范围内，切换到新席位配置的默认模型。</li>
        </ul>
        <h4>未分配席位变更规则</h4>
        <div className="seat-legal-tip">
          <p>ArkClaw 席位变更后有效期不变，费用将按照资源变更计费规则核算。</p>
          <p>CodingPlan 的有效期为您在变更席位页面选择的时长（以 UTC+8 时间为准），一个计费周期的起点为开通资源的时间（精确到秒），终点为到期日的 23:59:59。</p>
          <p>轻量版与高级版席位已默认包含对应的 CodingPlan；标准版与旗舰版可按需额外绑定对应的 CodingPlan。</p>
        </div>
        <div className="seat-rules-table-wrap">
          <table>
            <thead>
              <tr>
                <th>变更类型</th>
                <th>新购</th>
                <th>升配</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>标准版 / 旗舰版</td>
                <td>支持</td>
                <td>支持</td>
              </tr>
              <tr>
                <td>轻量版 / 高级版（已含 CodingPlan）</td>
                <td>支持</td>
                <td>支持</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h3>计费公式</h3>
        <h4>升配订单汇总应付金额</h4>
        <p>新配置费用 - 老配置剩余价值</p>
        <p>新配置刊例价（小时） * 剩余时长（小时） * 折扣 - 老配置刊例价（小时） * 剩余时长（小时） * 折扣</p>
      </section>
      <section>
        <h3>操作步骤</h3>
        <ul>
          <li>如果您需要对未分配席位进行变更席位操作，请在当前席位变更弹窗中调整目标数量后提交。</li>
          <li>如果您需要对已分配席位的 ArkClaw 实例进行席位等级变更，请先释放或迁移已分配实例，再执行席位等级变更。</li>
        </ul>
      </section>
    </div>
  );
}

function DoubaoModelTerms() {
  return (
    <div className="seat-legal-doc">
      <div className="seat-legal-doc__meta">
        <strong>发布日期：2026年03月31日</strong>
        <strong>生效日期：2026年04月07日</strong>
      </div>
      <section>
        <p><strong>欢迎使用豆包大模型（原名“云雀模型”）服务！</strong></p>
        <p><strong>当您通过火山方舟大模型服务平台使用豆包模型服务之前，请务必认真阅读并充分理解《豆包大模型服务协议》。</strong></p>
        <p><strong>豆包大模型是北京火山引擎科技有限公司关联公司提供、由火山方舟售卖的模型服务。免除或限制责任条款等重要内容会以加粗形式提示您注意；一旦使用服务，即视为您已充分理解并承诺遵守本协议。</strong></p>
      </section>
      <section>
        <h3>第一条 产品及服务内容</h3>
        <p>1.1 火山引擎向您提供豆包系列大模型，包括大语言模型、图片生成模型、视频生成模型以及火山方舟展示的其他模型和服务。</p>
        <p>1.2 受限于本协议其他条款，火山引擎授予您非排他的、不可转让、不可分许可、不可转许可、有期限限制、在中国大陆地区范围内的普通使用许可权。</p>
        <p>1.3 服务授权期限自您开通服务之日起计算。如您违反本协议任意约定，火山引擎有权撤回或终止服务授权，并要求您销毁或退回相关资料及复制件。</p>
      </section>
      <section>
        <h3>第二条 服务使用限制</h3>
        <ol>
          <li>不得复制、转让、出租、出借、出售或提供分许可、转许可服务的全部或部分。</li>
          <li>不得对产品服务进行反向工程、反编译或反汇编，或试图提取数据、参数、代码或其他保密信息。</li>
          <li>不得将服务、提示词和模型生成内容用于服务之外的新模型或其他模型的开发、训练、标注、微调、优化、迭代及类似活动。</li>
          <li>不得将模型服务或模型生成内容用于可能对火山引擎及其关联公司的利益、商誉、模型、运营产生不利影响之目的。</li>
          <li>不得利用技术或其他手段破坏、扰乱产品服务运营，或干扰任何产品服务或功能的正常运行。</li>
          <li>您的用户或员工违反以上限制的，您应督促整改；因此给火山引擎造成损失的，您应承担赔偿责任。</li>
        </ol>
      </section>
      <section>
        <h3>第三条 服务使用规则</h3>
        <p>3.1 您保证使用模型服务时遵守相关法律法规及政策，维护互联网秩序和网络安全，不得利用服务发布违法违规、侵害第三方权益或违反公序良俗的内容。</p>
        <p>3.2 如您接入服务向公众提供内容生成式人工智能产品或服务，应独立承担生成式人工智能服务提供者及依法适用的其他责任，包括安全评估、算法备案、内容审核、用户管理、数据安全、监测预警和应急处置等机制。</p>
        <p>3.3 您对所有模型输出内容的使用，以及评估模型输出在具体场景中的准确性、合法性和适当性独立负有全部责任。</p>
        <p>3.4 如需通过本服务操作终端执行或完成跨应用操作，您应谨慎评估风险，并事先取得火山引擎书面确认。</p>
        <p>3.5 至 3.9 涉及参考素材、视觉功能、自定义素材、真人素材授权、生成合成内容标识，以及漏洞披露与安全保护义务。您应确保上传素材合法授权，遵守显示标识和隐式标识合规义务，并及时报告服务漏洞。</p>
      </section>
      <section>
        <h3>第四条 数据访问和使用</h3>
        <p>4.1 除非您单独同意，本服务将不使用您提交给服务或使用服务输出的内容训练、重新训练或改进基础模型。</p>
        <p>4.2 为履行法定合规要求，火山引擎有权采取技术手段对您使用本服务的行为及信息进行审查。</p>
        <p>4.3 至 4.4 您应确保相关信息内容的存储和使用不侵犯第三方合法权益，并对您向服务提供的文字、图片、声音、音频、视频、代码等数据来源及内容负责。</p>
      </section>
      <section>
        <h3>第五条 知识产权</h3>
        <p>5.1 至 5.5 任何一方及其关联方在合同签署前拥有的背景知识产权仍归属该方所有。模型的所有权及知识产权归属火山引擎。火山引擎不提供有关服务的算法、参数、源代码。您的数据的知识产权在适用法律允许范围内归属于您或依法享有权利的权利人。</p>
        <p>您知悉人工智能技术特性可能导致不同用户获得相同或相似输出内容。调优内容仅可按约定范围部署和使用，未经书面同意不得下载、复制、搬离或转移至火山方舟之外。</p>
      </section>
      <section>
        <h3>第六条 保密</h3>
        <p>任何一方应对其他方披露的信息进行保密，未经披露方书面同意不得向第三方披露。未经火山引擎书面或邮件同意，不得在营销、广告、市场推广、资本市场宣传或其他目的中使用、引用或展示火山引擎及关联方商标、商号、名称、标志、人员姓名或形象等。</p>
      </section>
      <section>
        <h3>第七条 违约赔偿和责任限制</h3>
        <p>7.1 至 7.5 您未能履行义务或严重违反协议致使火山引擎遭受损失的，应赔偿全部经济损失。<strong>鉴于大模型技术应用具有探索性，双方理解并同意，火山引擎不承担大模型生成内容本身产生的责任。</strong> 火山引擎承担的全部责任以协议约定为限。</p>
      </section>
      <section>
        <h3>第八条 免责声明</h3>
        <p><strong>火山引擎的产品和服务按照现有技术和条件所能达到的现状提供。除合同或双方书面确认的其他规定外，火山引擎不作任何其他明示或暗示的陈述或保证。</strong></p>
        <p><strong>如您在服务使用过程中加入新的数据进行模型训练、微调和开发，由此产生的责任由您自行承担。</strong></p>
      </section>
      <section>
        <h3>第九条 终止</h3>
        <p>未经双方书面同意，任何一方不得提前终止本协议。若一方严重违反不可补救义务，或严重违反可补救义务但未在通知后六十日内完成补救，对方有权立即终止本协议。</p>
      </section>
      <section>
        <h3>第十条 其他规定</h3>
        <p>任何一方均不对因不可抗力导致未能履行或延迟履行本协议承担责任。本协议适用中华人民共和国法律；因本协议产生之争议，双方应首先协商解决，协商不成的提交有管辖权的人民法院裁决。</p>
      </section>
      <section>
        <h3>第十一条 协议期限及其他</h3>
        <p>本合同自您点击模型使用页面并确认本协议之日起，或开通服务之日（如不一致以最早之日计算）起生效，有效期截止到双方履行完毕本协议。</p>
        <h4>历史版本</h4>
        <ul>
          <li>豆包模型服务协议（2025年12月18日版）</li>
          <li>豆包模型服务协议（2024年12月11日版）</li>
          <li>豆包模型服务协议（2024年05月14日版）</li>
          <li>云雀模型服务协议（2023年09月19日版）</li>
        </ul>
      </section>
    </div>
  );
}
