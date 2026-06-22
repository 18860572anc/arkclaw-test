export type ConsoleRole = 'tenant' | 'agent';

export interface MiniProgramMetric {
  label: string;
  value: string;
  tone: 'blue' | 'green' | 'orange' | 'purple';
}

export interface MiniProgramListItem {
  title: string;
  subtitle: string;
  meta: string;
  status: string;
}

export interface MiniProgramSeatOverview {
  name: string;
  purchased: number;
  assigned: number;
}

export type MiniProgramSeatProductKey = 'lite' | 'standard' | 'pro' | 'ultimate';

export interface MiniProgramSeatProduct {
  key: MiniProgramSeatProductKey;
  name: string;
  codingPlanName: string;
  monthlyPrice: number;
  codingPlanMonthlyPrice: number;
  summary: string;
  tone: 'blue' | 'green' | 'orange' | 'purple';
}

export interface MiniProgramApiKeyRecord {
  name: string;
  keyPreview: string;
  group: string;
  status: string;
  todayCost: string;
  monthCost: string;
  rateLimit: string;
  quotaLimit: string;
  expiresAt: string;
  alert?: string;
}

export interface MiniProgramBalanceSummary {
  amount: string;
  monthlySpend: string;
  pendingPay: string;
  invoiceable: string;
  tip: string;
}

export interface MiniProgramProfileQuickAction {
  title: string;
  subtitle: string;
  icon: string;
  action: string;
}

export interface MiniProgramProfileMenuItem {
  title: string;
  icon: string;
  action: string;
}

export interface MiniProgramProfileSummary {
  userName: string;
  welcomeText: string;
  walletTitle: string;
  walletAction: string;
  walletLabel: string;
  walletAmount: string;
  quickActions: MiniProgramProfileQuickAction[];
  menuItems: MiniProgramProfileMenuItem[];
}

export interface MiniProgramModule {
  key: string;
  title: string;
  summary: string;
  metrics: MiniProgramMetric[];
  actions: string[];
  listTitle: string;
  list: MiniProgramListItem[];
  notificationTitle?: string;
  notifications?: MiniProgramListItem[];
  seats?: MiniProgramSeatOverview[];
  apiKeys?: MiniProgramApiKeyRecord[];
  alerts?: string[];
  balance?: MiniProgramBalanceSummary;
  profile?: MiniProgramProfileSummary;
}

export const tenantSeatProducts: MiniProgramSeatProduct[] = [
  { key: 'lite', name: '轻量版', codingPlanName: 'Coding Plan Lite', monthlyPrice: 210, codingPlanMonthlyPrice: 120, summary: '轻量团队试用', tone: 'blue' },
  { key: 'standard', name: '标准版', codingPlanName: 'Coding Plan Lite', monthlyPrice: 430, codingPlanMonthlyPrice: 120, summary: '自动化办公与知识检索', tone: 'green' },
  { key: 'pro', name: '高级版', codingPlanName: 'Coding Plan Pro', monthlyPrice: 860, codingPlanMonthlyPrice: 600, summary: '高阶数据处理与视觉识别', tone: 'orange' },
  { key: 'ultimate', name: '旗舰版', codingPlanName: 'Coding Plan Pro', monthlyPrice: 1720, codingPlanMonthlyPrice: 600, summary: '多智能体协同与复杂循环任务', tone: 'purple' },
];

