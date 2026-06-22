import dayjs from 'dayjs';
import { createNotification } from './notificationMockApi';
import type {
  OpsAlertRecord,
  OpsChangeRecord,
  OpsCustomerOverview,
  OpsDiagnosisDetail,
  OpsDiagnosisWorkspaceItem,
  OpsImBindingDetail,
  OpsImBindingTenantItem,
  OpsInspectionItemResult,
  OpsInspectionRule,
  OpsInspectionRun,
  OpsNetworkDetail,
  OpsNetworkWorkspaceItem,
  OpsRemarkRecord,
  OpsRemoteAssistSession,
  OpsTicketDetail,
  OpsTicketEvent,
  OpsTicketListItem,
  TenantSupportRequestPayload,
} from '../types/domain';

const delay = <T,>(data: T, ms = 160) =>
  new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(data), ms);
  });

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const opsAssignees = [
  { id: 'DE-12', name: '王澈', label: 'DE-12 王澈', roleCode: 'R2.1', roleName: '交付运维' },
  { id: 'TS-08', name: '刘启', label: 'TS-08 刘启', roleCode: 'R2.1', roleName: '交付运维' },
  { id: 'TS-05', name: '朱玥', label: 'TS-05 朱玥', roleCode: 'R2.1', roleName: '交付运维' },
];

const tenantMeta = {
  'tenant-001': {
    name: '云岭制造',
    uscc: '91320101MA1YUN8888',
    salesOwner: '林嘉',
    accountManager: '许岚',
  },
  'tenant-002': {
    name: '北辰科技',
    uscc: '91310109MA1BCN5678',
    salesOwner: '陈默',
    accountManager: '赵祺',
  },
  'tenant-003': {
    name: '星河财税',
    uscc: '91440101MA5GAL1234',
    salesOwner: '许宁',
    accountManager: '周菁',
  },
} as const;

