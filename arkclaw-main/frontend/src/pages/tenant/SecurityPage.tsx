import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Drawer,
  Empty,
  Input,
  Message,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Typography,
} from '@arco-design/web-react';
import {
  IconInfoCircle,
  IconPlus,
  IconRefresh,
  IconSafe,
  IconSettings,
} from '@arco-design/web-react/icon';

const { Title, Text } = Typography;
const TabPane = Tabs.TabPane;

type MainTabKey = 'assistant' | 'skills' | 'protection' | 'models';
type ProtectionTabKey = 'highRisk' | 'sensitive' | 'prompt' | 'scan';

interface AssistantSecurityRow {
  id: string;
  nameId: string;
  owner: string;
  skill: string;
  pushModel: string;
  pluginStatus: '已启用' | '待启用';
  protectionEnabled: boolean;
}

interface SecuritySkillRow {
  id: string;
  skillInfo: string;
  status: '安全' | '风险' | '扫描中';
  scannedAt: string;
}

interface ProtectionRuleRow {
  id: string;
  name: string;
  description: string;
  assistants: string;
  target: string;
  action: string;
  updatedAt: string;
}

interface SecretModelRow {
  id: string;
  modelName: string;
  apiKey: string;
  report: string;
}

const introCards = [
  {
    title: '助手权限管控',
    description: '对 AI 助手的资源访问与能力调用进行精细化控制，支持黑白名单、防越权机制和最小权限运行。',
  },
  {
    title: '高危操作拦截',
    description: '对删除、批量变更和敏感脚本等高风险操作进行规则匹配与执行动作控制。',
  },
  {
    title: '恶意插件识别',
    description: '对接入的 Skill 插件进行安全扫描与识别，降低第三方能力调用风险。',
  },
  {
    title: '数据泄漏防护',
    description: '对输入输出中的敏感信息做实时检测与分级处理，减少业务数据与密钥泄漏。',
  },
];

const assistantRowsSeed: AssistantSecurityRow[] = [
  {
    id: 'assistant-001',
    nameId: '研发助手-01 / claw-rd-01',
    owner: '陈辰',
    skill: 'Browser, SQL Runner',
    pushModel: 'doubao-seed-2.0-pro',
    pluginStatus: '已启用',
    protectionEnabled: true,
  },
  {
    id: 'assistant-002',
    nameId: '销售助理-02 / claw-sales-02',
    owner: '王敏',
    skill: 'Issue Tracker',
    pushModel: 'doubao-seed-2.0',
    pluginStatus: '待启用',
    protectionEnabled: false,
  },
];

const skillRowsSeed: SecuritySkillRow[] = [
  { id: 'skill-safe-001', skillInfo: 'Browser / 官方插件', status: '安全', scannedAt: '2026-04-26 15:20:08' },
  { id: 'skill-risk-002', skillInfo: 'Webhook Bridge / 企业插件', status: '风险', scannedAt: '2026-04-26 14:02:17' },
];

const initialRules: Record<ProtectionTabKey, ProtectionRuleRow[]> = {
  highRisk: [],
  sensitive: [],
  prompt: [],
  scan: [],
};