export const tenantModules: MiniProgramModule[] = [
  {
    key: 'overview',
    title: '席位概览',
    summary: '查看各版本席位的购买与分配情况。',
    metrics: [],
    actions: [],
    listTitle: '席位概览',
    list: [],
    seats: [
      { name: '轻量版（含 Team Lite）', purchased: 8, assigned: 0 },
      { name: '标准版', purchased: 0, assigned: 0 },
      { name: '高级版（含 Team Pro）', purchased: 2, assigned: 1 },
      { name: '旗舰版', purchased: 0, assigned: 0 },
    ],
  },
  {
    key: 'profile',
    title: '个人中心',
    summary: '查看钱包、订单、消息和账户管理。',
    metrics: [
      { label: '待支付', value: '1', tone: 'orange' },
      { label: '本月消费', value: '¥952', tone: 'purple' },
      { label: '未读通知', value: '4', tone: 'blue' },
    ],
    actions: [],
    listTitle: '消费记录',
    list: [
      { title: '高级版席位增购', subtitle: '订单 ORD-20260521-001 / 待支付', meta: '¥12,800', status: '待支付' },
      { title: 'Coding Plan 加购', subtitle: '订单 ORD-20260518-003 / 已支付', meta: '¥3,600', status: '已支付' },
    ],
    notificationTitle: '通知',
    notifications: [
      { title: '订单已支付', subtitle: '高级版席位增购订单支付成功', meta: '10:32', status: '未读' },
      { title: '员工同步完成', subtitle: '新增 3 名员工，停用 1 名员工', meta: '09:15', status: '已读' },
    ],
    balance: {
      amount: '¥7,412',
      monthlySpend: '¥952',
      pendingPay: '1 笔',
      invoiceable: '',
      tip: '账户余额用于席位续费、API 调用和后续账单抵扣。',
    },
    profile: {
      userName: '李磊',
      welcomeText: '欢迎回来',
      walletTitle: '我的钱包',
      walletAction: '去充值',
      walletLabel: '余额',
      walletAmount: '¥0.00',
      quickActions: [
        { title: '我的订单', subtitle: '查看最近的订单', icon: 'clipboard', action: '我的订单' },
        { title: '消息中心', subtitle: '查看通知和消息', icon: 'notification', action: '消息中心' },
      ],
      menuItems: [
        { title: '发票管理', icon: 'receipt', action: '发票管理' },
        { title: '设置与帮助', icon: 'settings', action: '设置与帮助' },
      ],
    },
  },
  {
    key: 'api-keys',
    title: 'API',
    summary: '查看 API 余额、用量、异常和密钥状态；完整密钥创建与配置请前往 PC 后台。',
    metrics: [
      { label: 'API 可用余额', value: '¥7,412', tone: 'blue' },
      { label: '启用密钥', value: '1', tone: 'green' },
      { label: '今日费用', value: '¥18.50', tone: 'orange' },
      { label: '近 30 天费用', value: '¥952.90', tone: 'purple' },
    ],
    actions: ['刷新状态'],
    listTitle: 'API Key 状态',
    list: [
      { title: '招聘外呼自动化', subtitle: 'sk-6ee...5959 / 默认分组', meta: '今日 ¥18.50 · 近30天 ¥952.90', status: '启用' },
      { title: '财务测试', subtitle: 'sk-a12...84fd / 财务测试', meta: '今日 ¥0 · 近30天 ¥36.20', status: '禁用' },
    ],
    apiKeys: [
      {
        name: '招聘外呼自动化',
        keyPreview: 'sk-6ee...5959',
        group: '默认分组',
        status: '启用',
        todayCost: '¥18.50',
        monthCost: '¥952.90',
        rateLimit: '60 req/min',
        quotaLimit: '¥500/月',
        expiresAt: '2026-07-31',
        alert: '今日消费高于近 7 日均值，请确认调用来源',
      },
      {
        name: '财务测试',
        keyPreview: 'sk-a12...84fd',
        group: '财务测试',
        status: '禁用',
        todayCost: '¥0',
        monthCost: '¥36.20',
        rateLimit: '30 req/min',
        quotaLimit: '无限制',
        expiresAt: '2026-06-15',
      },
    ],
    alerts: [
      'API 可用余额低于 ¥10,000，建议关注近期调用消耗。',
      '招聘外呼自动化 Key 今日消费异常，可在移动端紧急禁用。',
    ],
  },
  {
    key: 'consult',
    title: '工单与咨询',
    summary: '提交咨询、查看工单处理进度。',
    metrics: [
      { label: '处理中', value: '2', tone: 'orange' },
      { label: '已解决', value: '18', tone: 'green' },
      { label: '待回复', value: '1', tone: 'purple' },
    ],
    actions: ['新建工单', '补充材料'],
    listTitle: '最近工单',
    list: [
      { title: '知识库无法同步', subtitle: '工单 TK-20260521-001', meta: '2 小时前', status: '处理中' },
      { title: '席位增购咨询', subtitle: '工单 TK-20260520-004', meta: '已回复', status: '待确认' },
    ],
  },
];