let opsTicketsState: OpsTicketDetail[] = [
  {
    id: 'OPS-OPEN-202604280099',
    title: '开通云岭制造新增高级版席位组合',
    tenantId: 'tenant-001',
    tenantName: tenantMeta['tenant-001'].name,
    uscc: tenantMeta['tenant-001'].uscc,
    queue: 'delivery',
    type: 'opening',
    priority: 'P1',
    status: 'unfinished',
    source: 'system',
    assignee: 'DE-12 王澈',
    slaRemaining: '7h 50m',
    createdAt: '2026-04-28 11:10',
    updatedAt: '2026-04-28 11:12',
    watcher: false,
    priorityPending: false,
    suggestedPriority: 'P1',
    relatedOrderId: 'ORD-20260428-099',
    description: '订单已确认到账，系统按轮询规则分派交付运维完成官网代购和企业组合开通。',
    customerVisible: false,
    salesOwner: tenantMeta['tenant-001'].salesOwner,
    accountManager: tenantMeta['tenant-001'].accountManager,
    attachments: [],
    events: [
      { id: 'evt-open-unassigned-002', eventType: 'assign', actor: '系统轮询', actorRole: 'system', content: '按当前负载将开通工单自动分派给 DE-12 王澈', isInternal: true, createdAt: '2026-04-28 11:12' },
      { id: 'evt-open-unassigned-001', eventType: 'status_change', actor: '系统', actorRole: 'system', content: '对公审核通过后生成开通工单', isInternal: true, createdAt: '2026-04-28 11:10' },
    ],
  },
  {
    id: 'OPS-202604280122',
    title: '客户提交席位登录异常，需要协助处理',
    tenantId: 'tenant-002',
    tenantName: tenantMeta['tenant-002'].name,
    uscc: tenantMeta['tenant-002'].uscc,
    queue: 'support',
    type: 'tech_support',
    priority: 'P2',
    status: 'unfinished',
    source: 'customer',
    assignee: 'TS-05 朱玥',
    slaRemaining: '23h 30m',
    createdAt: '2026-04-28 11:24',
    updatedAt: '2026-04-28 11:24',
    watcher: true,
    priorityPending: false,
    suggestedPriority: 'P2',
    description: '客户管理员反馈 3 名员工无法通过企业微信入口登录，系统已自动分派交付运维跟进。',
    customerVisible: true,
    salesOwner: tenantMeta['tenant-002'].salesOwner,
    accountManager: tenantMeta['tenant-002'].accountManager,
    attachments: [{ id: 'att-unassigned-001', filename: '登录失败截图.png', size: '248 KB' }],
    events: [
      { id: 'evt-triage-unassigned-002', eventType: 'assign', actor: '系统轮询', actorRole: 'system', content: '按当前负载将客户工单自动分派给 TS-05 朱玥', isInternal: true, createdAt: '2026-04-28 11:25' },
      { id: 'evt-triage-unassigned-001', eventType: 'comment', actor: '当前客户管理员', actorRole: 'tenantAdmin', content: '客户提交工单，系统已自动分派交付运维跟进。', isInternal: false, createdAt: '2026-04-28 11:24' },
    ],
  },
  {
    id: 'OPS-202604290041',
    title: '客户提交企微回调地址校验失败，需要协助重新配置',
    tenantId: 'tenant-001',
    tenantName: tenantMeta['tenant-001'].name,
    uscc: tenantMeta['tenant-001'].uscc,
    queue: 'support',
    type: 'im_binding',
    priority: 'P2',
    status: 'unfinished',
    source: 'customer',
    assignee: 'DE-12 王澈',
    slaRemaining: '19h 40m',
    createdAt: '2026-04-29 09:20',
    updatedAt: '2026-04-29 10:15',
    watcher: true,
    priorityPending: false,
    suggestedPriority: 'P2',
    description: '客户管理员在企业微信自助配置时提示回调地址校验失败，请交付运维协助核对可信域名、Agent 配置和回调路径。',
    customerVisible: true,
    salesOwner: tenantMeta['tenant-001'].salesOwner,
    accountManager: tenantMeta['tenant-001'].accountManager,
    attachments: [
      { id: 'att-support-001', filename: '回调报错截图.png', size: '312 KB' },
      { id: 'att-support-002', filename: '企微配置页截图.png', size: '228 KB' },
    ],
    events: [
      { id: 'evt-support-001', eventType: 'assign', actor: '系统轮询', actorRole: 'system', content: '按当前负载自动分派给 DE-12 王澈', isInternal: true, createdAt: '2026-04-29 09:20' },
      { id: 'evt-support-002', eventType: 'comment', actor: '当前客户管理员', actorRole: 'tenantAdmin', content: '配置企微回调地址时一直校验失败，已附上错误截图。', isInternal: false, createdAt: '2026-04-29 09:18' },
      { id: 'evt-support-003', eventType: 'comment', actor: 'DE-12 王澈', actorRole: 'R2.1', content: '已接手排查，先核对可信域名和回调路径是否一致。', isInternal: false, createdAt: '2026-04-29 10:15' },
    ],
  },
  {
    id: 'OPS-202604290057',
    title: '客户提交成员同步失败，需协助补拉组织架构',
    tenantId: 'tenant-001',
    tenantName: tenantMeta['tenant-001'].name,
    uscc: tenantMeta['tenant-001'].uscc,
    queue: 'support',
    type: 'tech_support',
    priority: 'P2',
    status: 'unfinished',
    source: 'customer',
    assignee: 'DE-12 王澈',
    slaRemaining: '21h 10m',
    createdAt: '2026-04-29 14:05',
    updatedAt: '2026-04-29 15:22',
    watcher: true,
    priorityPending: false,
    suggestedPriority: 'P2',
    description: '客户管理员反馈新增的 12 名员工没有同步进 ArkClaw 工作台，影响当天席位分配和登录。',
    customerVisible: true,
    salesOwner: tenantMeta['tenant-001'].salesOwner,
    accountManager: tenantMeta['tenant-001'].accountManager,
    attachments: [{ id: 'att-support-003', filename: '组织架构未同步名单.xlsx', size: '96 KB' }],
    events: [
      { id: 'evt-support-004', eventType: 'assign', actor: '系统轮询', actorRole: 'system', content: '按当前负载自动分派给 DE-12 王澈', isInternal: true, createdAt: '2026-04-29 14:05' },
      { id: 'evt-support-005', eventType: 'comment', actor: '当前客户管理员', actorRole: 'tenantAdmin', content: '新增员工未进入待分配列表，请协助补拉组织架构。', isInternal: false, createdAt: '2026-04-29 14:03' },
      { id: 'evt-support-006', eventType: 'config_change', actor: 'DE-12 王澈', actorRole: 'R2.1', content: '已触发一次员工同步任务，等待客户确认新增成员是否已入池。', isInternal: false, createdAt: '2026-04-29 15:22' },
    ],
  },
  {
    id: 'OPS-OPEN-202604260031',
    title: '开通星河财税试点组合',
    tenantId: 'tenant-003',
    tenantName: tenantMeta['tenant-003'].name,
    uscc: tenantMeta['tenant-003'].uscc,
    queue: 'delivery',
    type: 'opening',
    priority: 'P1',
    status: 'resolved',
    source: 'system',
    assignee: 'DE-12 王澈',
    slaRemaining: '已解决',
    createdAt: '2026-04-26 10:30',
    updatedAt: '2026-04-26 15:18',
    watcher: true,
    priorityPending: false,
    suggestedPriority: 'P1',
    relatedOrderId: 'ORD-20260426-031',
    description: '订单已确认到账，需要在官网代购并确认轻量版、高级版和 CodingPlan Team Pro 组合生效。',
    customerVisible: false,
    salesOwner: tenantMeta['tenant-003'].salesOwner,
    accountManager: tenantMeta['tenant-003'].accountManager,
    attachments: [],
    events: [
      { id: 'evt-open-003', eventType: 'status_change', actor: 'DE-12 王澈', actorRole: 'R2.1', content: '已确认企业组合生效，工单标记为已解决', isInternal: true, createdAt: '2026-04-26 15:18' },
      { id: 'evt-open-001', eventType: 'assign', actor: '系统轮询', actorRole: 'system', content: '对公审核通过后生成开通工单，并按负载自动分派给 DE-12 王澈', isInternal: true, createdAt: '2026-04-26 10:30' },
      { id: 'evt-open-002', eventType: 'status_change', actor: 'DE-12 王澈', actorRole: 'R2.1', content: '已开始官网代购流程，等待企业组合生效确认', isInternal: true, createdAt: '2026-04-26 10:36' },
    ],
  },
  {
    id: 'OPS-OPEN-202604010014',
    title: '启明医疗器械开通异常复核',
    tenantId: 'tenant-003',
    tenantName: '启明医疗器械',
    uscc: '91330102MA1QIM0144',
    queue: 'delivery',
    type: 'opening',
    priority: 'P1',
    status: 'resolved',
    source: 'system',
    assignee: 'TS-08 刘启',
    slaRemaining: '已解决',
    createdAt: '2026-04-01 14:30',
    updatedAt: '2026-04-01 14:40',
    watcher: true,
    priorityPending: false,
    suggestedPriority: 'P1',
    relatedOrderId: 'ORD-20260401-014',
    description: '官网主体校验失败，需复核企业采购账号和合同主体后继续开通。',
    customerVisible: false,
    salesOwner: '许宁',
    accountManager: '周菁',
    attachments: [],
    events: [
      { id: 'evt-open-010', eventType: 'assign', actor: '系统轮询', actorRole: 'system', content: '开通工单按负载自动分派给 TS-08 刘启', isInternal: true, createdAt: '2026-04-01 14:30' },
      { id: 'evt-open-012', eventType: 'status_change', actor: 'TS-08 刘启', actorRole: 'R2.1', content: '工单已标记解决', isInternal: true, createdAt: '2026-04-01 16:10' },
      { id: 'evt-open-011', eventType: 'comment', actor: 'TS-08 刘启', actorRole: 'R2.1', content: '官网主体校验失败，正在复核采购信息。', isInternal: true, createdAt: '2026-04-01 14:40' },
    ],
  },
  {
    id: 'OPS-202604280001',
    title: '完成企微绑定、员工同步与登录域名配置',
    tenantId: 'tenant-001',
    tenantName: tenantMeta['tenant-001'].name,
    uscc: tenantMeta['tenant-001'].uscc,
    queue: 'delivery',
    type: 'im_binding',
    priority: 'P1',
    status: 'unfinished',
    source: 'system',
    assignee: 'DE-12 王澈',
    slaRemaining: '18h 20m',
    createdAt: '2026-04-28 09:10',
    updatedAt: '2026-04-28 10:35',
    watcher: true,
    priorityPending: false,
    suggestedPriority: 'P1',
    relatedOrderId: 'ORD-20260428-119',
    description: '客户已完成首年套餐付款，需在今日内完成企微绑定、员工同步与自定义域名启用。',
    customerVisible: true,
    salesOwner: tenantMeta['tenant-001'].salesOwner,
    accountManager: tenantMeta['tenant-001'].accountManager,
    attachments: [
      { id: 'att-001', filename: '客户授权书.pdf', size: '386 KB' },
      { id: 'att-002', filename: '域名证书申请说明.docx', size: '124 KB' },
    ],
    events: [
      { id: 'evt-001', eventType: 'assign', actor: '系统轮询', actorRole: 'system', content: '按当前负载自动分派给 DE-12 王澈', isInternal: true, createdAt: '2026-04-28 09:20' },
      { id: 'evt-002', eventType: 'status_change', actor: 'DE-12 王澈', actorRole: 'R2.1', content: '工单状态更新为未完成', isInternal: true, createdAt: '2026-04-28 09:28' },
      { id: 'evt-003', eventType: 'config_change', actor: 'DE-12 王澈', actorRole: 'R2.1', content: '已录入企微 CorpID / AgentID，等待客户确认可信域名', isInternal: false, createdAt: '2026-04-28 10:35' },
    ],
  },
  {
    id: 'OPS-202604280013',
    title: '私网出口延时波动，需复核路由与安全组',
    tenantId: 'tenant-002',
    tenantName: tenantMeta['tenant-002'].name,
    uscc: tenantMeta['tenant-002'].uscc,
    queue: 'delivery',
    type: 'network',
    priority: 'P1',
    status: 'unfinished',
    source: 'system',
    assignee: 'TS-08 刘启',
    slaRemaining: '5h 15m',
    createdAt: '2026-04-28 07:40',
    updatedAt: '2026-04-28 10:12',
    watcher: false,
    priorityPending: false,
    suggestedPriority: 'P1',
    relatedAlertId: 'ALT-20260428-09',
    description: '周巡检发现北辰科技私网出口到 10.4.12.6 的 RTT 抖动超阈值，且丢包率达到 8%。',
    customerVisible: false,
    salesOwner: tenantMeta['tenant-002'].salesOwner,
    accountManager: tenantMeta['tenant-002'].accountManager,
    attachments: [{ id: 'att-003', filename: '巡检波动截图.png', size: '812 KB' }],
    events: [
      { id: 'evt-010', eventType: 'sla_alert', actor: '系统', actorRole: 'system', content: '巡检异常自动建单，默认优先级 P1', isInternal: true, createdAt: '2026-04-28 07:40' },
      { id: 'evt-011', eventType: 'assign', actor: '系统轮询', actorRole: 'system', content: '按当前负载自动分派给 TS-08 刘启处理', isInternal: true, createdAt: '2026-04-28 08:05' },
      { id: 'evt-012', eventType: 'comment', actor: 'TS-08 刘启', actorRole: 'R2.1', content: '已联系网络组排查路由策略，持续跟进处理。', isInternal: true, createdAt: '2026-04-28 10:12' },
    ],
  },
  {
    id: 'OPS-202604270091',
    title: '客户反馈员工登录失败，需要快速诊断',
    tenantId: 'tenant-003',
    tenantName: tenantMeta['tenant-003'].name,
    uscc: tenantMeta['tenant-003'].uscc,
    queue: 'support',
    type: 'tech_support',
    priority: 'P2',
    status: 'unfinished',
    source: 'customer',
    assignee: 'TS-05 朱玥',
    slaRemaining: '22h 04m',
    createdAt: '2026-04-27 18:42',
    updatedAt: '2026-04-28 08:45',
    watcher: true,
    priorityPending: false,
    suggestedPriority: 'P2',
    description: '客户财务团队反馈通过飞书入口登录时提示“凭证失效”，影响当天早班使用。',
    customerVisible: true,
    salesOwner: tenantMeta['tenant-003'].salesOwner,
    accountManager: tenantMeta['tenant-003'].accountManager,
    attachments: [],
    events: [
      { id: 'evt-020', eventType: 'assign', actor: '系统轮询', actorRole: 'system', content: '按当前负载自动分派给 TS-05 朱玥', isInternal: true, createdAt: '2026-04-27 18:55' },
      { id: 'evt-021', eventType: 'comment', actor: 'TS-05 朱玥', actorRole: 'R2.1', content: '已发起一键诊断，怀疑飞书 token 失效。', isInternal: false, createdAt: '2026-04-28 08:45' },
    ],
  },
  {
    id: 'OPS-202604270118',
    title: '客户提交开通后工作台白屏，需要协助排查',
    tenantId: 'tenant-002',
    tenantName: tenantMeta['tenant-002'].name,
    uscc: tenantMeta['tenant-002'].uscc,
    queue: 'support',
    type: 'tech_support',
    priority: 'P1',
    status: 'resolved',
    source: 'customer',
    assignee: 'DE-12 王澈',
    slaRemaining: '已解决',
    createdAt: '2026-04-27 09:40',
    updatedAt: '2026-04-27 12:30',
    watcher: true,
    priorityPending: false,
    suggestedPriority: 'P1',
    description: '客户管理员反馈员工首次登录工作台后页面白屏，经排查为浏览器缓存旧版本静态资源导致。',
    customerVisible: true,
    salesOwner: tenantMeta['tenant-002'].salesOwner,
    accountManager: tenantMeta['tenant-002'].accountManager,
    attachments: [{ id: 'att-support-004', filename: '白屏录屏.mp4', size: '4.2 MB' }],
    events: [
      { id: 'evt-support-007', eventType: 'assign', actor: '系统轮询', actorRole: 'system', content: '按当前负载自动分派给 DE-12 王澈', isInternal: true, createdAt: '2026-04-27 09:40' },
      { id: 'evt-support-008', eventType: 'comment', actor: '当前客户管理员', actorRole: 'tenantAdmin', content: '员工登录后只显示空白页面，附上录屏。', isInternal: false, createdAt: '2026-04-27 09:38' },
      { id: 'evt-support-009', eventType: 'status_change', actor: 'DE-12 王澈', actorRole: 'R2.1', content: '已指导客户清理缓存并刷新静态资源，问题恢复，工单关闭。', isInternal: false, createdAt: '2026-04-27 12:30' },
    ],
  },
];