export default function SecurityPage() {
  const [enabled, setEnabled] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [mainTab, setMainTab] = useState<MainTabKey>('assistant');
  const [protectionTab, setProtectionTab] = useState<ProtectionTabKey>('highRisk');
  const [assistantKeyword, setAssistantKeyword] = useState('');
  const [skillKeyword, setSkillKeyword] = useState('');
  const [ruleKeyword, setRuleKeyword] = useState('');
  const [modelKeyword, setModelKeyword] = useState('');
  const [assistantStatusFilter, setAssistantStatusFilter] = useState<'all' | AssistantSecurityRow['pluginStatus']>('all');
  const [assistantProtectFilter, setAssistantProtectFilter] = useState<'all' | 'opened' | 'closed'>('all');
  const [skillStatusFilter, setSkillStatusFilter] = useState<'all' | SecuritySkillRow['status']>('all');
  const [ruleFilter, setRuleFilter] = useState('请选择');
  const [assistantRows, setAssistantRows] = useState<AssistantSecurityRow[]>(assistantRowsSeed);
  const [skillRows] = useState<SecuritySkillRow[]>(skillRowsSeed);
  const [ruleRowsByTab, setRuleRowsByTab] = useState<Record<ProtectionTabKey, ProtectionRuleRow[]>>(initialRules);
  const [secretModels, setSecretModels] = useState<SecretModelRow[]>([]);
  const [ruleDrawerVisible, setRuleDrawerVisible] = useState(false);
  const [modelDrawerVisible, setModelDrawerVisible] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    target: '',
    action: '拦截',
    scope: 'all',
  });
  const [modelForm, setModelForm] = useState({
    modelName: '',
    endpoint: '',
    apiKey: '',
    baseUrl: '',
    verifyImmediately: true,
  });

  useEffect(() => {
    const stored = window.localStorage.getItem('arkclaw-security-enabled');
    if (stored === '1') {
      setEnabled(true);
      setAgreed(true);
    }
  }, []);

  const assistantRowsFiltered = useMemo(() => {
    return assistantRows.filter((item) => {
      const matchKeyword = !assistantKeyword || item.nameId.toLowerCase().includes(assistantKeyword.toLowerCase());
      const matchStatus = assistantStatusFilter === 'all' || item.pluginStatus === assistantStatusFilter;
      const matchProtection =
        assistantProtectFilter === 'all' ||
        (assistantProtectFilter === 'opened' ? item.protectionEnabled : !item.protectionEnabled);
      return matchKeyword && matchStatus && matchProtection;
    });
  }, [assistantKeyword, assistantProtectFilter, assistantRows, assistantStatusFilter]);

  const skillRowsFiltered = useMemo(() => {
    return skillRows.filter((item) => {
      const matchKeyword = !skillKeyword || item.skillInfo.toLowerCase().includes(skillKeyword.toLowerCase());
      const matchStatus = skillStatusFilter === 'all' || item.status === skillStatusFilter;
      return matchKeyword && matchStatus;
    });
  }, [skillKeyword, skillRows, skillStatusFilter]);

  const currentRuleRows = ruleRowsByTab[protectionTab];

  const filteredRuleRows = useMemo(() => {
    return currentRuleRows.filter((item) => !ruleKeyword || item.name.toLowerCase().includes(ruleKeyword.toLowerCase()));
  }, [currentRuleRows, ruleKeyword]);

  const filteredSecretModels = useMemo(() => {
    return secretModels.filter((item) => !modelKeyword || item.apiKey.toLowerCase().includes(modelKeyword.toLowerCase()));
  }, [modelKeyword, secretModels]);

  const enableSecurity = () => {
    if (!agreed) {
      Message.warning('请先勾选协议');
      return;
    }
    setEnabled(true);
    setMainTab('assistant');
    window.localStorage.setItem('arkclaw-security-enabled', '1');
  };

  const addRule = () => {
    if (!ruleForm.name.trim() || !ruleForm.target.trim()) {
      Message.error('请补全规则名称和高危操作');
      return;
    }
    const nextRow: ProtectionRuleRow = {
      id: `${protectionTab}-${Date.now()}`,
      name: ruleForm.name,
      description: ruleForm.description || '-',
      assistants: ruleForm.scope === 'all' ? '全部助手' : '选择助手',
      target: ruleForm.target,
      action: ruleForm.action,
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    };
    setRuleRowsByTab((current) => ({
      ...current,
      [protectionTab]: [nextRow, ...current[protectionTab]],
    }));
    setRuleDrawerVisible(false);
    setRuleForm({ name: '', description: '', target: '', action: '拦截', scope: 'all' });
    Message.success('规则已添加');
  };

  const addSecretModel = () => {
    if (!modelForm.modelName.trim() || !modelForm.apiKey.trim() || !modelForm.baseUrl.trim()) {
      Message.error('请补全模型名称、API Key 和 Base URL');
      return;
    }
    setSecretModels((current) => [
      {
        id: `secret-model-${Date.now()}`,
        modelName: modelForm.modelName,
        apiKey: modelForm.apiKey,
        report: modelForm.verifyImmediately ? '已提交远程证明' : '待提交',
      },
      ...current,
    ]);
    setModelDrawerVisible(false);
    setModelForm({ modelName: '', endpoint: '', apiKey: '', baseUrl: '', verifyImmediately: true });
    Message.success('机密模型已添加');
  };

  return !enabled ? (
    <div className="security-intro">
      <div className="security-intro__hero">
        <div className="security-intro__brand">
          <span className="security-intro__brand-mark">
            <IconSafe />
          </span>
          <strong>ClawSentry</strong>
        </div>
        <p>让你的 AI 助手安全、合规、可控、可追溯</p>
        <Button className="dark-button security-intro__action" onClick={enableSecurity}>
          立即开通
        </Button>
      </div>

      <div className="security-intro__grid">
        {introCards.map((item) => (
          <div className="security-intro__card" key={item.title}>
            <div className="security-intro__icon">
              <IconSafe />
            </div>
            <strong>{item.title}</strong>
            <span>{item.description}</span>
          </div>
        ))}
      </div>

      <label className="security-intro__agreement">
        <Checkbox checked={agreed} onChange={setAgreed} />
        <span>我已阅读并同意 安全产品和服务专用条款、ClawSentry 服务等级协议、ClawSentry 产品隐私政策</span>
      </label>
    </div>
  ) : (
    <div className="security-page">
      <div className="security-page__header">
        <Title heading={3}>安全管理</Title>
      </div>

      <Tabs activeTab={mainTab} className="tenant-ops-tabs" onChange={(value) => setMainTab(value as MainTabKey)}>
        <TabPane key="assistant" title="助手安全" />
        <TabPane key="skills" title="技能" />
        <TabPane key="protection" title="防护" />
        <TabPane key="models" title="机密模型" />
      </Tabs>

      {mainTab === 'assistant' ? (
        <div className="security-panel">
          <div className="tenant-ops-toolbar">
            <Space size={8}>
              <Select defaultValue="名称" className="compact-select compact-select--label">
                <Select.Option value="名称">名称</Select.Option>
              </Select>
              <Input.Search value={assistantKeyword} onChange={setAssistantKeyword} placeholder="请输入" className="table-search" />
              <Select
                value={assistantStatusFilter}
                className="compact-select compact-select--wide"
                onChange={(value) => setAssistantStatusFilter(value as 'all' | AssistantSecurityRow['pluginStatus'])}
              >
                <Select.Option value="all">安全插件状态</Select.Option>
                <Select.Option value="已启用">已启用</Select.Option>
                <Select.Option value="待启用">待启用</Select.Option>
              </Select>
              <Select
                value={assistantProtectFilter}
                className="compact-select compact-select--wide"
                onChange={(value) => setAssistantProtectFilter(value as 'all' | 'opened' | 'closed')}
              >
                <Select.Option value="all">防护状态</Select.Option>
                <Select.Option value="opened">已开启</Select.Option>
                <Select.Option value="closed">未开启</Select.Option>
              </Select>
            </Space>
            <Button icon={<IconRefresh />} aria-label="刷新助手安全列表" />
          </div>

          <div className="tenant-ops-table-wrap">
            <Table
              rowKey="id"
              className="tenant-ops-table security-table"
              borderCell={false}
              pagination={false}
              data={assistantRowsFiltered}
              noDataElement={<SecurityEmpty />}
              columns={[
                { title: 'AI 助手名称/ID', dataIndex: 'nameId', width: 260, ellipsis: true },
                { title: '所属用户', dataIndex: 'owner', width: 120, ellipsis: true },
                { title: '技能', dataIndex: 'skill', width: 240, ellipsis: true },
                { title: '机密推理', dataIndex: 'pushModel', width: 180, ellipsis: true },
                {
                  title: '安全插件状态',
                  dataIndex: 'pluginStatus',
                  width: 120,
                  render: (value: AssistantSecurityRow['pluginStatus']) => (
                    <span className={`security-status security-status--${value === '已启用' ? 'safe' : 'pending'}`}>{value}</span>
                  ),
                },
                {
                  title: '开启防护',
                  dataIndex: 'protectionEnabled',
                  width: 100,
                  render: (_: boolean, record: AssistantSecurityRow) => (
                    <Switch
                      size="small"
                      checked={record.protectionEnabled}
                      onChange={(checked) => {
                        setAssistantRows((current) =>
                          current.map((item) => (item.id === record.id ? { ...item, protectionEnabled: checked } : item)),
                        );
                      }}
                    />
                  ),
                },
                {
                  title: '操作',
                  width: 96,
                  render: () => (
                    <Button type="text" size="mini">
                      查看
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        </div>
      ) : null}

      {mainTab === 'skills' ? (
        <div className="security-panel">
          <div className="tenant-ops-toolbar">
            <Space size={8}>
              <Select defaultValue="名称" className="compact-select compact-select--label">
                <Select.Option value="名称">名称</Select.Option>
              </Select>
              <Input.Search value={skillKeyword} onChange={setSkillKeyword} placeholder="请输入" className="table-search" />
              <Select
                value={skillStatusFilter}
                className="compact-select compact-select--wide"
                onChange={(value) => setSkillStatusFilter(value as 'all' | SecuritySkillRow['status'])}
              >
                <Select.Option value="all">状态</Select.Option>
                <Select.Option value="安全">安全</Select.Option>
                <Select.Option value="风险">风险</Select.Option>
                <Select.Option value="扫描中">扫描中</Select.Option>
              </Select>
            </Space>
            <Button icon={<IconRefresh />} aria-label="刷新技能安全列表" />
          </div>

          <div className="tenant-ops-table-wrap">
            <Table
              rowKey="id"
              className="tenant-ops-table security-table"
              borderCell={false}
              pagination={false}
              data={skillRowsFiltered}
              noDataElement={<SecurityEmpty />}
              columns={[
                { title: '技能信息', dataIndex: 'skillInfo', ellipsis: true },
                {
                  title: '状态',
                  dataIndex: 'status',
                  width: 120,
                  render: (value: SecuritySkillRow['status']) => (
                    <span
                      className={`security-status security-status--${
                        value === '安全' ? 'safe' : value === '风险' ? 'risk' : 'pending'
                      }`}
                    >
                      {value}
                    </span>
                  ),
                },
                { title: '扫描时间', dataIndex: 'scannedAt', width: 180, ellipsis: true },
              ]}
            />
          </div>
        </div>
      ) : null}

      {mainTab === 'protection' ? (
        <div className="security-panel">
          <div className="security-subtabs">
            <button className={protectionTab === 'highRisk' ? 'is-active' : ''} type="button" onClick={() => setProtectionTab('highRisk')}>
              高危操作拦截
            </button>
            <button className={protectionTab === 'sensitive' ? 'is-active' : ''} type="button" onClick={() => setProtectionTab('sensitive')}>
              敏感数据防护
            </button>
            <button className={protectionTab === 'prompt' ? 'is-active' : ''} type="button" onClick={() => setProtectionTab('prompt')}>
              提示词攻击防护
            </button>
            <button className={protectionTab === 'scan' ? 'is-active' : ''} type="button" onClick={() => setProtectionTab('scan')}>
              风险扫描
            </button>
          </div>

          <div className="tenant-ops-toolbar">
            <Space size={8}>
              <Select defaultValue="规则名称" className="compact-select compact-select--wide">
                <Select.Option value="规则名称">规则名称</Select.Option>
              </Select>
              <Input.Search value={ruleKeyword} onChange={setRuleKeyword} placeholder="请输入" className="table-search" />
              <Select value={ruleFilter} className="compact-select compact-select--wide" onChange={setRuleFilter}>
                <Select.Option value="请选择">{protectionTabLabel(protectionTab)}</Select.Option>
                <Select.Option value="删除仓库">删除仓库</Select.Option>
                <Select.Option value="导出数据">导出数据</Select.Option>
              </Select>
              <Button>高级筛选</Button>
            </Space>
            <Space size={8}>
              <Button icon={<IconRefresh />} aria-label="刷新防护规则列表" />
              <Button icon={<IconSettings />} aria-label="防护设置" />
              <Button type="primary" icon={<IconPlus />} onClick={() => setRuleDrawerVisible(true)}>
                添加规则
              </Button>
            </Space>
          </div>

          <div className="tenant-ops-table-wrap">
            <Table
              rowKey="id"
              className="tenant-ops-table security-table"
              borderCell={false}
              pagination={false}
              data={filteredRuleRows}
              noDataElement={<SecurityEmpty />}
              columns={[
                { title: '规则名称', dataIndex: 'name', width: 180, ellipsis: true },
                { title: '规则描述', dataIndex: 'description', width: 220, ellipsis: true },
                { title: '生效助手', dataIndex: 'assistants', width: 160, ellipsis: true },
                { title: protectionTabLabel(protectionTab), dataIndex: 'target', width: 180, ellipsis: true },
                { title: '执行动作', dataIndex: 'action', width: 120, ellipsis: true },
                { title: '更新时间', dataIndex: 'updatedAt', width: 180, ellipsis: true },
                {
                  title: '操作',
                  width: 96,
                  render: (_: unknown, record: ProtectionRuleRow) => (
                    <Button
                      type="text"
                      size="mini"
                      onClick={() => {
                        setRuleRowsByTab((current) => ({
                          ...current,
                          [protectionTab]: current[protectionTab].filter((item) => item.id !== record.id),
                        }));
                        Message.success('规则已删除');
                      }}
                    >
                      删除
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        </div>
      ) : null}

      {mainTab === 'models' ? (
        <div className="security-panel">
          <div className="tenant-ops-toolbar">
            <Space size={8}>
              <Select defaultValue="API Key" className="compact-select compact-select--wide">
                <Select.Option value="API Key">API Key</Select.Option>
              </Select>
              <Input.Search value={modelKeyword} onChange={setModelKeyword} placeholder="请输入" className="table-search" />
            </Space>
            <Space size={8}>
              <Button icon={<IconRefresh />} aria-label="刷新机密模型列表" />
              <Button icon={<IconSettings />} aria-label="机密模型设置" />
              <Button type="primary" icon={<IconPlus />} onClick={() => setModelDrawerVisible(true)}>
                添加机密模型
              </Button>
            </Space>
          </div>

          <div className="tenant-ops-table-wrap">
            <Table
              rowKey="id"
              className="tenant-ops-table security-table"
              borderCell={false}
              pagination={false}
              data={filteredSecretModels}
              noDataElement={<SecurityEmpty />}
              columns={[
                { title: '模型名称', dataIndex: 'modelName', width: 280, ellipsis: true },
                { title: 'API Key', dataIndex: 'apiKey', width: 360, ellipsis: true },
                { title: '远程证明报告', dataIndex: 'report', width: 220, ellipsis: true },
                {
                  title: '操作',
                  width: 96,
                  render: (_: unknown, record: SecretModelRow) => (
                    <Button
                      type="text"
                      size="mini"
                      onClick={() => {
                        setSecretModels((current) => current.filter((item) => item.id !== record.id));
                        Message.success('机密模型已删除');
                      }}
                    >
                      删除
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        </div>
      ) : null}

      <Drawer
        width={520}
        title={ruleDrawerTitle(protectionTab)}
        visible={ruleDrawerVisible}
        onCancel={() => setRuleDrawerVisible(false)}
        footer={(
          <div className="tenant-network-drawer-footer">
            <Button onClick={() => setRuleDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={addRule}>确定</Button>
          </div>
        )}
      >
        <div className="security-drawer-body">
          <div className="tenant-network-field">
            <span><em>*</em>规则名称</span>
            <Input maxLength={50} showWordLimit value={ruleForm.name} onChange={(value) => setRuleForm((current) => ({ ...current, name: value }))} placeholder="请输入" />
          </div>
          <div className="tenant-network-field">
            <span>规则描述</span>
            <Input maxLength={200} showWordLimit value={ruleForm.description} onChange={(value) => setRuleForm((current) => ({ ...current, description: value }))} placeholder="请输入" />
          </div>
          <div className="tenant-network-field">
            <span><em>*</em>{protectionTabLabel(protectionTab)}</span>
            <Select
              placeholder="请选择"
              value={ruleForm.target || undefined}
              onChange={(value) => setRuleForm((current) => ({ ...current, target: value }))}
            >
              <Select.Option value="删除仓库">删除仓库</Select.Option>
              <Select.Option value="导出数据">导出数据</Select.Option>
              <Select.Option value="访问敏感目录">访问敏感目录</Select.Option>
            </Select>
          </div>
          <div className="tenant-network-field">
            <span><em>*</em>执行动作</span>
            <Radio.Group type="button" value={ruleForm.action} onChange={(value) => setRuleForm((current) => ({ ...current, action: value }))}>
              <Radio value="拦截">拦截</Radio>
              <Radio value="提醒">提醒</Radio>
            </Radio.Group>
          </div>
          <div className="tenant-network-field">
            <span>生效助手</span>
            <Radio.Group type="button" value={ruleForm.scope} onChange={(value) => setRuleForm((current) => ({ ...current, scope: value }))}>
              <Radio value="all">全部助手</Radio>
              <Radio value="selected">选择助手</Radio>
            </Radio.Group>
          </div>
        </div>
      </Drawer>

      <Drawer
        width={520}
        title="添加机密模型"
        visible={modelDrawerVisible}
        onCancel={() => setModelDrawerVisible(false)}
        footer={(
          <div className="tenant-network-drawer-footer">
            <Button onClick={() => setModelDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={addSecretModel}>确定</Button>
          </div>
        )}
      >
        <div className="security-drawer-body">
          <div className="tenant-network-tip">
            <IconInfoCircle />
            <div>
              请先在“AICC”控制台“机密推理”页面创建推理接入点，然后进入“接入点详情”，复制以下字段信息。
              <div className="security-drawer-tip-link">立即前往</div>
            </div>
          </div>
          <div className="security-drawer-check">
            <Checkbox checked={modelForm.verifyImmediately} onChange={(checked) => setModelForm((current) => ({ ...current, verifyImmediately: checked }))}>
              立即前往
            </Checkbox>
          </div>
          <div className="tenant-network-field">
            <span><em>*</em>选择模型</span>
            <Select
              placeholder="请选择"
              value={modelForm.modelName || undefined}
              onChange={(value) => setModelForm((current) => ({ ...current, modelName: value }))}
            >
              <Select.Option value="doubao-seed-2.0-pro">doubao-seed-2.0-pro</Select.Option>
              <Select.Option value="doubao-seed-2.0">doubao-seed-2.0</Select.Option>
            </Select>
          </div>
          <div className="tenant-network-field">
            <span><em>*</em>EP</span>
            <Input addBefore="volcengine-aicc/" maxLength={300} showWordLimit value={modelForm.endpoint} onChange={(value) => setModelForm((current) => ({ ...current, endpoint: value }))} placeholder="请输入" />
          </div>
          <div className="tenant-network-field">
            <span><em>*</em>API Key</span>
            <Input.Password value={modelForm.apiKey} onChange={(value) => setModelForm((current) => ({ ...current, apiKey: value }))} placeholder="请输入" />
          </div>
          <div className="tenant-network-field">
            <span><em>*</em>Base URL</span>
            <Input maxLength={300} showWordLimit value={modelForm.baseUrl} onChange={(value) => setModelForm((current) => ({ ...current, baseUrl: value }))} placeholder="请输入" />
          </div>
        </div>
      </Drawer>
    </div>
  );
}

function protectionTabLabel(tab: ProtectionTabKey) {
  if (tab === 'highRisk') return '高危操作';
  if (tab === 'sensitive') return '敏感类型';
  if (tab === 'prompt') return '攻击类型';
  return '扫描范围';
}

function ruleDrawerTitle(tab: ProtectionTabKey) {
  if (tab === 'highRisk') return '添加高危操作处置规则';
  if (tab === 'sensitive') return '添加敏感数据防护规则';
  if (tab === 'prompt') return '添加提示词攻击防护规则';
  return '添加风险扫描规则';
}

function SecurityEmpty() {
  return <Empty description="暂无数据" />;
}