export const agentModules: MiniProgramModule[] = [
  {
    key: 'dashboard',
    title: '工作台',
    summary: '查看代理经营总览、待办和核心数据。',
    metrics: [
      { label: '成交额', value: '¥328k', tone: 'blue' },
      { label: '客户数', value: '42', tone: 'green' },
      { label: '待办', value: '8', tone: 'orange' },
    ],
    actions: ['查看待办', '新增客户'],
    listTitle: '今日待办',
    list: [
      { title: '对公审核待确认', subtitle: '北辰科技订单', meta: '¥18,000', status: '待处理' },
      { title: '交付工单待跟进', subtitle: '云岭制造开通任务', meta: 'P1', status: '进行中' },
    ],
  },
  {
    key: 'balance',
    title: '进货与余额',
    summary: '查看余额、库存、回款和佣金可提现金额。',
    metrics: [
      { label: '余额', value: '¥128k', tone: 'blue' },
      { label: '销售回款', value: '¥86k', tone: 'green' },
      { label: '可提现佣金', value: '¥12k', tone: 'purple' },
    ],
    actions: ['立即进货', '提现'],
    listTitle: '账户流水',
    list: [
      { title: '进货充值', subtitle: '对公转账入账', meta: '+¥50,000', status: '已入账' },
      { title: '余额进货扣减', subtitle: '客户订单开通', meta: '-¥8,800', status: '已扣减' },
    ],
  },
  {
    key: 'coupons',
    title: '代金券管理',
    summary: '查看代理账户下代金券、可用余额和抵扣记录。',
    metrics: [
      { label: '可用券', value: '5', tone: 'green' },
      { label: '可用余额', value: '¥12k', tone: 'blue' },
      { label: '已抵扣', value: '¥8k', tone: 'purple' },
    ],
    actions: ['查看券包'],
    listTitle: '代金券',
    list: [
      { title: '代理补贴券', subtitle: '剩余 ¥5,000', meta: '2026-06-30 到期', status: '可用' },
      { title: '新客开通券', subtitle: '剩余 ¥7,000', meta: '限新客户', status: '可用' },
    ],
  },
  {
    key: 'tenants',
    title: '企业管理',
    summary: '查看代理客户、状态、余额和跟进负责人。',
    metrics: [
      { label: '客户', value: '42', tone: 'blue' },
      { label: '已成交', value: '28', tone: 'green' },
      { label: '待跟进', value: '6', tone: 'orange' },
    ],
    actions: ['新增企业', '筛选客户'],
    listTitle: '客户列表',
    list: [
      { title: '云岭制造', subtitle: '制造业 / 赵欣', meta: '成交 ¥32,800', status: '已成交' },
      { title: '北辰科技', subtitle: '软件服务 / 唐凯', meta: '待开票', status: '服务中' },
    ],
  },
  {
    key: 'tickets',
    title: '工单管理',
    summary: '查看交付工单和支持工单处理进度。',
    metrics: [
      { label: '交付中', value: '5', tone: 'orange' },
      { label: '支持中', value: '3', tone: 'purple' },
      { label: '已完成', value: '21', tone: 'green' },
    ],
    actions: ['查看工单', '催办'],
    listTitle: '工单',
    list: [
      { title: '云岭制造开通', subtitle: '交付工单 OPS-20260521-001', meta: 'P1', status: '处理中' },
      { title: '北辰科技知识库异常', subtitle: '支持工单 SUP-20260520-002', meta: '已响应', status: '跟进中' },
    ],
  },
  {
    key: 'orders',
    title: '订单与账单',
    summary: '移动端查看订单、发票和对公审核状态。',
    metrics: [
      { label: '本月订单', value: '18', tone: 'blue' },
      { label: '待支付', value: '2', tone: 'orange' },
      { label: '待开票', value: '4', tone: 'purple' },
    ],
    actions: ['查看订单', '对公审核'],
    listTitle: '订单',
    list: [
      { title: '北辰科技席位采购', subtitle: 'ORD-20260521-001', meta: '¥18,000', status: '待审核' },
      { title: '云岭制造增购', subtitle: 'ORD-20260518-005', meta: '¥32,800', status: '已支付' },
    ],
  },
  {
    key: 'leads',
    title: '咨询留资管理',
    summary: '查看官网咨询、分配销售和跟进状态。',
    metrics: [
      { label: '新线索', value: '9', tone: 'orange' },
      { label: '跟进中', value: '16', tone: 'blue' },
      { label: '已转化', value: '5', tone: 'green' },
    ],
    actions: ['分配销售', '查看线索'],
    listTitle: '线索',
    list: [
      { title: '杭州数智财税', subtitle: '企业知识库咨询', meta: '15:20', status: '待分配' },
      { title: '苏州启明制造', subtitle: '审批流接入咨询', meta: '跟进 2 次', status: '跟进中' },
    ],
  },
  {
    key: 'sales',
    title: '销售管理',
    summary: '查看代理销售、客户归属和业绩。',
    metrics: [
      { label: '销售', value: '8', tone: 'blue' },
      { label: '本月成交', value: '¥126k', tone: 'green' },
      { label: '待交接', value: '1', tone: 'orange' },
    ],
    actions: ['查看销售', '新增销售'],
    listTitle: '销售排行',
    list: [
      { title: '陈默', subtitle: '成交 ¥68,000', meta: '12 个客户', status: '在职' },
      { title: '林嘉', subtitle: '成交 ¥42,000', meta: '8 个客户', status: '在职' },
    ],
  },
  {
    key: 'withdrawals',
    title: '提现流水',
    summary: '查看销售回款提现和佣金提现流水。',
    metrics: [
      { label: '提现中', value: '¥86k', tone: 'orange' },
      { label: '已打款', value: '¥42k', tone: 'green' },
      { label: '可提现', value: '¥12k', tone: 'purple' },
    ],
    actions: ['发起提现', '查看明细'],
    listTitle: '提现记录',
    list: [
      { title: '销售回款提现', subtitle: '启明工业等客户订单', meta: '¥86,000', status: '处理中' },
      { title: '佣金提现', subtitle: '12 笔订单佣金', meta: '¥12,400', status: '可打款' },
    ],
  },
  {
    key: 'commission-rules',
    title: '佣金规则',
    summary: '查看当前代理佣金规则和生效时间。',
    metrics: [
      { label: '默认比例', value: '5%', tone: 'blue' },
      { label: '生效规则', value: '2', tone: 'green' },
      { label: '待审核', value: '0', tone: 'orange' },
    ],
    actions: ['查看规则'],
    listTitle: '规则',
    list: [
      { title: '标准销售分佣', subtitle: '客户实付金额 × 5%', meta: '长期有效', status: '生效中' },
      { title: '活动客户奖励', subtitle: '首单额外奖励', meta: '2026-Q2', status: '生效中' },
    ],
  },
  {
    key: 'staff',
    title: '员工账号',
    summary: '管理代理后台员工账号、角色和状态。',
    metrics: [
      { label: '员工', value: '12', tone: 'blue' },
      { label: '管理员', value: '2', tone: 'purple' },
      { label: '停用', value: '1', tone: 'orange' },
    ],
    actions: ['新增员工', '查看权限'],
    listTitle: '员工',
    list: [
      { title: '陈默', subtitle: '代理管理员', meta: '最近登录 10:20', status: '启用' },
      { title: '孟琪', subtitle: '财务', meta: '最近登录 昨日', status: '启用' },
    ],
  },
  {
    key: 'notifications',
    title: '通知中心',
    summary: '查看订单、工单、提现和系统通知。',
    metrics: [
      { label: '未读', value: '6', tone: 'orange' },
      { label: '今日', value: '9', tone: 'blue' },
      { label: '待处理', value: '3', tone: 'purple' },
    ],
    actions: ['全部已读'],
    listTitle: '通知',
    list: [
      { title: '提现申请已提交', subtitle: '销售回款提现 ¥86,000', meta: '10:20', status: '未读' },
      { title: '工单状态更新', subtitle: '云岭制造开通工单进入验证', meta: '09:45', status: '未读' },
    ],
  },
];

export const tenantMiniProgramTabs: MiniProgramModule[] = tenantModules.filter((item) =>
  ['overview', 'profile'].includes(item.key),
);

export const agentMiniProgramTabs: MiniProgramModule[] = agentModules.filter((item) =>
  ['dashboard', 'balance', 'tenants', 'notifications'].includes(item.key),
);