let bindingWorkspaceState: OpsImBindingTenantItem[] = [
  {
    tenantId: 'tenant-001',
    tenantName: tenantMeta['tenant-001'].name,
    uscc: tenantMeta['tenant-001'].uscc,
    currentTicketId: 'OPS-202604280001',
    updatedAt: '2026-04-28 10:35',
    owner: 'DE-12 王澈',
    statuses: { feishu: 'unconfigured', wecom: 'active', dingtalk: 'unconfigured', wechat: 'unconfigured' },
  },
  {
    tenantId: 'tenant-002',
    tenantName: tenantMeta['tenant-002'].name,
    uscc: tenantMeta['tenant-002'].uscc,
    currentTicketId: 'OPS-202604280013',
    updatedAt: '2026-04-27 16:22',
    owner: 'DE-03 周棋',
    statuses: { feishu: 'broken', wecom: 'active', dingtalk: 'disabled', wechat: 'unconfigured' },
  },
  {
    tenantId: 'tenant-003',
    tenantName: tenantMeta['tenant-003'].name,
    uscc: tenantMeta['tenant-003'].uscc,
    currentTicketId: 'OPS-202604270091',
    updatedAt: '2026-04-28 08:45',
    owner: 'TS-05 朱玥',
    statuses: { feishu: 'active', wecom: 'unconfigured', dingtalk: 'unconfigured', wechat: 'unconfigured' },
  },
];

let bindingDetailState: Record<string, OpsImBindingDetail> = {
  'tenant-001': {
    tenantId: 'tenant-001',
    tenantName: tenantMeta['tenant-001'].name,
    currentTicketId: 'OPS-202604280001',
    channels: [
      {
        channel: 'wecom',
        status: 'active',
        trustedDomain: 'https://claw.yl-manufacture.com',
        callbackUrl: 'https://ops.arkclaw.com/callback/wecom/tenant-001',
        visibleScope: '全员',
        defaultSeatLevel: '专业版',
        lastTestAt: '2026-04-28 10:29',
        lastTestResult: 'pass',
        fields: [
          { key: 'corpId', label: 'Corp ID', required: true },
          { key: 'agentId', label: 'Agent ID', required: true },
          { key: 'secret', label: 'Secret', required: true, secret: true },
          { key: 'token', label: 'Token', required: true },
          { key: 'encodingAesKey', label: 'EncodingAESKey', required: true, secret: true },
        ],
        config: {
          corpId: 'ww8a4fdb1c20e5e61b',
          agentId: '1000021',
          secret: '****',
          token: 'qwecom-verify-token',
          encodingAesKey: '****',
        },
        checks: [
          { id: 'chk-001', label: 'Corp ID 验证', status: 'pass', detail: '获取 access_token 成功' },
          { id: 'chk-002', label: '回调连通', status: 'pass', detail: '测试事件 2.1s 内收到' },
          { id: 'chk-003', label: '员工列表读取', status: 'pass', detail: '读取到 428 名员工' },
        ],
      },
      {
        channel: 'feishu',
        status: 'unconfigured',
        trustedDomain: 'https://claw.yl-manufacture.com',
        callbackUrl: 'https://ops.arkclaw.com/callback/feishu/tenant-001',
        visibleScope: '全员',
        defaultSeatLevel: '标准版',
        fields: [
          { key: 'appId', label: 'App ID', required: true },
          { key: 'appSecret', label: 'App Secret', required: true, secret: true },
          { key: 'encryptKey', label: 'Encrypt Key', secret: true },
          { key: 'verificationToken', label: 'Verification Token', required: true },
        ],
        config: {
          appId: '',
          appSecret: '',
          encryptKey: '',
          verificationToken: '',
        },
        checks: [],
      },
    ],
    history: [
      { id: 'bh-001', channel: 'wecom', changedBy: 'DE-12 王澈', changeType: 'create', changedAt: '2026-04-28 10:31', testResult: 'pass', summary: '首次创建企微绑定并同步员工' },
    ],
  },
  'tenant-002': {
    tenantId: 'tenant-002',
    tenantName: tenantMeta['tenant-002'].name,
    currentTicketId: 'OPS-202604280013',
    channels: [
      {
        channel: 'feishu',
        status: 'broken',
        trustedDomain: 'https://staff.beichen-tech.com',
        callbackUrl: 'https://ops.arkclaw.com/callback/feishu/tenant-002',
        visibleScope: '指定通讯录',
        defaultSeatLevel: '专业版',
        lastTestAt: '2026-04-28 08:43',
        lastTestResult: 'fail',
        fields: [
          { key: 'appId', label: 'App ID', required: true },
          { key: 'appSecret', label: 'App Secret', required: true, secret: true },
          { key: 'encryptKey', label: 'Encrypt Key', secret: true },
          { key: 'verificationToken', label: 'Verification Token', required: true },
        ],
        config: {
          appId: 'cli_a2ed89205be9100d',
          appSecret: '****',
          encryptKey: '****',
          verificationToken: 'bc-feishu-token',
        },
        checks: [
          { id: 'chk-011', label: 'App ID 验证', status: 'pass', detail: 'tenant_access_token 正常' },
          { id: 'chk-012', label: '回调连通', status: 'fail', detail: '飞书测试事件返回 502' },
        ],
      },
      {
        channel: 'wecom',
        status: 'active',
        trustedDomain: 'https://staff.beichen-tech.com',
        callbackUrl: 'https://ops.arkclaw.com/callback/wecom/tenant-002',
        visibleScope: '指定部门',
        defaultSeatLevel: '专业版',
        lastTestAt: '2026-04-26 17:42',
        lastTestResult: 'pass',
        fields: [
          { key: 'corpId', label: 'Corp ID', required: true },
          { key: 'agentId', label: 'Agent ID', required: true },
          { key: 'secret', label: 'Secret', required: true, secret: true },
          { key: 'token', label: 'Token', required: true },
          { key: 'encodingAesKey', label: 'EncodingAESKey', required: true, secret: true },
        ],
        config: {
          corpId: 'wwce3a1baf490128b1',
          agentId: '1000009',
          secret: '****',
          token: 'bc-wecom-token',
          encodingAesKey: '****',
        },
        checks: [
          { id: 'chk-014', label: 'Corp ID 验证', status: 'pass', detail: '拉取 access_token 正常' },
          { id: 'chk-015', label: '员工列表读取', status: 'pass', detail: '读取到 210 名员工' },
        ],
      },
    ],
    history: [
      { id: 'bh-002', channel: 'feishu', changedBy: 'TS-05 朱玥', changeType: 'update', changedAt: '2026-04-28 08:43', testResult: 'fail', summary: '回调域名替换后连通失败' },
      { id: 'bh-003', channel: 'wecom', changedBy: 'DE-03 周棋', changeType: 'create', changedAt: '2026-04-22 18:05', testResult: 'pass', summary: '企微接入完成' },
    ],
  },
  'tenant-003': {
    tenantId: 'tenant-003',
    tenantName: tenantMeta['tenant-003'].name,
    currentTicketId: 'OPS-202604270091',
    channels: [
      {
        channel: 'feishu',
        status: 'active',
        trustedDomain: 'https://staff.xinghe-tax.com',
        callbackUrl: 'https://ops.arkclaw.com/callback/feishu/tenant-003',
        visibleScope: '全员',
        defaultSeatLevel: '标准版',
        lastTestAt: '2026-04-27 17:58',
        lastTestResult: 'pass',
        fields: [
          { key: 'appId', label: 'App ID', required: true },
          { key: 'appSecret', label: 'App Secret', required: true, secret: true },
          { key: 'encryptKey', label: 'Encrypt Key', secret: true },
          { key: 'verificationToken', label: 'Verification Token', required: true },
        ],
        config: {
          appId: 'cli_12f9ab7810991cde',
          appSecret: '****',
          encryptKey: '****',
          verificationToken: 'xh-feishu-token',
        },
        checks: [
          { id: 'chk-021', label: '模拟登录', status: 'pass', detail: '随机员工登录 200 OK' },
        ],
      },
    ],
    history: [{ id: 'bh-004', channel: 'feishu', changedBy: 'DE-09 何宇', changeType: 'create', changedAt: '2026-04-16 13:40', testResult: 'pass', summary: '首版飞书绑定上线' }],
  },
};

