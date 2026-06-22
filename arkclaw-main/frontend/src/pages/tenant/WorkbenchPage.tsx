import { useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject, ReactNode } from 'react';
import { Button, Card, Message, Space, Spin, Switch, Tag, Typography } from '@arco-design/web-react';
import { IconDown } from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import type { EmployeeQuota, TenantOpeningStatus, WorkbenchChannelItem, WorkbenchConfig, WorkbenchToggleItem } from '../../types/domain';

const { Title, Text } = Typography;

type SectionKey =
  | 'conversation'
  | 'scheduled'
  | 'channels'
  | 'basic'
  | 'quick'
  | 'persona'
  | 'install'
  | 'application';

const sectionItems: { key: SectionKey; label: string }[] = [
  { key: 'conversation', label: '对话能力' },
  { key: 'scheduled', label: '定时任务' },
  { key: 'channels', label: '消息渠道' },
  { key: 'basic', label: '基础设置' },
  { key: 'quick', label: '快捷指令' },
  { key: 'persona', label: '人格快捷指令' },
  { key: 'install', label: '技能快捷安装' },
  { key: 'application', label: '申领方式' },
];

export default function WorkbenchPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savedConfig, setSavedConfig] = useState<WorkbenchConfig>();
  const [draftConfig, setDraftConfig] = useState<WorkbenchConfig>();
  const [openingStatus, setOpeningStatus] = useState<TenantOpeningStatus>();
  const [memberQuotas, setMemberQuotas] = useState<EmployeeQuota[]>([]);
  const [activatedMembers, setActivatedMembers] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<SectionKey>('conversation');
  const sectionRefs = useRef<Record<SectionKey, HTMLDivElement | null>>({
    conversation: null,
    scheduled: null,
    channels: null,
    basic: null,
    quick: null,
    persona: null,
    install: null,
    application: null,
  });

  useEffect(() => {
    Promise.all([mockApi.getWorkbenchConfig(), mockApi.getSeats()]).then(([config, seatData]) => {
      setSavedConfig(config);
      setDraftConfig(config);
      setOpeningStatus(seatData.openingStatus);
      setMemberQuotas(seatData.quotas);
      setLoading(false);
    });
  }, []);

  const current = draftConfig;
  const seatPoolActive = openingStatus?.code === 'completed';
  const memberPreviewRows = useMemo(() => {
    return memberQuotas.slice(0, 4).map((item) => {
      const assignedSeat = [
        ['lite', '轻量版', item.lite],
        ['standard', '标准版', item.standard],
        ['pro', '高级版', item.pro],
        ['ultimate', '旗舰版', item.ultimate],
      ].find(([, , value]) => Number(String(value).split('/')[1]?.trim() ?? 0) > 0);
      const activeSeat = [
        item.lite,
        item.standard,
        item.pro,
        item.ultimate,
      ].some((value) => Number(String(value).split('/')[0]?.trim() ?? 0) > 0);
      return {
        ...item,
        seatName: assignedSeat?.[1] ?? '未分配',
        canLogin: Boolean(assignedSeat) && seatPoolActive,
        activated: activatedMembers[item.id] || activeSeat,
      };
    });
  }, [activatedMembers, memberQuotas, seatPoolActive]);

  const switchDisabled = useMemo(() => !editing || !current, [editing, current]);

  const scrollToSection = (key: SectionKey) => {
    setActiveSection(key);
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const updateToggleGroup = (group: 'conversationAbilities' | 'basicSettings', key: string, value: boolean) => {
    setDraftConfig((currentConfig) => {
      if (!currentConfig) return currentConfig;
      return {
        ...currentConfig,
        [group]: currentConfig[group].map((item) => (item.key === key ? { ...item, enabled: value } : item)),
      };
    });
  };

  const updateChannel = (key: string, value: boolean) => {
    setDraftConfig((currentConfig) => {
      if (!currentConfig) return currentConfig;
      return {
        ...currentConfig,
        messageChannels: currentConfig.messageChannels.map((item) =>
          item.key === key ? { ...item, enabled: value } : item,
        ),
      };
    });
  };

  const updateField = (
    field:
      | 'scheduledTaskEnabled'
      | 'quickCommandEnabled'
      | 'personaShortcutEnabled'
      | 'skillQuickInstallEnabled'
      | 'applicationModeEnabled',
    value: boolean,
  ) => {
    setDraftConfig((currentConfig) => (currentConfig ? { ...currentConfig, [field]: value } : currentConfig));
  };

  const handleCancel = () => {
    if (!savedConfig) return;
    setDraftConfig(savedConfig);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!draftConfig) return;
    setSaving(true);
    const saved = await mockApi.saveWorkbenchConfig(draftConfig);
    setSavedConfig(saved);
    setDraftConfig(saved);
    setSaving(false);
    setEditing(false);
    Message.success('员工端工作台配置已保存');
  };

  if (loading || !current) {
    return <Spin className="page-spin" tip="加载员工端工作台配置" />;
  }

  return (
    <div className="workbench-page">
      <div className="workbench-page__header">
        <Title heading={3}>员工端工作台配置</Title>
        {editing ? (
          <Space size={8}>
            <Button onClick={handleCancel}>取消</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>
              保存
            </Button>
          </Space>
        ) : (
          <Button type="primary" onClick={() => setEditing(true)}>
            编辑
          </Button>
        )}
      </div>

      <Card bordered className="workbench-member-card">
        <div className="workbench-member-card__header">
          <div>
            <Title heading={5}>成员登录与席位启用预览</Title>
            <Text type="secondary">承接“管理员分配席位 → 成员首次登录 → 自动启用能力 → 进入 ArkClaw 工作台”的原型结果。</Text>
          </div>
          <Tag color={seatPoolActive ? 'green' : 'orange'}>
            {openingStatus?.text ?? '企业开通状态未知'}
          </Tag>
        </div>
        <div className="workbench-member-grid">
          {memberPreviewRows.map((item) => (
            <div key={item.id} className="workbench-member-item">
              <div className="workbench-member-item__main">
                <strong>{item.name}</strong>
                <Text type="secondary">{item.email}</Text>
                <span>已分配：{item.seatName}</span>
              </div>
              <div className="workbench-member-item__status">
                <Tag color={item.activated ? 'green' : item.canLogin ? 'arcoblue' : 'gray'}>
                  {item.activated ? '已启用席位' : item.canLogin ? '待首次登录' : '不可登录'}
                </Tag>
                <Button
                  size="mini"
                  disabled={!item.canLogin || item.activated}
                  onClick={() => {
                    setActivatedMembers((currentMembers) => ({ ...currentMembers, [item.id]: true }));
                    Message.success(`${item.name} 已模拟登录，席位能力自动启用`);
                  }}
                >
                  模拟成员登录
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="workbench-layout">
        <aside className="workbench-anchor">
          {sectionItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`workbench-anchor__item ${activeSection === item.key ? 'is-active' : ''}`}
              onClick={() => scrollToSection(item.key)}
            >
              {item.label}
            </button>
          ))}
        </aside>

        <div className="workbench-main">
          <div ref={bindSectionRef(sectionRefs, 'conversation')} className="workbench-section">
            <SectionTitle title="对话能力" />
            <div className="workbench-card">
              {current.conversationAbilities.map((item) => (
                <ToggleRow
                  key={item.key}
                  label={item.label}
                  enabled={item.enabled}
                  disabled={switchDisabled}
                  onChange={(value) => updateToggleGroup('conversationAbilities', item.key, value)}
                />
              ))}
            </div>
          </div>

          <div ref={bindSectionRef(sectionRefs, 'scheduled')} className="workbench-inline-section">
            <InlineSectionTitle title="定时任务">
              <Switch
                size="small"
                checked={current.scheduledTaskEnabled}
                disabled={switchDisabled}
                onChange={(value) => updateField('scheduledTaskEnabled', value)}
              />
            </InlineSectionTitle>
          </div>

          <div ref={bindSectionRef(sectionRefs, 'channels')} className="workbench-section">
            <SectionTitle title="消息渠道" />
            <div className="workbench-card">
              {current.messageChannels.map((item) => (
                <ChannelRow
                  key={item.key}
                  item={item}
                  disabled={switchDisabled}
                  onChange={(value) => updateChannel(item.key, value)}
                />
              ))}
            </div>
          </div>

          <div ref={bindSectionRef(sectionRefs, 'basic')} className="workbench-section">
            <SectionTitle title="基础设置" />
            <div className="workbench-card workbench-card--large">
              {current.basicSettings.map((item) => (
                <ToggleRow
                  key={item.key}
                  label={item.label}
                  enabled={item.enabled}
                  disabled={switchDisabled}
                  onChange={(value) => updateToggleGroup('basicSettings', item.key, value)}
                />
              ))}
            </div>
          </div>

          <div ref={bindSectionRef(sectionRefs, 'quick')} className="workbench-inline-section">
            <InlineSectionTitle title="快捷指令">
              <Switch
                size="small"
                checked={current.quickCommandEnabled}
                disabled={switchDisabled}
                onChange={(value) => updateField('quickCommandEnabled', value)}
              />
            </InlineSectionTitle>
          </div>

          <div ref={bindSectionRef(sectionRefs, 'persona')} className="workbench-inline-section">
            <InlineSectionTitle title="人格快捷指令">
              <Switch
                size="small"
                checked={current.personaShortcutEnabled}
                disabled={switchDisabled}
                onChange={(value) => updateField('personaShortcutEnabled', value)}
              />
            </InlineSectionTitle>
          </div>

          <div ref={bindSectionRef(sectionRefs, 'install')} className="workbench-inline-section">
            <InlineSectionTitle title="技能快捷安装">
              <Switch
                size="small"
                checked={current.skillQuickInstallEnabled}
                disabled={switchDisabled}
                onChange={(value) => updateField('skillQuickInstallEnabled', value)}
              />
            </InlineSectionTitle>
          </div>

          <div ref={bindSectionRef(sectionRefs, 'application')} className="workbench-section">
            <SectionTitle title="申领方式" />
            <div className="workbench-card">
              <div className="workbench-application-row">
                <div className="workbench-application-copy">
                  <span>仅支持员工通过自定义模板申领</span>
                  <Text className="workbench-application-hint">
                    开启后，若员工未被分发自定义模板将无法申请 Claw，请谨慎操作
                  </Text>
                </div>
                <Switch
                  size="small"
                  checked={current.applicationModeEnabled}
                  disabled={switchDisabled}
                  onChange={(value) => updateField('applicationModeEnabled', value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function bindSectionRef(
  refs: MutableRefObject<Record<SectionKey, HTMLDivElement | null>>,
  key: SectionKey,
) {
  return (node: HTMLDivElement | null) => {
    refs.current[key] = node;
  };
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="workbench-section-title">
      <IconDown />
      <span>{title}</span>
    </div>
  );
}

function InlineSectionTitle({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="workbench-inline-title">
      <span>{title}</span>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  enabled,
  disabled,
  onChange,
}: {
  label: string;
  enabled: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="workbench-toggle-row">
      <span>{label}</span>
      <Switch size="small" checked={enabled} disabled={disabled} onChange={onChange} />
    </div>
  );
}

function ChannelRow({
  item,
  disabled,
  onChange,
}: {
  item: WorkbenchChannelItem;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="workbench-toggle-row workbench-toggle-row--channel">
      <div className="workbench-channel-meta">
        <span className={`workbench-channel-mark workbench-channel-mark--${item.key}`}>{item.label.slice(0, 1)}</span>
        <div className="workbench-channel-copy">
          <span>{item.label}</span>
          <Text className={`workbench-channel-status workbench-channel-status--${item.bindStatus === '已绑定' ? 'ready' : 'idle'}`}>
            {item.bindStatus}
            {item.bindHint ? ` · ${item.bindHint}` : ''}
          </Text>
        </div>
      </div>
      <Switch size="small" checked={item.enabled} disabled={disabled} onChange={onChange} />
    </div>
  );
}