let networkWorkspaceState: OpsNetworkWorkspaceItem[] = [
  {
    tenantId: 'tenant-001',
    tenantName: tenantMeta['tenant-001'].name,
    uscc: tenantMeta['tenant-001'].uscc,
    customDomain: 'claw.yl-manufacture.com',
    ingressStatus: 'testing',
    egressStatus: 'off',
    vpcStatus: 'off',
    health: 'warn',
    owner: 'DE-12 王澈',
    updatedAt: '2026-04-28 10:40',
  },
  {
    tenantId: 'tenant-002',
    tenantName: tenantMeta['tenant-002'].name,
    uscc: tenantMeta['tenant-002'].uscc,
    customDomain: 'staff.beichen-tech.com',
    ingressStatus: 'active',
    egressStatus: 'active',
    vpcStatus: 'active',
    health: 'danger',
    owner: 'TS-08 刘启',
    updatedAt: '2026-04-28 10:12',
  },
  {
    tenantId: 'tenant-003',
    tenantName: tenantMeta['tenant-003'].name,
    uscc: tenantMeta['tenant-003'].uscc,
    customDomain: 'staff.xinghe-tax.com',
    ingressStatus: 'expiring',
    egressStatus: 'testing',
    vpcStatus: 'off',
    health: 'warn',
    owner: 'DE-09 何宇',
    updatedAt: '2026-04-27 17:50',
  },
];

let networkDetailState: Record<string, OpsNetworkDetail> = {
  'tenant-001': {
    tenantId: 'tenant-001',
    tenantName: tenantMeta['tenant-001'].name,
    currentTicketId: 'OPS-202604280001',
    defaultLoginUrl: 'https://claw.arkclaw.com/tenant-001',
    customDomainEnabled: true,
    customDomain: 'claw.yl-manufacture.com',
    certMode: 'acme',
    certExpiresAt: '2027-03-22',
    redirectStrategy: '默认页',
    ingressTests: [
      { id: 'nt-001', label: 'DNS 解析测试', status: 'pass', detail: '多节点解析均指向目标 LB' },
      { id: 'nt-002', label: '证书有效性', status: 'pass', detail: '有效期剩余 328 天' },
      { id: 'nt-003', label: '端到端登录', status: 'warn', detail: '模拟登录成功，首包耗时 1.9s' },
    ],
    egressEnabled: false,
    egressAcceleration: false,
    egressNode: '未启用',
    egressWhitelist: ['api.feishu.cn'],
    egressIpWhitelist: [],
    egressRateLimit: '未配置',
    egressTests: [{ id: 'nt-004', label: '出口健康', status: 'warn', detail: '公网出口尚未启用' }],
    vpcEnabled: false,
    vpcMethod: 'vpn',
    vpcId: '',
    vpcSubnet: '',
    vpcGateway: '',
    ourCidr: '172.21.0.0/24',
    authorizationUploaded: false,
    routeTable: [],
    securityGroups: ['默认拒绝全部入站'],
    vpcTests: [{ id: 'nt-005', label: '私网连通', status: 'warn', detail: '未配置私网出口' }],
    requiresApproval: true,
    history: [{ id: 'nh-001', changedAt: '2026-04-28 10:38', changedBy: 'DE-12 王澈', changeType: 'update', summary: '开启自定义域名并完成 ACME 证书申请', ticketId: 'OPS-202604280001' }],
  },
  'tenant-002': {
    tenantId: 'tenant-002',
    tenantName: tenantMeta['tenant-002'].name,
    currentTicketId: 'OPS-202604280013',
    defaultLoginUrl: 'https://claw.arkclaw.com/tenant-002',
    customDomainEnabled: true,
    customDomain: 'staff.beichen-tech.com',
    certMode: 'upload',
    certExpiresAt: '2026-12-16',
    redirectStrategy: '默认页',
    ingressTests: [
      { id: 'nt-011', label: 'DNS 解析测试', status: 'pass', detail: '杭州 / 上海 / 香港节点解析一致' },
      { id: 'nt-012', label: '证书有效性', status: 'pass', detail: '证书链完整' },
      { id: 'nt-013', label: '端到端登录', status: 'pass', detail: '随机账号 1.2s 完成登录' },
    ],
    egressEnabled: true,
    egressAcceleration: true,
    egressNode: '北美',
    egressWhitelist: ['api.openai.com', 'graph.microsoft.com', 'slack.com'],
    egressIpWhitelist: ['52.168.0.0/16'],
    egressRateLimit: '300 QPS / 50 Mbps',
    egressTests: [
      { id: 'nt-014', label: '域名白名单探测', status: 'pass', detail: '抽样 3 个域名均可达' },
      { id: 'nt-015', label: '跨境加速对比', status: 'warn', detail: '开启加速后 RTT 仍有 18% 抖动' },
    ],
    vpcEnabled: true,
    vpcMethod: 'direct',
    vpcId: 'vpc-bc-prod-01',
    vpcSubnet: '10.4.0.0/16',
    vpcGateway: '10.4.0.1',
    ourCidr: '172.18.12.0/24',
    authorizationUploaded: true,
    routeTable: ['10.4.0.0/16 -> peering-a01', '172.18.12.0/24 -> nat-ops-02'],
    securityGroups: ['tcp:443 allow 10.4.12.0/24', 'tcp:8080 allow 10.4.12.6/32'],
    vpcTests: [
      { id: 'nt-016', label: '指定 IP Ping', status: 'fail', detail: '10.4.12.6 丢包率 8%' },
      { id: 'nt-017', label: 'TCP 8080 探测', status: 'warn', detail: '偶发超时 2 次' },
    ],
    requiresApproval: true,
    history: [
      { id: 'nh-011', changedAt: '2026-04-26 14:10', changedBy: 'OL-03 宋远', changeType: 'update', summary: '开启北美跨境加速与私网直连', ticketId: 'OPS-202604250045' },
      { id: 'nh-012', changedAt: '2026-04-28 08:12', changedBy: 'TS-08 刘启', changeType: 'update', summary: '补充安全组 8080 探测规则', ticketId: 'OPS-202604280013' },
    ],
  },
  'tenant-003': {
    tenantId: 'tenant-003',
    tenantName: tenantMeta['tenant-003'].name,
    currentTicketId: 'OPS-202604270091',
    defaultLoginUrl: 'https://claw.arkclaw.com/tenant-003',
    customDomainEnabled: true,
    customDomain: 'staff.xinghe-tax.com',
    certMode: 'upload',
    certExpiresAt: '2026-05-06',
    redirectStrategy: '默认页',
    ingressTests: [
      { id: 'nt-021', label: 'DNS 解析测试', status: 'pass', detail: '解析记录正常' },
      { id: 'nt-022', label: '证书有效性', status: 'fail', detail: '证书将在 8 天后过期' },
    ],
    egressEnabled: true,
    egressAcceleration: false,
    egressNode: '未启用',
    egressWhitelist: ['api.feishu.cn'],
    egressIpWhitelist: [],
    egressRateLimit: '100 QPS / 20 Mbps',
    egressTests: [{ id: 'nt-023', label: 'HTTP 健康', status: 'pass', detail: '回调 URL 状态 200' }],
    vpcEnabled: false,
    vpcMethod: 'vpn',
    vpcId: '',
    vpcSubnet: '',
    vpcGateway: '',
    ourCidr: '172.23.0.0/24',
    authorizationUploaded: false,
    routeTable: [],
    securityGroups: [],
    vpcTests: [{ id: 'nt-024', label: '私网连通', status: 'warn', detail: '未启用私网出口' }],
    requiresApproval: false,
    history: [{ id: 'nh-021', changedAt: '2026-04-19 11:55', changedBy: 'DE-09 何宇', changeType: 'update', summary: '续传客户自有证书', ticketId: 'OPS-202604190071' }],
  },
};

let diagnosisWorkspaceState: OpsDiagnosisWorkspaceItem[] = [
  { tenantId: 'tenant-001', tenantName: tenantMeta['tenant-001'].name, activeAlerts: 1, lastIncidentAt: '2026-04-28 10:35', lastErrorRate: '0.24%', recommendedAction: '完成企微绑定后重跑员工同步' },
  { tenantId: 'tenant-002', tenantName: tenantMeta['tenant-002'].name, activeAlerts: 3, lastIncidentAt: '2026-04-28 09:58', lastErrorRate: '2.18%', recommendedAction: '排查 VPC 路由抖动并核对加速节点' },
  { tenantId: 'tenant-003', tenantName: tenantMeta['tenant-003'].name, activeAlerts: 2, lastIncidentAt: '2026-04-28 08:45', lastErrorRate: '1.04%', recommendedAction: '复测飞书登录凭证与证书过期风险' },
];

let diagnosisDetailState: Record<string, OpsDiagnosisDetail> = {
  'tenant-001': {
    tenantId: 'tenant-001',
    tenantName: tenantMeta['tenant-001'].name,
    currentTicketId: 'OPS-202604280001',
    checks: [
      { id: 'diag-001', label: '登录链接可达', status: 'pass', detail: '200 OK，首字节 286ms', suggestion: '保持当前 LB 配置' },
      { id: 'diag-002', label: '企微绑定健康', status: 'pass', detail: '模拟员工登录通过', suggestion: '可继续执行员工同步' },
      { id: 'diag-003', label: '配额健康', status: 'warn', detail: '标准席位已使用 78%', suggestion: '交付完成后提醒客户关注席位余量' },
    ],
    logs: [
      { id: 'log-001', time: '2026-04-28 10:33', code: 'WECOM_SYNC_TIMEOUT', user: 'system', skill: 'employee-sync', traceId: 'trace-yl-001', description: '同步任务等待客户侧确认可信域名' },
    ],
    tools: [
      { id: 'tool-001', tool: 'HTTP 健康', target: 'https://claw.yl-manufacture.com', summary: '200 OK', status: 'pass', detail: 'TLS 握手 82ms，整链路 344ms', checkedAt: '2026-04-28 10:34' },
    ],
    alerts: [{ id: 'alert-001', title: '员工同步待执行', level: 'P2', source: '交付流程', status: 'active', createdAt: '2026-04-28 10:35' }],
    sessions: [],
  },
  'tenant-002': {
    tenantId: 'tenant-002',
    tenantName: tenantMeta['tenant-002'].name,
    currentTicketId: 'OPS-202604280013',
    checks: [
      { id: 'diag-011', label: '登录链接可达', status: 'pass', detail: '200 OK', suggestion: '公网入口正常' },
      { id: 'diag-012', label: '私网出口健康', status: 'fail', detail: '10.4.12.6 丢包率 8%', suggestion: '检查 VPC 路由与安全组' },
      { id: 'diag-013', label: 'IM 绑定健康', status: 'warn', detail: '飞书回调失败', suggestion: '切换到 C2 重新测试飞书回调' },
      { id: 'diag-014', label: '最近 1h 错误率', status: 'fail', detail: '2.18%，主要集中在 login_callback', suggestion: '查看错误日志并复测回调' },
    ],
    logs: [
      { id: 'log-011', time: '2026-04-28 09:58', code: 'FEISHU_CALLBACK_502', user: 'u-1021', skill: 'login-gateway', traceId: 'trace-bc-9981', description: '飞书登录回调返回 502' },
      { id: 'log-012', time: '2026-04-28 09:41', code: 'VPC_RTT_SPIKE', user: 'system', skill: 'net-probe', traceId: 'trace-bc-9970', description: '私网测试目标 RTT 抖动超阈值' },
    ],
    tools: [
      { id: 'tool-011', tool: 'Ping', target: '10.4.12.6', summary: 'avg 198ms / loss 8%', status: 'fail', detail: '12/150 个请求超时', checkedAt: '2026-04-28 09:54' },
      { id: 'tool-012', tool: 'Traceroute', target: '10.4.12.6', summary: 'hop 8 抖动明显', status: 'warn', detail: '第 6-8 跳耗时波动 22ms -> 180ms', checkedAt: '2026-04-28 09:55' },
      { id: 'tool-013', tool: '证书检查', target: 'staff.beichen-tech.com', summary: '证书正常', status: 'pass', detail: '有效期至 2026-12-16', checkedAt: '2026-04-28 09:56' },
    ],
    alerts: [
      { id: 'alert-011', title: '私网出口 RTT 抖动超阈值', level: 'P1', source: '周巡检', status: 'active', createdAt: '2026-04-28 07:40' },
      { id: 'alert-012', title: '飞书回调失败率上升', level: 'P1', source: '错误率监控', status: 'active', createdAt: '2026-04-28 09:50' },
    ],
    sessions: [
      { id: 'sess-001', ticketId: 'OPS-202604250045', operator: 'TS-08 刘启', reason: '排查客户回调失败', startedAt: '2026-04-26 15:20', expectedEndAt: '2026-04-26 17:20', endedAt: '2026-04-26 16:08', status: 'ended' },
    ],
  },
  'tenant-003': {
    tenantId: 'tenant-003',
    tenantName: tenantMeta['tenant-003'].name,
    currentTicketId: 'OPS-202604270091',
    checks: [
      { id: 'diag-021', label: '飞书绑定健康', status: 'warn', detail: '凭证刷新成功但证书仅剩 8 天', suggestion: '尽快在 C3 更换证书并重新测试登录' },
      { id: 'diag-022', label: '登录链接可达', status: 'pass', detail: '200 OK', suggestion: '链路正常' },
    ],
    logs: [{ id: 'log-021', time: '2026-04-28 08:42', code: 'FEISHU_TOKEN_REFRESH', user: 'u-331', skill: 'login-gateway', traceId: 'trace-xh-101', description: '凭证刷新成功，仍有少量旧 token 失败' }],
    tools: [{ id: 'tool-021', tool: 'HTTP 健康', target: 'https://staff.xinghe-tax.com', summary: '200 OK', status: 'pass', detail: '响应 401ms', checkedAt: '2026-04-28 08:43' }],
    alerts: [{ id: 'alert-021', title: '证书 8 天后过期', level: 'P1', source: '证书巡检', status: 'active', createdAt: '2026-04-28 08:40' }],
    sessions: [],
  },
};

let inspectionRunsState: OpsInspectionRun[] = [
  { id: 'INSP-20260428-D', runType: 'daily', scheduledAt: '2026-04-28 02:00', startedAt: '2026-04-28 02:00', finishedAt: '2026-04-28 02:18', scannedTenants: 128, failedItems: 6, generatedTickets: 4, status: 'completed' },
  { id: 'INSP-20260428-M', runType: 'manual', scheduledAt: '2026-04-28 09:30', startedAt: '2026-04-28 09:30', finishedAt: '2026-04-28 09:36', scannedTenants: 12, failedItems: 3, generatedTickets: 1, status: 'completed' },
  { id: 'INSP-20260427-W', runType: 'weekly', scheduledAt: '2026-04-27 02:00', startedAt: '2026-04-27 02:00', finishedAt: '2026-04-27 02:45', scannedTenants: 128, failedItems: 14, generatedTickets: 8, status: 'completed' },
];

const inspectionRunResultsState: Record<string, OpsInspectionItemResult[]> = {
  'INSP-20260428-D': [
    { id: 'ir-001', tenantId: 'tenant-002', tenantName: tenantMeta['tenant-002'].name, itemCode: 'vpc_latency', itemName: '私网出口 RTT', result: 'fail', detail: 'RTT 抖动 > 150ms 且丢包 8%', generatedTicketId: 'OPS-202604280013', checkedAt: '2026-04-28 02:09' },
    { id: 'ir-002', tenantId: 'tenant-003', tenantName: tenantMeta['tenant-003'].name, itemCode: 'cert_expiry', itemName: '证书有效期', result: 'warn', detail: '剩余 8 天', generatedTicketId: 'OPS-202604270091', checkedAt: '2026-04-28 02:11' },
    { id: 'ir-003', tenantId: 'tenant-001', tenantName: tenantMeta['tenant-001'].name, itemCode: 'im_binding', itemName: '企微绑定状态', result: 'pass', detail: '员工模拟登录通过', checkedAt: '2026-04-28 02:13' },
  ],
  'INSP-20260428-M': [
    { id: 'ir-011', tenantId: 'tenant-003', tenantName: tenantMeta['tenant-003'].name, itemCode: 'login_health', itemName: '登录健康', result: 'warn', detail: '错误率 1.04%', checkedAt: '2026-04-28 09:35' },
  ],
  'INSP-20260427-W': [
    { id: 'ir-021', tenantId: 'tenant-002', tenantName: tenantMeta['tenant-002'].name, itemCode: 'cross_border_accel', itemName: '跨境加速 RTT', result: 'warn', detail: '北美节点抖动偏高', checkedAt: '2026-04-27 02:22' },
  ],
};

let inspectionRulesState: OpsInspectionRule[] = [
  { id: 'rule-001', name: '证书剩余有效期', description: '自定义域名证书剩余有效期不得低于 30 天', frequency: 'daily', threshold: '< 30 天告警；< 7 天 P0', autoCreateTicket: true, priority: 'P1', enabled: true },
  { id: 'rule-002', name: '私网出口 RTT', description: '私网出口对关键目标的丢包率与 RTT 波动', frequency: 'daily', threshold: 'loss > 3% 或 RTT > 120ms', autoCreateTicket: true, priority: 'P1', enabled: true },
  { id: 'rule-003', name: 'IM 绑定回调健康', description: '绑定平台回调 5xx 比例检测', frequency: 'weekly', threshold: '5xx > 0.5%', autoCreateTicket: true, priority: 'P2', enabled: true },
];

const customerOverviewState: Record<string, OpsCustomerOverview> = {
  'tenant-001': { tenantId: 'tenant-001', tenantName: tenantMeta['tenant-001'].name, uscc: tenantMeta['tenant-001'].uscc, salesOwner: tenantMeta['tenant-001'].salesOwner, accountManager: tenantMeta['tenant-001'].accountManager, health: 'warn', bindingSummary: '企微已接入，飞书待配置', networkSummary: '自定义域名测试中，未启用私网', latestInspection: '2026-04-28 02:13 通过', note: '客户 IT 只在工作日 10:00-18:00 配合回调测试。' },
  'tenant-002': { tenantId: 'tenant-002', tenantName: tenantMeta['tenant-002'].name, uscc: tenantMeta['tenant-002'].uscc, salesOwner: tenantMeta['tenant-002'].salesOwner, accountManager: tenantMeta['tenant-002'].accountManager, health: 'danger', bindingSummary: '企微正常，飞书回调异常', networkSummary: '私网直连已开，北美加速波动', latestInspection: '2026-04-28 02:09 失败', note: '客户内网走专线，VPC 规则每次变更都要双人复核。' },
  'tenant-003': { tenantId: 'tenant-003', tenantName: tenantMeta['tenant-003'].name, uscc: tenantMeta['tenant-003'].uscc, salesOwner: tenantMeta['tenant-003'].salesOwner, accountManager: tenantMeta['tenant-003'].accountManager, health: 'warn', bindingSummary: '飞书已接入', networkSummary: '证书即将到期，未启用私网', latestInspection: '2026-04-28 02:11 告警', note: '客户财务使用高峰在月初，证书变更要避开 1-3 日。' },
};

const customerChangesState: Record<string, OpsChangeRecord[]> = {
  'tenant-001': [{ id: 'chg-001', type: 'network', summary: '开启自定义域名并发起 ACME 证书签发', operator: 'DE-12 王澈', createdAt: '2026-04-28 10:38' }],
  'tenant-002': [
    { id: 'chg-011', type: 'network', summary: '新增 8080 端口探测规则', operator: 'TS-08 刘启', createdAt: '2026-04-28 08:12' },
    { id: 'chg-012', type: 'binding', summary: '飞书回调域名变更后测试失败', operator: 'TS-05 朱玥', createdAt: '2026-04-28 08:43' },
  ],
  'tenant-003': [{ id: 'chg-021', type: 'network', summary: '上传新证书待切换', operator: 'DE-09 何宇', createdAt: '2026-04-27 17:49' }],
};

let customerRemarksState: Record<string, OpsRemarkRecord[]> = {
  'tenant-001': [{ id: 'remark-001', author: 'DE-12 王澈', content: '客户企微管理员响应快，但法务审批外域名通常需要半天。', createdAt: '2026-04-28 09:42' }],
  'tenant-002': [{ id: 'remark-011', author: 'TS-08 刘启', content: 'VPC 路由冲突多发在周一早高峰，建议避开 09:00-10:30 变更。', createdAt: '2026-04-26 16:20' }],
  'tenant-003': [{ id: 'remark-021', author: 'DE-09 何宇', content: '客户财务团队偏向飞书桌面端，需优先保障桌面登录链路。', createdAt: '2026-04-18 14:00' }],
};

const statusFromLastResult = (last?: 'pass' | 'fail') => (last === 'fail' ? 'broken' : 'active');

const currentTenantId = 'tenant-001';

const slaByPriority = {
  P0: '2h',
  P1: '8h',
  P2: '24h',
  P3: '72h',
} as const;

const customerSuggestedPriorityByType: Record<TenantSupportRequestPayload['type'], OpsTicketDetail['priority']> = {
  tech_support: 'P2',
  onboarding: 'P2',
  business_consult: 'P3',
};

const supportRequestToOpsType: Record<TenantSupportRequestPayload['type'], OpsTicketDetail['type']> = {
  tech_support: 'tech_support',
  onboarding: 'im_binding',
  business_consult: 'business_consult',
};

const CUSTOMER_DAILY_TYPE_SUBMISSION_LIMIT = 3;

const normalizeCustomerRequestTitle = (value: string) => value.trim().replace(/\s+/g, '').toLowerCase();

const pickAutoAssignee = () => opsAssignees[opsTicketsState.length % opsAssignees.length];

export const opsMockApi = {
  getOpsTickets() {
    return delay(clone(opsTicketsState));
  },

  getOpsAssignableUsers() {
    return delay(clone(opsAssignees));
  },

  getOpsTenantOptions() {
    return delay(
      clone(
        Object.entries(tenantMeta).map(([value, item]) => ({
          value,
          label: item.name,
          uscc: item.uscc,
        })),
      ),
    );
  },

  getTenantSupportTickets() {
    const rows = opsTicketsState
      .filter((item) => item.tenantId === currentTenantId && item.customerVisible)
      .sort((left, right) => dayjs(right.updatedAt).valueOf() - dayjs(left.updatedAt).valueOf());
    return delay(clone(rows));
  },

  submitTenantSupportRequest(payload: TenantSupportRequestPayload) {
    const now = dayjs().format('YYYY-MM-DD HH:mm');
    const tenant = tenantMeta[currentTenantId];
    const suggestedPriority = customerSuggestedPriorityByType[payload.type];
    const ticketType = supportRequestToOpsType[payload.type];
    const normalizedTitle = normalizeCustomerRequestTitle(payload.title);
    const duplicateTicket = opsTicketsState.find(
      (item) =>
        item.tenantId === currentTenantId &&
        item.customerVisible &&
        item.status === 'unfinished' &&
        item.type === ticketType &&
        normalizeCustomerRequestTitle(item.title) === normalizedTitle,
    );
    if (duplicateTicket) {
      throw new Error(`已有未完结的相同工单 ${duplicateTicket.id}，请在原工单中跟进或补充材料。`);
    }
    const dailySameTypeCount = opsTicketsState.filter(
      (item) =>
        item.tenantId === currentTenantId &&
        item.customerVisible &&
        item.type === ticketType &&
        dayjs(item.createdAt).isSame(dayjs(now), 'day'),
    ).length;
    if (dailySameTypeCount >= CUSTOMER_DAILY_TYPE_SUBMISSION_LIMIT) {
      throw new Error(`同类工单每日最多提交 ${CUSTOMER_DAILY_TYPE_SUBMISSION_LIMIT} 次，请明天再提交或联系当前处理人。`);
    }

    const autoAssignee = pickAutoAssignee();
    const attachments = (payload.attachments ?? []).map((item, index) => ({
      id: `att-customer-${Date.now()}-${index}`,
      filename: item.filename,
      size: item.size,
    }));
    const ticket: OpsTicketDetail = {
      id: `OPS-${dayjs().format('YYYYMMDDHHmmss')}`,
      title: payload.title,
      tenantId: currentTenantId,
      tenantName: tenant.name,
      uscc: tenant.uscc,
      queue: 'support',
      type: ticketType,
      priority: suggestedPriority,
      status: 'unfinished',
      source: 'customer',
      assignee: autoAssignee.label,
      slaRemaining: slaByPriority[suggestedPriority],
      createdAt: now,
      updatedAt: now,
      watcher: true,
      priorityPending: false,
      suggestedPriority,
      description: payload.description,
      customerVisible: true,
      salesOwner: tenant.salesOwner,
      accountManager: tenant.accountManager,
      attachments,
      events: [
        {
          id: `evt-assign-${Date.now()}`,
          eventType: 'assign',
          actor: '系统轮询',
          actorRole: 'system',
          content: `按当前负载自动分派给 ${autoAssignee.label}（${autoAssignee.roleName}）`,
          isInternal: true,
          createdAt: now,
        },
        {
          id: `evt-${Date.now()}`,
          eventType: 'comment',
          actor: '当前客户管理员',
          actorRole: 'tenantAdmin',
          content: `客户提交工单，系统建议优先级 ${suggestedPriority}。`,
          isInternal: false,
          createdAt: now,
        },
        ...(attachments.length
          ? [
              {
                id: `evt-attachment-${Date.now()}`,
                eventType: 'attachment' as const,
                actor: '当前客户管理员',
                actorRole: 'tenantAdmin',
                content: `上传附件 ${attachments.map((item) => item.filename).join('、')}`,
                isInternal: false,
                createdAt: now,
              },
            ]
          : []),
      ],
    };
    opsTicketsState = [ticket, ...opsTicketsState];
    createNotification({
      role: 'deliveryOps',
      category: 'onboarding',
      priority: 'medium',
      title: '客户提交新工单',
      summary: `${tenant.name} 提交了「${payload.title}」，系统已自动分派交付运维。`,
      todo: true,
      actionable: true,
      actionUrl: `/ops/support-tickets/${ticket.id}`,
      actionLabel: '进入工单',
      sourceType: 'ticket',
      sourceId: ticket.id,
      templateTrigger: 'ticket.created.customer',
    });
    return delay(clone(ticket));
  },

  createOpsTicket(payload: {
    tenantId: string;
    title: string;
    type: OpsTicketDetail['type'];
    priority: OpsTicketDetail['priority'];
    description: string;
    assignee?: string;
    customerVisible?: boolean;
  }) {
    const tenant = tenantMeta[payload.tenantId as keyof typeof tenantMeta];

    if (!tenant) {
      return Promise.reject(new Error('未找到企业信息'));
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm');
    const ticketId = `OPS-${dayjs().format('YYYYMMDDHHmmss')}`;
    const requestedAssignee = payload.assignee ? opsAssignees.find((item) => item.label === payload.assignee) : undefined;
    const autoAssignee = requestedAssignee ?? pickAutoAssignee();
    const assignee = autoAssignee.label;
    const ticket: OpsTicketDetail = {
      id: ticketId,
      title: payload.title.trim(),
      tenantId: payload.tenantId,
      tenantName: tenant.name,
      uscc: tenant.uscc,
      queue: 'delivery',
      type: payload.type,
      priority: payload.priority,
      status: 'unfinished',
      source: 'system',
      assignee,
      slaRemaining: slaByPriority[payload.priority],
      createdAt: now,
      updatedAt: now,
      watcher: true,
      priorityPending: false,
      suggestedPriority: payload.priority,
      description: payload.description.trim(),
      customerVisible: Boolean(payload.customerVisible),
      salesOwner: tenant.salesOwner,
      accountManager: tenant.accountManager,
      attachments: [],
      events: [
        {
          id: `evt-assign-${Date.now()}`,
          eventType: 'assign' as const,
          actor: requestedAssignee ? '当前运维' : '系统轮询',
          actorRole: requestedAssignee ? 'R2.1' : 'system',
          content: requestedAssignee ? `创建时已指派给 ${assignee}` : `按当前负载自动分派给 ${assignee}`,
          isInternal: true,
          createdAt: now,
        },
        {
          id: `evt-create-${Date.now()}`,
          eventType: 'comment',
          actor: '当前运维',
          actorRole: 'R2.1',
          content: '交付运维手工创建工单。',
          isInternal: true,
          createdAt: now,
        },
      ],
    };

    opsTicketsState = [ticket, ...opsTicketsState];

    createNotification({
      role: 'deliveryOps',
      category: 'onboarding',
      priority: payload.priority === 'P0' || payload.priority === 'P1' ? 'high' : 'medium',
      title: '交付工单已自动分派',
      summary: `${tenant.name} · ${ticket.title}`,
      todo: true,
      actionable: true,
      actionUrl: `/ops/delivery-tickets/${ticket.id}`,
      actionLabel: '进入工单',
      sourceType: 'ticket',
      sourceId: ticket.id,
      templateTrigger: 'ticket.created.internal',
    });

    return delay(clone(ticket));
  },

  getOpsTicketDetail(id: string) {
    return delay(clone(opsTicketsState.find((item) => item.id === id)));
  },

  assignOpsTicket(id: string, assigneeLabel: string) {
    const targetAssignee = opsAssignees.find((item) => item.label === assigneeLabel);
    const createdAt = dayjs().format('YYYY-MM-DD HH:mm');
    opsTicketsState = opsTicketsState.map((item) =>
      item.id === id
        ? {
            ...item,
            assignee: assigneeLabel,
            updatedAt: createdAt,
            events: [
              {
                id: `evt-${Date.now()}`,
                eventType: 'assign',
                actor: 'OL-03 宋远',
                actorRole: 'R2.0',
                content: `将工单改派给 ${assigneeLabel}${targetAssignee ? `（${targetAssignee.roleName}）` : ''}`,
                isInternal: true,
                createdAt,
              },
              ...item.events,
            ],
          }
        : item,
    );
    return delay(clone(opsTicketsState.find((item) => item.id === id)));
  },

  resolveOpsTicket(id: string) {
    const createdAt = dayjs().format('YYYY-MM-DD HH:mm');
    opsTicketsState = opsTicketsState.map((item) =>
      item.id === id
        ? {
            ...item,
            status: 'resolved',
            updatedAt: createdAt,
            events: [
              { id: `evt-resolve-${Date.now()}`, eventType: 'status_change', actor: '当前运维', actorRole: 'R2.x', content: '工单已标记解决', isInternal: true, createdAt },
              ...item.events,
            ],
          }
        : item,
    );
    const ticket = opsTicketsState.find((item) => item.id === id);
    if (ticket?.customerVisible) {
      createNotification({
        role: 'tenantAdmin',
        category: 'onboarding',
        priority: 'medium',
        title: '工单已解决',
        summary: `${ticket.tenantName} 的问题已处理完成，请确认结果。`,
        todo: false,
        actionable: true,
        actionUrl: '/tenant/overview',
        actionLabel: '查看空间',
        sourceType: 'ticket',
        sourceId: id,
        templateTrigger: 'ticket.resolved',
      });
    }
    return delay(clone(ticket));
  },

  addOpsTicketComment(id: string, payload: { content: string; isInternal: boolean }) {
    opsTicketsState = opsTicketsState.map((item) =>
      item.id === id
        ? {
            ...item,
            updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
            events: [
              {
                id: `evt-${Date.now()}`,
                eventType: 'comment',
                actor: 'DE-12 王澈',
                actorRole: 'R2.1',
                content: payload.content,
                isInternal: payload.isInternal,
                createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
              },
              ...item.events,
            ],
          }
        : item,
    );
    return delay({ success: true });
  },

  getOpsBindingWorkspace() {
    return delay(clone(bindingWorkspaceState));
  },

  getOpsImBindingDetail(tenantId: string) {
    return delay(clone(bindingDetailState[tenantId]));
  },

  testOpsImBinding(tenantId: string, channel: string) {
    const detail = bindingDetailState[tenantId];
    const target = detail?.channels.find((item) => item.channel === channel);
    if (!detail || !target) {
      return delay(undefined);
    }
    target.lastTestAt = dayjs().format('YYYY-MM-DD HH:mm');
    target.lastTestResult = 'pass';
    target.status = 'active';
    target.checks = target.fields.slice(0, 3).map((field, index) => ({
      id: `test-${field.key}-${index}`,
      label: `${field.label} 校验`,
      status: 'pass',
      detail: '模拟调用成功',
    }));
    bindingWorkspaceState = bindingWorkspaceState.map((item) =>
      item.tenantId === tenantId
        ? {
            ...item,
            updatedAt: target.lastTestAt as string,
            statuses: { ...item.statuses, [channel]: statusFromLastResult(target.lastTestResult) },
          }
        : item,
    );
    return delay(clone(target));
  },

  saveOpsImBinding(tenantId: string, channel: string, config: Record<string, string>) {
    const detail = bindingDetailState[tenantId];
    const target = detail?.channels.find((item) => item.channel === channel);
    if (!detail || !target) {
      return delay(undefined);
    }
    target.config = { ...target.config, ...config };
    target.status = 'active';
    detail.history = [
      {
        id: `bh-${Date.now()}`,
        channel: target.channel,
        changedBy: '当前运维',
        changeType: 'update',
        changedAt: dayjs().format('YYYY-MM-DD HH:mm'),
        testResult: target.lastTestResult ?? 'pass',
        summary: '保存新版本配置',
      },
      ...detail.history,
    ];
    bindingWorkspaceState = bindingWorkspaceState.map((item) =>
      item.tenantId === tenantId
        ? {
            ...item,
            updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
            statuses: { ...item.statuses, [channel]: 'active' },
          }
        : item,
    );
    return delay(clone(target));
  },

  syncOpsBindingEmployees() {
    return delay({ synced: 286 });
  },

  getOpsNetworkWorkspace() {
    return delay(clone(networkWorkspaceState));
  },

  getOpsNetworkDetail(tenantId: string) {
    return delay(clone(networkDetailState[tenantId]));
  },

  testOpsNetwork(tenantId: string) {
    const detail = networkDetailState[tenantId];
    if (!detail) {
      return delay(undefined);
    }
    detail.ingressTests = detail.ingressTests.map((item) => ({ ...item, status: item.status === 'fail' ? 'pass' : item.status, detail: item.status === 'fail' ? '复测通过' : item.detail }));
    detail.egressTests = detail.egressTests.map((item) => ({ ...item, status: 'pass', detail: item.detail }));
    detail.vpcTests = detail.vpcTests.map((item) => ({ ...item, status: item.status === 'warn' ? 'pass' : item.status, detail: item.status === 'warn' ? '复测通过' : item.detail }));
    return delay(clone(detail));
  },

  saveOpsNetwork(tenantId: string, payload: Partial<OpsNetworkDetail>) {
    const current = networkDetailState[tenantId];
    if (!current) {
      return delay(undefined);
    }
    networkDetailState[tenantId] = { ...current, ...payload };
    networkDetailState[tenantId].history = [
      {
        id: `nh-${Date.now()}`,
        changedAt: dayjs().format('YYYY-MM-DD HH:mm'),
        changedBy: '当前运维',
        changeType: 'update',
        summary: '保存网络配置版本',
        ticketId: current.currentTicketId,
      },
      ...networkDetailState[tenantId].history,
    ];
    networkWorkspaceState = networkWorkspaceState.map((item) =>
      item.tenantId === tenantId
        ? {
            ...item,
            customDomain: networkDetailState[tenantId].customDomain,
            updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
          }
        : item,
    );
    return delay(clone(networkDetailState[tenantId]));
  },

  getOpsDiagnosisWorkspace() {
    return delay(clone(diagnosisWorkspaceState));
  },

  getOpsDiagnosisDetail(tenantId: string) {
    return delay(clone(diagnosisDetailState[tenantId]));
  },

  runOpsDiagnosisQuick(tenantId: string) {
    const detail = diagnosisDetailState[tenantId];
    if (!detail) {
      return delay(undefined);
    }
    detail.checks = detail.checks.map((item) => ({ ...item, detail: `${item.detail} · 已于 ${dayjs().format('HH:mm')} 重跑` }));
    return delay(clone(detail.checks));
  },

  closeOpsAlert(tenantId: string, alertId: string) {
    diagnosisDetailState[tenantId].alerts = diagnosisDetailState[tenantId].alerts.map((item) => (item.id === alertId ? { ...item, status: 'closed' } : item));
    return delay(clone(diagnosisDetailState[tenantId].alerts));
  },

  suppressOpsAlert(tenantId: string, alertId: string) {
    diagnosisDetailState[tenantId].alerts = diagnosisDetailState[tenantId].alerts.map((item) => (item.id === alertId ? { ...item, status: 'suppressed' } : item));
    return delay(clone(diagnosisDetailState[tenantId].alerts));
  },

  startOpsRemoteAssist(tenantId: string, payload: { ticketId: string; reason: string }) {
    const detail = diagnosisDetailState[tenantId];
    if (!detail) {
      return delay(undefined);
    }
    const session: OpsRemoteAssistSession = {
      id: `sess-${Date.now()}`,
      ticketId: payload.ticketId,
      operator: '当前运维',
      reason: payload.reason,
      startedAt: dayjs().format('YYYY-MM-DD HH:mm'),
      expectedEndAt: dayjs().add(2, 'hour').format('YYYY-MM-DD HH:mm'),
      status: 'active',
    };
    detail.sessions = [session, ...detail.sessions];
    createNotification({
      role: 'tenantAdmin',
      category: 'system',
      priority: 'high',
      title: '远程协助已开始',
      summary: `${tenantMeta[tenantId as keyof typeof tenantMeta]?.name ?? '当前企业'} 的远程协助会话已启动。`,
      todo: true,
      actionable: true,
      actionUrl: '/tenant/security',
      actionLabel: '查看详情',
      sourceType: 'remote_assist',
      sourceId: session.id,
      templateTrigger: 'impersonate.started',
    });
    return delay(clone(session));
  },

  endOpsRemoteAssist(tenantId: string, sessionId: string) {
    const detail = diagnosisDetailState[tenantId];
    if (!detail) {
      return delay(undefined);
    }
    detail.sessions = detail.sessions.map((item) => (item.id === sessionId ? { ...item, status: 'ended', endedAt: dayjs().format('YYYY-MM-DD HH:mm') } : item));
    return delay(clone(detail.sessions.find((item) => item.id === sessionId)));
  },

  getOpsInspectionRuns() {
    return delay(clone(inspectionRunsState));
  },

  getOpsInspectionRunDetail(id: string) {
    return delay(clone(inspectionRunResultsState[id] ?? []));
  },

  triggerOpsInspectionManual() {
    const run: OpsInspectionRun = {
      id: `INSP-${dayjs().format('YYYYMMDD-HHmm')}`,
      runType: 'manual',
      scheduledAt: dayjs().format('YYYY-MM-DD HH:mm'),
      startedAt: dayjs().format('YYYY-MM-DD HH:mm'),
      finishedAt: dayjs().add(6, 'minute').format('YYYY-MM-DD HH:mm'),
      scannedTenants: 8,
      failedItems: 1,
      generatedTickets: 1,
      status: 'completed',
    };
    inspectionRunsState = [run, ...inspectionRunsState];
    inspectionRunResultsState[run.id] = [
      {
        id: `ir-${Date.now()}`,
        tenantId: 'tenant-003',
        tenantName: tenantMeta['tenant-003'].name,
        itemCode: 'cert_expiry',
        itemName: '证书有效期',
        result: 'warn',
        detail: '剩余 8 天',
        generatedTicketId: 'OPS-202604270091',
        checkedAt: run.finishedAt as string,
      },
    ];
    return delay(clone(run));
  },

  getOpsInspectionRules() {
    return delay(clone(inspectionRulesState));
  },

  updateOpsInspectionRule(id: string, payload: Partial<OpsInspectionRule>) {
    inspectionRulesState = inspectionRulesState.map((item) => (item.id === id ? { ...item, ...payload } : item));
    return delay(clone(inspectionRulesState.find((item) => item.id === id)));
  },

  getOpsCustomerOverview(tenantId: string) {
    return delay(clone(customerOverviewState[tenantId]));
  },

  getOpsCustomerTickets(tenantId: string) {
    return delay(clone(opsTicketsState.filter((item) => item.tenantId === tenantId)));
  },

  getOpsCustomerChanges(tenantId: string) {
    return delay(clone(customerChangesState[tenantId] ?? []));
  },

  getOpsCustomerImpersonations(tenantId: string) {
    return delay(clone(diagnosisDetailState[tenantId]?.sessions ?? []));
  },

  getOpsCustomerRemarks(tenantId: string) {
    return delay(clone(customerRemarksState[tenantId] ?? []));
  },

  addOpsCustomerRemark(tenantId: string, content: string) {
    const remark: OpsRemarkRecord = {
      id: `remark-${Date.now()}`,
      author: '当前运维',
      content,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
    };
    customerRemarksState[tenantId] = [remark, ...(customerRemarksState[tenantId] ?? [])];
    return delay(clone(remark));
  },
};
