export type RoleKey = 'platformAdmin' | 'finance' | 'deliveryAdmin' | 'deliveryOps' | 'salesAdmin' | 'sales' | 'tenantAdmin';

export type NotificationRole = RoleKey;
export type NotificationCategory = 'order' | 'review' | 'onboarding' | 'lead' | 'commission' | 'system';
export type NotificationPriority = 'high' | 'medium' | 'low';
export type NotificationFilterStatus = 'all' | 'unread' | 'todo';

export interface NotificationInboxItem {
  id: string;
  userKey: string;
  role: NotificationRole;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  summary: string;
  read: boolean;
  todo: boolean;
  actionable: boolean;
  actionUrl: string;
  actionLabel: string;
  sourceType: string;
  sourceId: string;
  templateTrigger?: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationListQuery {
  role: NotificationRole;
  status?: NotificationFilterStatus;
  categories?: NotificationCategory[];
  page?: number;
  pageSize?: number;
}

export interface NotificationListResult {
  items: NotificationInboxItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface NotificationPreference {
  role: NotificationRole;
  leadAssigned: boolean;
  customerPaid: boolean;
  commissionArrived: boolean;
  maintenance: boolean;
  openingTask: boolean;
  securityAlert: boolean;
  updatedAt: string;
}

export type SeatLevel = 'lite' | 'standard' | 'pro' | 'ultimate';

export interface Tenant {
  id: string;
  name: string;
  code: string;
  industry: string;
  status: 'normal' | 'paused' | 'arrears';
  ownerSales: string;
  volcSpaceId: string;
}

export interface Metric {
  label: string;
  value: string | number;
  suffix?: string;
  trend?: string;
}

export interface SeatPlan {
  level: SeatLevel;
  name: string;
  quota: number;
  used: number;
  active: number;
  maxApplyPerEmployee: number;
  expiresAt?: string;
}

export type TenantOpeningStatusCode =
  | 'pending_payment'
  | 'pending_review'
  | 'pending_assign'
  | 'pending_handle'
  | 'purchasing'
  | 'waiting_confirm'
  | 'completed'
  | 'failed';

export interface TenantOpeningStatus {
  code: TenantOpeningStatusCode;
  text: string;
  orderId: string;
  taskId: string;
  updatedAt: string;
  description: string;
  failureReason?: string;
}

export interface ModelConfig {
  level: SeatLevel;
  name: string;
  defaultModel: string;
  plan: string;
  optionalModels: number;
  tokenLimit: string;
  minuteTokenLimit?: number;
  dailyTokenLimit?: number;
  sources?: ModelSource[];
}

export interface AdvancedSetting {
  key: string;
  label: string;
  enabled: boolean;
}

export interface ModelSource {
  id: string;
  plan: string;
  model: string;
  isDefault: boolean;
}

export interface OverviewGuide {
  authCallbackUrl: string;
  employeeLoginUrl: string;
}

export type TenantGuideVideoLevel = 'basic' | 'advanced';

export interface TenantGuideVideo {
  id: string;
  title: string;
  level: TenantGuideVideoLevel;
  summary: string;
  href: string;
  source: string;
  duration?: string;
}

export type TenantDocLinkType = 'internal' | 'external';

export interface TenantDocLink {
  id: string;
  title: string;
  summary: string;
  href: string;
  type: TenantDocLinkType;
}

export interface OverviewData {
  tenant: Tenant;
  guide: OverviewGuide;
  metrics: Metric[];
  modelConfigs: ModelConfig[];
  seats: SeatPlan[];
  settings: AdvancedSetting[];
  networkStatus: 'not_configured' | 'configuring' | 'ready';
}

export interface TenantNetworkPublicIngress {
  loginUrl: string;
  customDomainEnabled: boolean;
  customDomain: string;
  certificateName: string;
  certificateStatus: 'configured' | 'not_configured';
  redirectStatus: string;
}

export interface TenantNetworkPublicEgress {
  enabled: boolean;
  accelerationEnabled: boolean;
  accelerationDomain: string;
}

export interface TenantNetworkPrivateEgress {
  enabled: boolean;
  project: string;
  vpc: string;
  zones: string[];
  securityGroup: string;
  targetIpRange: string;
  dnsResolutionEnabled: boolean;
}

export interface TenantNetworkOptions {
  certificateOptions: string[];
  projectOptions: string[];
  vpcOptions: string[];
  zoneOptions: string[];
  securityGroupOptions: string[];
}

export interface TenantNetworkConfig {
  publicIngress: TenantNetworkPublicIngress;
  publicEgress: TenantNetworkPublicEgress;
  privateEgress: TenantNetworkPrivateEgress;
  options: TenantNetworkOptions;
}

export type LaunchAuthMethod = 'feishu' | 'wecom' | 'dingtalk' | 'standard' | 'platform';

export interface LaunchSpaceSetup {
  authMethod: LaunchAuthMethod;
  projectName: string;
  regionName: string;
  feishuAppId: string;
  feishuAppSecret: string;
  wecomCorpId: string;
  wecomAgentId: string;
  wecomAgentSecret: string;
  dingtalkAppId: string;
  dingtalkClientId: string;
  dingtalkClientSecret: string;
}

export type BrandCustomizationStatus = 'active' | 'draft';

export interface BrandAsset {
  name: string;
  previewUrl?: string;
  tone: 'galaxy' | 'aurora' | 'logo';
}

export interface BrandCustomization {
  id: string;
  name: string;
  status: BrandCustomizationStatus;
  companyName: string;
  primarySlogan: string;
  secondarySlogan: string;
  docLinkLabel: string;
  docLinkUrl: string;
  loginBackground: BrandAsset | null;
  homeBanner: BrandAsset | null;
  welcomeTitle: string;
  helperDescription: string;
  userSideLogo: BrandAsset | null;
  securityLinkLabel: string;
  securityLinkUrl: string;
  updatedAt: string;
}

export interface BrandCustomizationPayload {
  name: string;
  companyName: string;
  primarySlogan: string;
  secondarySlogan: string;
  docLinkLabel: string;
  docLinkUrl: string;
  loginBackground: BrandAsset | null;
  homeBanner: BrandAsset | null;
  welcomeTitle: string;
  helperDescription: string;
  userSideLogo: BrandAsset | null;
  securityLinkLabel: string;
  securityLinkUrl: string;
}

export interface WorkbenchToggleItem {
  key: string;
  label: string;
  enabled: boolean;
  hint?: string;
}

export interface WorkbenchChannelItem {
  key: string;
  label: string;
  enabled: boolean;
  bindStatus: '已绑定' | '未绑定';
  bindHint?: string;
}

export interface WorkbenchConfig {
  conversationAbilities: WorkbenchToggleItem[];
  scheduledTaskEnabled: boolean;
  messageChannels: WorkbenchChannelItem[];
  basicSettings: WorkbenchToggleItem[];
  quickCommandEnabled: boolean;
  personaShortcutEnabled: boolean;
  skillQuickInstallEnabled: boolean;
  applicationModeEnabled: boolean;
}

export interface ClawInstance {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'recycled';
  tags: string[];
  owner: string;
  email: string;
  group: string;
  seatLevel: SeatLevel;
  model: string;
  autoBackup: boolean;
}

export type TemplateSource = 'public' | 'custom';

export interface ClawTemplate {
  id: string;
  name: string;
  description: string;
  source: TemplateSource;
  seatLevel: SeatLevel;
  mirror: string;
  coverStyle: string;
  recommendedModel: string;
  plugins: string[];
  skills: string[];
  soulMode: 'preset' | 'custom';
  soulTemplateId?: string;
  soulContent: string;
  agentContent: string;
  createdAt: string;
}

export interface TemplateRolePreset {
  id: string;
  name: string;
  content: string;
}

export interface TemplatePreset {
  roleTemplates: TemplateRolePreset[];
  pluginOptions: string[];
  skillOptions: string[];
  mirrorOptions: string[];
  defaultAgentContent: string;
}

export interface TemplateDispatchCandidate {
  id: string;
  name: string;
  email: string;
  group: string;
  avatarText: string;
}

export interface CreateTemplatePayload {
  name: string;
  description: string;
  seatLevel: SeatLevel;
  mirror: string;
  soulMode: 'preset' | 'custom';
  soulTemplateId?: string;
  soulContent: string;
  plugins: string[];
  skills: string[];
  agentContent: string;
}

export interface DispatchTemplatePayload {
  source: TemplateSource;
  templateId: string;
  employeeIds: string[];
}

export interface EmployeeQuota {
  id: string;
  name: string;
  email: string;
  source: string;
  lite: string;
  standard: string;
  pro: string;
  ultimate: string;
  group: string;
}

export interface OrderPriceAdjustmentRecord {
  beforeAmount: number;
  afterAmount: number;
  deltaAmount: number;
  reason: string;
  adjustedBy: string;
  adjustedRole: string;
  adjustedAt: string;
}

export interface BillingOrder {
  id: string;
  type: 'seat_sub';
  orderType?: string;
  bundleLines?: OrderBundleLine[];
  amount: number;
  originalAmount?: number;
  couponId?: string;
  couponName?: string;
  couponDiscountAmount?: number;
  couponUsageStatus?: 'none' | 'applied' | 'released';
  paymentMethod: 'wechat' | 'alipay' | 'bank_transfer';
  status: 'pending' | 'pending_review' | 'paid' | 'refunded' | 'cancelled';
  createdAt: string;
  paymentExpiresAt?: string;
  paymentExpiredAt?: string;
  priceAdjustment?: OrderPriceAdjustmentRecord;
  proofName?: string;
  uploadedAmount?: number;
  reviewStatus?: AdminBankTransferReviewStatus;
  reviewReason?: string;
  bankSerialNo?: string;
  openingTaskId?: string;
  openingStatus?: AdminOpeningTaskStatus;
}

export interface SalesAssistedOrderResult {
  order: BillingOrder;
  orderId: string;
  amount: number;
  paymentMethod?: BillingOrder['paymentMethod'];
  qrCodeLabel?: string;
  tenantName: string;
  couponName: string;
  discountAmount: number;
  payableAmount: number;
}

export interface OrderBundleLine {
  id: string;
  productType: 'seat' | 'coding_plan';
  productName: string;
  specLabel?: string;
  quantity: number;
  unit: '席' | '份';
  cycleMonths?: number;
  amount: number;
}

export interface BillingInvoiceRecord {
  id: string;
  orderId: string;
  amount: number;
  title: string;
  taxNo: string;
  type: 'electronic_vat_general';
  status: 'pending' | 'issued' | 'rejected';
  source: 'customer_request' | 'finance_manual';
  receiverEmail: string;
  appliedAt: string;
  issuedAt?: string;
  rejectReason?: string;
  fileName?: string;
  fileUrl?: string;
}

export interface BillingInvoiceDraft {
  orderId: string;
  title: string;
  taxNo: string;
  receiverEmail: string;
}

export type BillingContractType = 'quote' | 'order';
export type BillingContractStatus = 'pending' | 'active' | 'expired' | 'voided';

export interface BillingContractRecord {
  id: string;
  tenantId: string;
  contractNo: string;
  type: BillingContractType;
  name: string;
  validFrom: string;
  validTo: string;
  createdAt: string;
  completedAt?: string;
  status: BillingContractStatus;
  remark?: string;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
  fileName: string;
  fileUrl: string;
}

export interface BillingContractDraft {
  contractNo: string;
  type: BillingContractType;
  name: string;
  validFrom: string;
  validTo: string;
  completedAt?: string;
  status: BillingContractStatus;
  remark?: string;
  fileName: string;
}

export interface UsagePoint {
  date: string;
  token: number;
  gmv?: number;
  commission?: number;
}

export type TenantWalletPaymentMethod = 'bank_transfer' | 'wechat' | 'alipay';

export interface TenantWalletCollectionAccount {
  companyName: string;
  bankName: string;
  branchName: string;
  accountNo: string;
  remarkCode: string;
  note: string;
}

export interface TenantWalletSummary {
  balance: number;
  totalTopup: number;
  collectionAccount: TenantWalletCollectionAccount;
}

export interface TenantWalletTopupOrder {
  id: string;
  amount: number;
  paymentMethod: TenantWalletPaymentMethod;
  status: 'completed';
  createdAt: string;
  proofFileName?: string;
  uniqueRemarkCode: string;
}

export type TenantWalletLedgerType = 'topup';

export interface TenantWalletLedgerRecord {
  id: string;
  type: TenantWalletLedgerType;
  businessLabel: string;
  amount: number;
  balanceAfter: number;
  createdAt: string;
  remark: string;
  paymentMethod?: TenantWalletPaymentMethod;
  proofFileName?: string;
  remarkCode?: string;
  paymentCodeLabel?: string;
  collectionAccount?: TenantWalletCollectionAccount;
}

export interface BillingData {
  balance: number;
  wallet: TenantWalletSummary;
  tokenQuota: number;
  validUntil: string;
  usage: UsagePoint[];
  orders: BillingOrder[];
  invoices: BillingInvoiceRecord[];
  contracts: BillingContractRecord[];
  availableCoupons?: CouponRecord[];
  couponUsages?: CouponUsageRecord[];
}

export type CouponStatus = 'pending' | 'active' | 'used' | 'exhausted' | 'expired' | 'disabled';
export type CouponUsageStatus = 'reserved' | 'confirmed' | 'released';
export type CouponDiscountScope = 'order' | 'seat' | 'coding_plan';
export type CouponBenefitType = 'coupon' | 'voucher';

export interface CouponRecord {
  id: string;
  name: string;
  tenantId: string;
  tenantName: string;
  benefitType?: CouponBenefitType;
  type: 'quota_discount';
  discountScope?: CouponDiscountScope;
  discountRate: number;
  totalDiscountQuota: number;
  usedDiscountQuota: number;
  remainingDiscountQuota: number;
  effectiveAt: string;
  expiresAt: string;
  status: CouponStatus;
  issuedBy: string;
  issuedAt: string;
  disabledBy?: string;
  disabledAt?: string;
  remark: string;
  usageMode?: string;
  thresholdRule?: string;
  orderTypeSummary?: string;
  applicableAccounts?: string[];
  applicableProducts?: CouponApplicableProduct[];
}

export interface CouponUsageRecord {
  id: string;
  couponId: string;
  orderId: string;
  tenantId: string;
  originalAmount: number;
  discountAmount: number;
  payableAmount: number;
  status: CouponUsageStatus;
  usedAt: string;
  accountId?: string;
  billingPeriod?: string;
  productName?: string;
  changeType?: string;
  billDetailNo?: string;
}

export interface CouponApplicableProduct {
  productName: string;
  configuration: string;
  billingItem: string;
  prepaidDurationLimit: string;
}

export type SalesCouponOwnerRole = 'salesAdmin' | 'sales';

export interface SalesAdminAccount {
  id: string;
  name: string;
  team: string;
}

export interface SalesCouponPoolRecord {
  id: string;
  name: string;
  ownerRole: SalesCouponOwnerRole;
  ownerId: string;
  ownerName: string;
  parentPoolId?: string;
  templateId?: string;
  benefitType?: CouponBenefitType;
  type: 'quota_discount';
  discountScope?: CouponDiscountScope;
  discountRate: number;
  totalQuota: number;
  allocatedQuota: number;
  grantedQuota: number;
  remainingQuota: number;
  effectiveAt: string;
  expiresAt: string;
  status: CouponStatus;
  issuedBy: string;
  issuedAt: string;
  remark: string;
}

export interface SalesCouponTransferRecord {
  id: string;
  poolId: string;
  fromRole: 'platformAdmin' | SalesCouponOwnerRole;
  fromName: string;
  toRole: SalesCouponOwnerRole | 'tenant';
  toId: string;
  toName: string;
  amount: number;
  createdAt: string;
  remark: string;
}

export interface SalesCouponGrantRecord {
  id: string;
  poolId: string;
  salesId: string;
  salesName: string;
  tenantId: string;
  tenantName: string;
  couponId: string;
  amount: number;
  createdAt: string;
  remark: string;
}

export interface OrderAmountBreakdown {
  originalAmount: number;
  eligibleAmount?: number;
  discountScope?: CouponDiscountScope;
  couponId?: string;
  couponName?: string;
  couponDiscountAmount: number;
  payableAmount: number;
  couponUsageStatus: 'none' | 'applied' | 'released';
}

export interface ConsultPayload {
  name: string;
  title: string;
  phone: string;
  email: string;
  company: string;
  industry: string;
  requirement: string;
  preferredTime: string;
  preferredChannel: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  category: '产品动态' | '行业资讯' | '最佳实践';
  tags: string[];
  summary: string;
  content: string;
  cover: string;
  publishedAt: string;
}

export interface AdminDashboard {
  metrics: Metric[];
  revenueTrend: UsagePoint[];
  topTenants: { name: string; token: number }[];
  alerts: string[];
}

export interface AdminTenant {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  ownerSales: string;
  accountManager: string;
  seatUsage: string;
  monthToken: number;
  status: Tenant['status'];
}

export interface PlatformOrder {
  id: string;
  tenant: string;
  product: string;
  amount: number;
  paymentMethod: BillingOrder['paymentMethod'];
  status: BillingOrder['status'];
  ownerSales: string;
  createdAt: string;
}

export interface SalesProfile {
  id: string;
  name: string;
  region: string;
  customers: number;
  monthGmv: number;
  rank: number;
  status: '在职' | '停用';
}

export interface CommissionRecord {
  id: string;
  orderId: string;
  tenant: string;
  sales: string;
  amount: number;
  commission: number;
  basis: string;
  status: '未发放' | '已发放' | '已撤销';
  createdAt: string;
}

export interface ConsultLead {
  id: string;
  company: string;
  contact: string;
  phone: string;
  source: string;
  assignedSales: string;
  status: '待认领' | '跟进中' | '已转客户';
  createdAt: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  quarterlyPrice: number;
  yearlyPrice: number;
  status: '上线' | '下线';
}

export interface AdminNewsItem {
  id: string;
  title: string;
  category: NewsArticle['category'];
  status: '草稿' | '已发布' | '已下架';
  author: string;
  updatedAt: string;
}

export interface AuditItem {
  id: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  createdAt: string;
}

export interface BatchJobTarget {
  id: string;
  name: string;
  tag: string;
  caller: string;
  status: '运行中' | '空闲' | '异常';
}

export interface BatchJobRecord {
  id: string;
  name: string;
  type: '实例命令' | '脚本执行' | '版本发布';
  status: '待执行' | '执行中' | '成功' | '失败';
  commandName: string;
  executor: '手动执行' | '定时执行';
  result: string;
  description: string;
  startedAt: string;
  endedAt: string;
}

export interface BatchVersionRecord {
  id: string;
  version: string;
  versionId: string;
  description: string;
  updatedAt: string;
  latestAction: string;
  secondaryAction: string;
}

export interface TenantAuditRecord {
  id: string;
  eventName: string;
  resourceName: string;
  resourceId: string;
  result: '成功' | '失败';
  operatorId: string;
  operatorEmail: string;
  operatedAt: string;
}

export interface ObservabilityMetricCard {
  label: string;
  value: string;
  unit: string;
  trend: string;
}

export interface ObservabilityRankingItem {
  name: string;
  value: string;
  subValue?: string;
}

export interface ObservabilityTrendPoint {
  time: string;
  inputTokens: number;
  outputTokens: number;
  cacheHitTokens: number;
  latency?: number;
}

export interface ObservabilityDistributionItem {
  name: string;
  value: number;
}

export interface ObservabilityUsageDetail {
  id: string;
  instanceName: string;
  inputTokens: string;
  outputTokens: string;
  totalTokens: string;
}

export interface ObservabilitySessionRecord {
  id: string;
  duration: string;
  totalTokens: string;
  inputTokens: string;
  outputTokens: string;
  calls: number;
  userId: string;
  startedAt: string;
  lastCalledAt: string;
}

export interface ObservabilityEndpointRecord {
  id: string;
  endpoint: string;
  avgLatency: string;
  p95Latency: string;
  successRate: string;
  requests: string;
}

export interface ObservabilityLogStat {
  level: 'INFO' | 'WARN' | 'ERROR';
  count: number;
}

export interface ObservabilityLogRecord {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  source: string;
  message: string;
}

export interface ObservabilityTraceRecord {
  id: string;
  traceId: string;
  spanName: string;
  duration: string;
  status: '正常' | '告警' | '异常';
  service: string;
  occurredAt: string;
}

export interface ObservabilityAlertTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  version: string;
  ruleCount: number;
  scopeCount: number;
  status: '已启用' | '未启用';
  updatedAt: string;
  updatedBy: string;
}

export interface TenantObservabilityData {
  usageMetrics: ObservabilityMetricCard[];
  tokenTopUsers: ObservabilityRankingItem[];
  tokenTopClaws: ObservabilityRankingItem[];
  tokenBottomUsers: ObservabilityRankingItem[];
  tokenBottomClaws: ObservabilityRankingItem[];
  skillVisits: ObservabilityRankingItem[];
  modelDistribution: ObservabilityDistributionItem[];
  tokenTrend: ObservabilityTrendPoint[];
  usageDetails: ObservabilityUsageDetail[];
  sessionRecords: ObservabilitySessionRecord[];
  performanceMetrics: ObservabilityMetricCard[];
  performanceTrend: ObservabilityTrendPoint[];
  performanceEndpoints: ObservabilityEndpointRecord[];
  logStats: ObservabilityLogStat[];
  logRecords: ObservabilityLogRecord[];
  traceRecords: ObservabilityTraceRecord[];
  alertTemplates: ObservabilityAlertTemplate[];
}

export interface OpsTicket {
  id: string;
  tenant: string;
  type: '绑定配置' | '网络' | '客户技术支持';
  assignee: string;
  sla: string;
  status: '待分派' | '处理中' | '待客户确认' | '已完成';
  updatedAt: string;
}

export interface OpsBinding {
  id: string;
  tenant: string;
  channel: '企业微信' | '飞书' | '钉钉' | '微信';
  appId: string;
  callbackUrl: string;
  status: '未配置' | '测试通过' | '异常';
  updatedAt: string;
}

export interface OpsNetwork {
  id: string;
  tenant: string;
  publicIngress: string;
  publicEgress: string;
  privateEgress: string;
  customDomain: string;
  status: '未开通' | '配置中' | '已开通';
}

export interface OpsDiagnostic {
  id: string;
  tenant: string;
  item: string;
  result: '正常' | '警告' | '异常';
  detail: string;
  checkedAt: string;
}

export type OpsRoleCode = 'R2.0' | 'R2.1' | 'R2.2';

export type OpsPriority = 'P0' | 'P1' | 'P2' | 'P3';

export type OpsTicketTypeCode =
  | 'opening'
  | 'im_binding'
  | 'network'
  | 'tech_support'
  | 'business_consult'
  | 'incident'
  | 'data_export';

export type OpsTicketStatusCode = 'unfinished' | 'resolved';

export type OpsTicketSourceCode = 'system' | 'customer';

export type OpsTicketQueueCode = 'delivery' | 'support';

export type OpsImChannelCode = 'feishu' | 'wecom' | 'dingtalk' | 'wechat';

export type OpsBindingHealthStatus = 'unconfigured' | 'active' | 'disabled' | 'broken';

export type OpsCheckStatus = 'pass' | 'warn' | 'fail';

export interface OpsTicketListItem {
  id: string;
  title: string;
  tenantId: string;
  tenantName: string;
  uscc: string;
  queue: OpsTicketQueueCode;
  type: OpsTicketTypeCode;
  priority: OpsPriority;
  status: OpsTicketStatusCode;
  source: OpsTicketSourceCode;
  assignee: string;
  slaRemaining: string;
  createdAt: string;
  updatedAt: string;
  watcher: boolean;
  priorityPending?: boolean;
  suggestedPriority?: OpsPriority;
  relatedOrderId?: string;
  relatedAlertId?: string;
}

export interface OpsTicketEvent {
  id: string;
  eventType: 'status_change' | 'comment' | 'assign' | 'attachment' | 'sla_alert' | 'remote_assist' | 'config_change';
  actor: string;
  actorRole: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface OpsTicketDetail extends OpsTicketListItem {
  description: string;
  customerVisible: boolean;
  salesOwner: string;
  accountManager: string;
  attachments: Array<{ id: string; filename: string; size: string }>;
  events: OpsTicketEvent[];
}

export type TenantSupportRequestType = 'tech_support' | 'onboarding' | 'business_consult';

export interface TenantSupportRequestPayload {
  type: TenantSupportRequestType;
  title: string;
  description: string;
  attachments?: Array<{ filename: string; size: string }>;
}

export interface TenantBusinessConsultRecord {
  id: string;
  title: string;
  description: string;
  status: 'pending_reply' | 'replied' | 'completed';
  assignedSalesName: string;
  createdAt: string;
  updatedAt: string;
  latestReply?: string;
  latestReplyAt?: string;
  completedAt?: string;
}

export interface OpsImBindingTenantItem {
  tenantId: string;
  tenantName: string;
  uscc: string;
  statuses: Record<OpsImChannelCode, OpsBindingHealthStatus>;
  currentTicketId: string;
  updatedAt: string;
  owner: string;
}

export interface OpsImBindingFieldDefinition {
  key: string;
  label: string;
  required?: boolean;
  secret?: boolean;
  readonly?: boolean;
}

export interface OpsImBindingHistoryRecord {
  id: string;
  channel: OpsImChannelCode;
  changedBy: string;
  changeType: 'create' | 'update' | 'rollback' | 'disable' | 'enable';
  changedAt: string;
  testResult: 'pass' | 'fail';
  summary: string;
}

export interface OpsImBindingChannelDetail {
  channel: OpsImChannelCode;
  status: OpsBindingHealthStatus;
  trustedDomain: string;
  callbackUrl: string;
  visibleScope: string;
  defaultSeatLevel: string;
  lastTestAt?: string;
  lastTestResult?: 'pass' | 'fail';
  fields: OpsImBindingFieldDefinition[];
  config: Record<string, string>;
  checks: Array<{ id: string; label: string; status: OpsCheckStatus; detail: string }>;
}

export interface OpsImBindingDetail {
  tenantId: string;
  tenantName: string;
  currentTicketId: string;
  channels: OpsImBindingChannelDetail[];
  history: OpsImBindingHistoryRecord[];
}

export interface OpsNetworkWorkspaceItem {
  tenantId: string;
  tenantName: string;
  uscc: string;
  customDomain: string;
  ingressStatus: 'not_enabled' | 'testing' | 'active' | 'expiring';
  egressStatus: 'off' | 'testing' | 'active';
  vpcStatus: 'off' | 'approving' | 'active';
  health: 'good' | 'warn' | 'danger';
  owner: string;
  updatedAt: string;
}

export interface OpsNetworkHistoryRecord {
  id: string;
  changedAt: string;
  changedBy: string;
  changeType: 'update' | 'rollback';
  summary: string;
  ticketId: string;
}

export interface OpsNetworkDetail {
  tenantId: string;
  tenantName: string;
  currentTicketId: string;
  defaultLoginUrl: string;
  customDomainEnabled: boolean;
  customDomain: string;
  certMode: 'upload' | 'acme';
  certExpiresAt: string;
  redirectStrategy: string;
  ingressTests: Array<{ id: string; label: string; status: OpsCheckStatus; detail: string }>;
  egressEnabled: boolean;
  egressAcceleration: boolean;
  egressNode: string;
  egressWhitelist: string[];
  egressIpWhitelist: string[];
  egressRateLimit: string;
  egressTests: Array<{ id: string; label: string; status: OpsCheckStatus; detail: string }>;
  vpcEnabled: boolean;
  vpcMethod: 'direct' | 'vpn' | 'ccn';
  vpcId: string;
  vpcSubnet: string;
  vpcGateway: string;
  ourCidr: string;
  authorizationUploaded: boolean;
  routeTable: string[];
  securityGroups: string[];
  vpcTests: Array<{ id: string; label: string; status: OpsCheckStatus; detail: string }>;
  requiresApproval: boolean;
  history: OpsNetworkHistoryRecord[];
}

export interface OpsDiagnosisWorkspaceItem {
  tenantId: string;
  tenantName: string;
  activeAlerts: number;
  lastIncidentAt: string;
  lastErrorRate: string;
  recommendedAction: string;
}

export interface OpsDiagnosisCheckItem {
  id: string;
  label: string;
  status: OpsCheckStatus;
  detail: string;
  suggestion: string;
}

export interface OpsErrorLogRecord {
  id: string;
  time: string;
  code: string;
  user: string;
  skill: string;
  traceId: string;
  description: string;
}

export interface OpsToolResult {
  id: string;
  tool: string;
  target: string;
  summary: string;
  status: OpsCheckStatus;
  detail: string;
  checkedAt: string;
}

export interface OpsAlertRecord {
  id: string;
  title: string;
  level: OpsPriority;
  source: string;
  status: 'active' | 'suppressed' | 'closed';
  createdAt: string;
}

export interface OpsRemoteAssistSession {
  id: string;
  ticketId: string;
  operator: string;
  reason: string;
  startedAt: string;
  expectedEndAt: string;
  endedAt?: string;
  status: 'active' | 'ended';
}

export interface OpsDiagnosisDetail {
  tenantId: string;
  tenantName: string;
  currentTicketId: string;
  checks: OpsDiagnosisCheckItem[];
  logs: OpsErrorLogRecord[];
  tools: OpsToolResult[];
  alerts: OpsAlertRecord[];
  sessions: OpsRemoteAssistSession[];
}

export interface OpsInspectionRun {
  id: string;
  runType: 'daily' | 'weekly' | 'monthly' | 'manual';
  scheduledAt: string;
  startedAt: string;
  finishedAt?: string;
  scannedTenants: number;
  failedItems: number;
  generatedTickets: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface OpsInspectionItemResult {
  id: string;
  tenantId: string;
  tenantName: string;
  itemCode: string;
  itemName: string;
  result: OpsCheckStatus;
  detail: string;
  generatedTicketId?: string;
  checkedAt: string;
}

export interface OpsInspectionRule {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  threshold: string;
  autoCreateTicket: boolean;
  priority: OpsPriority;
  enabled: boolean;
}

export interface OpsCustomerOverview {
  tenantId: string;
  tenantName: string;
  uscc: string;
  salesOwner: string;
  accountManager: string;
  health: 'good' | 'warn' | 'danger';
  bindingSummary: string;
  networkSummary: string;
  latestInspection: string;
  note: string;
}

export interface OpsChangeRecord {
  id: string;
  type: 'binding' | 'network';
  summary: string;
  operator: string;
  createdAt: string;
}

export interface OpsRemarkRecord {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface SalesCustomer {
  id: string;
  name: string;
  code: string;
  contact: string;
  industry: string;
  status: '待跟进' | '跟进中' | '已成交' | '已流失';
  paidAmount: number;
  commission: number;
  contactAt?: string;
  accountManager?: string;
  consumedAmount?: number;
}

export interface SalesInvite {
  id: string;
  code: string;
  url: string;
  limit: string;
  used: number;
  expiresAt: string;
  status: '启用' | '停用';
}

export interface SalesDashboard {
  metrics: Metric[];
  trend: UsagePoint[];
  customers: SalesCustomer[];
  inviteCode: string;
  inviteUrl: string;
  invites?: SalesInvite[];
  commissions?: CommissionRecord[];
}

export type SalesCustomerStatus = 'pending_followup' | 'following' | 'converted' | 'lost';

export type SalesBindingSource = 'share_link' | 'invite_code' | 'manual' | 'consult_lead';

export type SalesCommissionStatus =
  | 'estimated'
  | 'withdrawable'
  | 'withdrawing'
  | 'withdrawn'
  | 'invalid'
  | 'pending'
  | 'pending_sales_confirm'
  | 'disputed'
  | 'confirmed'
  | 'paid';

export type CommissionOrderKind = '新增' | '续约' | '增购';

export type CommissionRuleType = 'S级代理' | 'A级代理' | 'B级代理' | 'C级代理' | '内部销售';

export type SalesInviteResourceStatus = 'active' | 'disabled' | 'expired' | 'exhausted';

export type SalesFollowupChannel = 'phone' | 'wechat' | 'visit' | 'email' | 'other';

export type SalesLeadStatus = 'new' | 'claimed' | 'following' | 'converted' | 'closed';

export type SalesLeadCloseReason = '不感兴趣' | '已选友商' | '联系不上' | '其他';

export type ConsultOpportunityType = 'external_consult' | 'customer_business_consult';

export type SalesCustomerSource = '主动开发' | '老客户介绍' | '行业活动' | '官网咨询' | '其他';

export type SalesOpeningTaskStatus = 'pending_assign' | 'pending_handle' | 'purchasing' | 'waiting_confirm' | 'completed' | 'failed' | 'cancelled';

export type SalesOrderSeatStatus = 'inactive' | 'activating' | 'active' | 'released';

export interface SalesDashboardSummary {
  greeting: string;
  monthNewCount: number;
  myCustomerCount: number;
  monthPaidAmount: number;
  monthEstimatedCommission: number;
  inWindowCustomerCount: number;
  totalCommission: number;
  pendingCommissionAmount: number;
  unclaimedLeadCount: number;
  overdueFollowupCount: number;
  expiringAttributionCount: number;
}

export interface SalesDashboardTrendPoint {
  date: string;
  paidAmount: number;
  estimatedCommission: number;
}

export interface SalesTopCustomer {
  tenantId: string;
  customerName: string;
  monthToken: number;
  monthActiveEmployees: number;
  customerStatus: SalesCustomerStatus;
  growth: number;
}

export interface SalesCustomerListItem {
  id: string;
  tenantName: string;
  uscc: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail?: string;
  industry: string;
  customerStatus: SalesCustomerStatus;
  boundAt: string;
  firstActivatedAt?: string;
  attributionValidUntil?: string;
  attributionStarted: boolean;
  lastFollowupAt?: string;
  totalPaidAmount: number;
  totalCommissionAmount: number;
  accountManagerName?: string;
  accountManagerNote?: string;
  salesRemark?: string;
  customTags: string[];
  boundSource: SalesBindingSource;
}

export interface SalesCustomerDetail extends SalesCustomerListItem {
  address: string;
  website?: string;
  companySize: string;
  companyStage: string;
  adminName: string;
  adminPhone: string;
  adminEmail: string;
  bindingSourceLabel: string;
  ownerSalesName: string;
  activeEmployeeCount: number;
  latestOrderAt?: string;
}

export interface SalesCustomerOrderRecord {
  id: string;
  tenantId: string;
  type: string;
  planName: string;
  bundleLines?: OrderBundleLine[];
  amount: number;
  paymentMethod: 'wechat' | 'alipay' | 'bank_transfer';
  status: BillingOrder['status'];
  seatStatus: SalesOrderSeatStatus;
  createdAt: string;
  paidAt?: string;
  activatedAt?: string;
  openingTaskId?: string;
  openingStatus?: SalesOpeningTaskStatus;
  commissionId?: string;
  commissionStatus?: SalesCommissionStatus;
}

export interface SalesCustomerUsagePoint {
  month: string;
  tokenConsumed: number;
  activeEmployees: number;
}

export interface SalesFollowupRecord {
  id: string;
  tenantId: string;
  salesId: string;
  channel: SalesFollowupChannel;
  content: string;
  nextFollowupAt?: string;
  remind: boolean;
  createdAt: string;
  creatorName: string;
}

export interface SalesCustomerCommissionRecord {
  id: string;
  orderId: string;
  tenantId: string;
  tenantName: string;
  orderKind?: CommissionOrderKind;
  originalAmount?: number;
  discountAmount?: number;
  paidAmount?: number;
  orderAmount: number;
  commissionAmount: number;
  rate: number;
  ruleName?: string;
  ruleType?: CommissionRuleType;
  calcText: string;
  status: SalesCommissionStatus;
  generatedAt: string;
  activatedAt?: string;
  withdrawableAt?: string;
  financeReviewedAt?: string;
  confirmedAt?: string;
  disputedAt?: string;
  disputeReason?: string;
  paidAt?: string;
  windowRemainingDays: number;
}

export interface SalesCustomerFormPayload {
  tenantName: string;
  uscc: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail?: string;
  industry: string;
  source: SalesCustomerSource;
  address?: string;
  website?: string;
  accountManagerNote?: string;
  salesRemark?: string;
}

export interface SalesCustomerPatchPayload {
  accountManagerNote?: string;
  salesRemark?: string;
  customTags?: string[];
}

export interface SalesFollowupPayload {
  channel: SalesFollowupChannel;
  content: string;
  nextFollowupAt?: string;
  remind: boolean;
}

export interface SalesCustomerLostPayload {
  reason: string;
}

export interface SalesCustomerQuery {
  q?: string;
  status?: SalesCustomerStatus | 'all';
  industry?: string | 'all';
  attention?: 'overdue' | 'expiring';
  sortBy?: 'bound_at_desc' | 'commission_desc' | 'followup_desc';
  boundDateFrom?: string;
  boundDateTo?: string;
}

export interface SalesUsccCheckResult {
  available: boolean;
  reason?: 'owned_by_other' | 'owned_by_self';
  tenantId?: string;
}

export interface SalesShareLinkRecord {
  id: string;
  name: string;
  shortCode: string;
  shortUrl: string;
  qrUrl: string;
  remark?: string;
  maxUses: number | null;
  usedCount: number;
  expiresAt?: string;
  status: SalesInviteResourceStatus;
  createdAt: string;
}

export interface SalesInviteCodeRecord {
  id: string;
  name: string;
  code: string;
  remark?: string;
  maxUses: number | null;
  usedCount: number;
  expiresAt?: string;
  status: SalesInviteResourceStatus;
  createdAt: string;
}

export interface SalesRegistrationRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  uscc: string;
  contactName: string;
  createdAt: string;
  source: SalesBindingSource;
  sourceLabel: string;
}

export interface SalesShareCreatePayload {
  name: string;
  expiresInDays?: number;
  maxUses?: number;
  remark?: string;
}

export interface SalesCommissionQuery {
  q?: string;
  status?: Array<SalesCommissionStatus>;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface SalesCommissionSummary {
  totalOrderAmount: number;
  totalCommissionAmount: number;
  estimatedAmount?: number;
  withdrawableAmount?: number;
  withdrawingAmount?: number;
  withdrawnAmount?: number;
  monthNewEstimatedAmount?: number;
  byStatus: Array<{
    status: SalesCommissionStatus;
    amount: number;
  }>;
}

export type AgentCommissionView = 'agent' | 'distribution';

export type AgentCommissionRole = 'agentAdmin' | 'agentFinance' | 'agentSales';

export type AgentCommissionStatus =
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'reverted'
  | 'withdrawable'
  | 'withdrawing'
  | 'processing';

export interface AgentCommissionQuery {
  q?: string;
  status?: Array<AgentCommissionStatus>;
  dateFrom?: string;
  dateTo?: string;
}

export interface AgentCommissionSummary {
  totalOrderAmount: number;
  totalCommissionAmount: number;
  pendingAmount: number;
  confirmedAmount: number;
  paidAmount: number;
  revertedAmount: number;
  withdrawableAmount: number;
  withdrawingAmount: number;
  processingAmount: number;
  byStatus: Array<{
    status: AgentCommissionStatus;
    amount: number;
  }>;
}

export interface AgentCommissionRecord {
  id: string;
  orderId: string;
  tenantId: string;
  tenantName: string;
  orderAmount: number;
  paidAmount: number;
  commissionAmount: number;
  rate: number;
  status: AgentCommissionStatus;
  generatedAt: string;
  confirmedAt?: string;
  paidAt?: string;
  withdrawableAt?: string;
  calcText: string;
  sourceLabel: string;
  ruleName?: string;
  settlementNote?: string;
}

export interface AgentCommissionDistributionRecord {
  id: string;
  agentCommissionId: string;
  orderId: string;
  tenantId: string;
  tenantName: string;
  salesId: string;
  salesName: string;
  orderAmount: number;
  paidAmount: number;
  commissionAmount: number;
  rate: number;
  status: AgentCommissionStatus;
  generatedAt: string;
  paidAt?: string;
  calcText: string;
  ruleName?: string;
  settlementNote?: string;
}

export interface AgentCommissionWithdrawRecord {
  id: string;
  amount: number;
  updatedCount: number;
  status: 'withdrawing' | 'paid';
  requestedAt: string;
  accountName: string;
  bankName: string;
  branchName: string;
  accountNo: string;
}

export interface SalesLeadRecord {
  id: string;
  opportunityType: ConsultOpportunityType;
  customerConsultStatus?: TenantBusinessConsultRecord['status'];
  company: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  requirement: string;
  preferredChannel: string;
  preferredTime: string;
  status: SalesLeadStatus;
  source: string;
  createdAt: string;
  assignedSalesId?: string;
  assignedSalesName?: string;
  claimedAt?: string;
  convertedTenantId?: string;
  closeReason?: SalesLeadCloseReason;
  closedAt?: string;
  followupCount: number;
  lastFollowupAt?: string;
  latestFollowupSummary?: string;
  slaDeadlineAt: string;
  attachments?: Array<{ id: string; filename: string; size: string }>;
}

export interface SalesLeadFollowPayload {
  content: string;
  channel: SalesFollowupChannel;
  nextFollowupAt?: string;
}

export interface SalesLeadFollowupRecord {
  id: string;
  leadId: string;
  salesId: string;
  channel: SalesFollowupChannel;
  content: string;
  nextFollowupAt?: string;
  createdAt: string;
  creatorName: string;
}

export interface SalesLeadClosePayload {
  reason: SalesLeadCloseReason;
  note?: string;
}

export interface SalesBankAccount {
  accountName: string;
  bankName: string;
  branchName: string;
  accountNo: string;
  status: 'not_set' | 'active';
  updatedAt?: string;
}

export interface SalesProfileDetail {
  id: string;
  name: string;
  employeeNo: string;
  team: string;
  region: string;
  hiredAt: string;
  avatarText: string;
  phone: string;
  email: string;
  baseCommissionRate: number;
  bankAccount?: SalesBankAccount;
  security: {
    lastPasswordUpdatedAt: string;
  };
}

export interface SalesPerformancePoint {
  month: string;
  gmv: number;
  commission: number;
  newCustomers: number;
}

export interface SalesProfileUpdatePayload {
  phone: string;
  email: string;
}

export interface SalesOpeningTaskRecord {
  id: string;
  orderId: string;
  tenantId: string;
  tenantName: string;
  planName: string;
  bundleLines: OrderBundleLine[];
  orderAmount: number;
  deliveryOwner: string;
  fulfillmentMode: 'manual_official_site' | 'volc_api';
  status: SalesOpeningTaskStatus;
  updatedAt: string;
  createdAt: string;
  failureReason?: string;
}

export type SalesOrderFollowupStatus =
  | 'pending_payment'
  | 'payment_review'
  | 'paid_waiting_delivery'
  | 'delivery_processing'
  | 'completed'
  | 'closed';

export interface SalesOrderFollowupRecord {
  id: string;
  orderId: string;
  tenantId: string;
  tenantName: string;
  planName: string;
  bundleLines: OrderBundleLine[];
  orderAmount: number;
  paymentMethod: 'wechat' | 'alipay' | 'bank_transfer';
  orderStatus: AdminPaymentStatus;
  followupStatus: SalesOrderFollowupStatus;
  bankReviewStatus?: AdminBankTransferReviewStatus;
  proofName?: string;
  bankSerialNo?: string;
  openingTaskId?: string;
  openingStatus?: SalesOpeningTaskStatus;
  deliveryOwner?: string;
  createdAt: string;
  paidAt?: string;
  updatedAt: string;
}

export interface PublicRegisterRefCheckResult {
  valid: boolean;
  salesId?: string;
  salesName?: string;
  sourceType?: 'share_link';
  sourceName?: string;
  tip: string;
}

export interface PublicInviteCodeCheckResult {
  valid: boolean;
  codeId?: string;
  salesId?: string;
  salesName?: string;
  reason?: 'invalid' | 'expired' | 'disabled' | 'exhausted';
}

export interface PublicRegisterPayload {
  companyName: string;
  uscc: string;
  industry?: string;
  address?: string;
  website?: string;
  contactName: string;
  phone: string;
  email?: string;
  password: string;
  agree: boolean;
  verificationPassed: boolean;
  refPayload?: string;
  inviteCode?: string;
}

export interface PublicRegisterResult {
  tenantId: string;
  tenantName: string;
  bound: boolean;
  salesName?: string;
}

export interface SkillCategory {
  id: string;
  label: string;
}

export interface SkillFilterOption {
  label: string;
  value: string;
}

export interface SkillCard {
  id: string;
  name: string;
  description: string;
  category: string;
  scene: string;
  source: '官方' | '企业';
  type: '工具' | '工作流' | '知识';
  tags: string[];
  rating: number;
  downloads: number;
  coverTone: 'blue' | 'cyan' | 'violet' | 'gold';
}

export interface SkillCenterData {
  categories: SkillCategory[];
  sceneOptions: SkillFilterOption[];
  sourceOptions: SkillFilterOption[];
  typeOptions: SkillFilterOption[];
  plaza: SkillCard[];
  featured: SkillCard[];
}

export type EnterpriseAppKind = 'agent' | 'mcp';

export interface AppCenterData {
  statusOptions: SkillFilterOption[];
  sourceOptions: SkillFilterOption[];
}

export interface AppRegistrationPreset {
  sourceOptions: string[];
  agentRuntimeOptions: string[];
  mcpProtocolOptions: string[];
}

export interface AppRegistrationPayload {
  kind: EnterpriseAppKind;
  name: string;
  code: string;
  description: string;
  source: string;
  runtime: string;
  address: string;
}

export interface KnowledgeGuideStep {
  id: string;
  title: string;
  description: string;
}

export interface KnowledgeSourceCard {
  id: string;
  name: string;
  description: string;
  family: 'knowledge' | 'database';
  accent: 'blue' | 'cyan' | 'violet' | 'gold';
}

export interface KnowledgeLibraryOption {
  id: string;
  name: string;
  region: string;
}

export interface KnowledgeCenterData {
  guideSteps: KnowledgeGuideStep[];
  featuredSources: KnowledgeSourceCard[];
  databaseSources: KnowledgeSourceCard[];
  libraryOptions: KnowledgeLibraryOption[];
}

export interface KnowledgeConnectionPayload {
  sourceId: string;
  libraries: Array<{
    name: string;
    region: string;
  }>;
  accessKey: string;
  secretKey: string;
}

export type UserManagementTabKey = 'employees' | 'departments' | 'access';

export interface DepartmentNode {
  id: string;
  name: string;
  parentId?: string;
  source: string;
  employeeCount: number;
  childCount: number;
  relationPath: string;
}

export interface EmployeeRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  departmentId?: string;
  group: string;
  loginType: string;
  status: '正常' | '待补充';
}

export interface DepartmentTableRow {
  id: string;
  name: string;
  externalId: string;
  relation: string;
  childCount: number;
  employeeCount: number;
  source: string;
  createdAt: string;
}

export interface SyncIssueRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: '待补充';
  loginType: string;
  example: string;
}

export interface UserLoginConfigSummary {
  callbackUrl: string;
  loginUrl: string;
  authChannel: string;
  agentId: string;
  agentSecretMasked: string;
}

export interface UserManagementData {
  activeTab: UserManagementTabKey;
  authChannel: string;
  warningText: string;
  employeeCount: number;
  departmentPanelTabs: Array<{ key: 'org' | 'custom'; label: string }>;
  departmentNodes: DepartmentNode[];
  customGroups: Array<{ id: string; name: string }>;
  departmentLeaderOptions: Array<{ label: string; value: string }>;
  parentDepartmentOptions: Array<{ label: string; value: string }>;
  loginConfig: UserLoginConfigSummary;
}

export type AdminRoleCode = 'R1.0' | 'R1.1' | 'R1.2' | 'R1.3';

export type AdminTenantStatus = 'not_opened' | 'active' | 'suspended' | 'closed';

export type AdminTenantOnboardingStatus =
  | 'pending_order'
  | 'pending_payment'
  | 'pending_delivery_review'
  | 'pending_finance_review'
  | 'pending_assign'
  | 'pending_handle'
  | 'purchasing'
  | 'waiting_confirm'
  | 'completed'
  | 'failed';

export type AdminPaymentStatus = 'pending' | 'pending_review' | 'paid' | 'refunded' | 'cancelled';

export type AdminRefundStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';

export type AdminBankTransferReviewStatus =
  | 'pending_delivery_review'
  | 'pending_finance_review'
  | 'approved'
  | 'rejected';

export type AdminSalesStatus = 'active' | 'left';

export type AdminCommissionBatchStatus =
  | 'auto_generated'
  | 'pending_review'
  | 'approved'
  | 'exported'
  | 'paid'
  | 'closed';

export type AdminPlanStatus = 'draft' | 'published' | 'offline';

export type AdminNewsStatus = 'draft' | 'scheduled' | 'reviewing' | 'published' | 'offline' | 'rejected';

export type AdminLeadStatus = 'new' | 'assigned' | 'claimed' | 'following' | 'converted' | 'closed';

export interface AdminAlertBanner {
  id: string;
  level: 'warning' | 'error';
  text: string;
  route: string;
}

export interface AdminDashboardSummary {
  banners: AdminAlertBanner[];
  todoCards: Array<{
    id: string;
    label: string;
    count: number;
    amount?: number;
    amountLabel: string;
    route: string;
    ctaLabel: string;
    tone: 'danger' | 'warning' | 'orange' | 'blue';
    urgent: boolean;
  }>;
  businessMetrics: Array<{
    id: string;
    label: string;
    value: string;
    compareText: string;
    compareDirection: 'up' | 'down' | 'flat';
    helpText: string;
  }>;
  revenueTrend: Array<{
    date: string;
    agentRevenue: number;
    directRevenue: number;
    newRevenue: number;
    renewalRevenue: number;
    seats: number;
    orders: number;
  }>;
  topTenants: Array<{
    id: string;
    name: string;
    token: number;
    gmv: number;
    seats: number;
    status: AdminTenantStatus;
  }>;
  topExternalAgents: Array<{
    id: string;
    name: string;
    team: string;
    gmv: number;
    newCustomers: number;
    channelLabel: '代理' | '自销';
  }>;
  topDirectSales: Array<{
    id: string;
    name: string;
    team: string;
    gmv: number;
    newCustomers: number;
    channelLabel: '代理' | '自销';
  }>;
}

export type AgentBalanceAlertLevel = 'normal' | 'warning' | 'danger' | 'blocked';

export type AgentBalanceLedgerType = 'topup' | 'deduct' | 'refund';

export type AgentBalancePaymentMethod = 'bank_transfer' | 'wechat' | 'alipay';
export type AgentProcurementPaymentMethod = 'wallet' | 'wechat' | 'bank_transfer';
export type AgentProcurementOrderStatus =
  | 'pending_customer_payment'
  | 'pending_procurement'
  | 'pending_finance_review'
  | 'delivery_processing'
  | 'completed';

export interface AgentBalanceCollectionAccount {
  companyName: string;
  bankName: string;
  branchName: string;
  accountNo: string;
  remarkCode: string;
  note: string;
}

export interface AgentBalanceSummary {
  currentBalance: number;
  totalTopup: number;
  deductedAmount: number;
  totalCommission: number;
  withdrawnAmount: number;
  withdrawableAmount: number;
  warningThreshold: number;
  alertLevel: AgentBalanceAlertLevel;
  alertText: string;
  seatQuotaCards: Array<{
    level: SeatLevel;
    name: string;
    quota: number;
    assigned: number;
    used: number;
    remaining: number;
  }>;
  collectionAccount: AgentBalanceCollectionAccount;
}

export interface AgentWebsiteConfig {
  companyName: string;
  logoFileName: string;
  contactItems: string[];
  wechatQrFileName: string;
  updatedAt: string;
}

export interface AgentBalanceDashboardSummary {
  todoCards: Array<{
    id: string;
    label: string;
    count: number;
    description: string;
    route: string;
    tone: 'warning' | 'danger' | 'orange' | 'blue';
  }>;
  businessMetrics: Array<{
    id: string;
    label: string;
    value: string;
    compareText: string;
    compareDirection: 'up' | 'down' | 'flat';
    helpText: string;
  }>;
  account: AgentBalanceSummary;
}

export interface AgentBalanceLedgerRecord {
  id: string;
  type: AgentBalanceLedgerType;
  businessLabel: string;
  amount: number;
  balanceAfter: number;
  createdAt: string;
  remark: string;
  paymentMethod?: AgentBalancePaymentMethod;
  proofFileName?: string;
}

export interface AgentBalanceLedgerQuery {
  dateFrom?: string;
  dateTo?: string;
  types?: AgentBalanceLedgerType[];
  minAmount?: number;
  maxAmount?: number;
}

export interface AgentBalanceTopupOrder {
  id: string;
  amount: number;
  paymentMethod: AgentBalancePaymentMethod;
  remark: string;
  status: 'submitted' | 'completed';
  createdAt: string;
  proofFileName?: string;
  uniqueRemarkCode: string;
}

export interface AgentProcurementOrderRecord {
  id: string;
  customerOrderId: string;
  tenantId: string;
  tenantName: string;
  agentTenantId: string;
  agentName: string;
  salesName: string;
  orderSummary: string;
  customerSaleAmount: number;
  platformListAmount: number;
  protocolRate: number;
  protocolAmount: number;
  grossProfit: number;
  customerPaymentStatus: 'pending' | 'confirmed';
  procurementPaymentMethod?: AgentProcurementPaymentMethod;
  procurementProofName?: string;
  status: AgentProcurementOrderStatus;
  financeOwner?: string;
  deliveryOwner?: string;
  openingTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTenantListItem {
  id: string;
  name: string;
  uscc: string;
  industry: string;
  status: AdminTenantStatus;
  onboardingStatus: AdminTenantOnboardingStatus;
  ownerSales: string;
  accountManager: string;
  seatSummary: string;
  monthToken: number;
  monthGmv: number;
  createdAt: string;
  volcSpaceId: string;
}

export interface AdminTenantAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'R4' | 'R5';
  status: 'active' | 'suspended';
  lastLoginAt: string;
}

export interface AdminTenantAuditRecord {
  id: string;
  createdAt: string;
  actor: string;
  action: string;
  target: string;
  result: 'success' | 'failed';
}

export interface AdminTenantDetail extends AdminTenantListItem {
  address: string;
  website?: string;
  contractStatus: string;
  activeEmployees: number;
  ownerSalesId: string;
  accountManagerId: string;
  plans: Array<{
    id: string;
    level: SeatLevel;
    name: string;
    codingPlanName?: string;
    includesCodingPlan: boolean;
    purchasedSeats: number;
    assignedSeats: number;
    remainingSeats: number;
    quota: number;
    maxApplyPerEmployee: number;
    cycle: string;
    price: number;
    status: string;
    effectiveAt: string;
  }>;
  admins: AdminTenantAccount[];
  bindings: Array<{
    id: string;
    channel: string;
    status: 'active' | 'pending' | 'broken' | 'unconfigured';
    scope: 'im' | 'network';
    source: 'ops_im_binding' | 'ops_network';
    currentTicketId?: string;
    lastTestAt?: string;
    lastTestResult?: 'pass' | 'fail' | 'untested';
    lastChangedBy?: string;
    lastChangedAt?: string;
    hint: string;
  }>;
  audit: AdminTenantAuditRecord[];
  highRiskNotes: string[];
}

export interface AdminTenantUsagePoint {
  month: string;
  token: number;
  activeEmployees: number;
}

export interface AdminOrderRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  ownerSales: string;
  orderType: string;
  amount: number;
  originalAmount?: number;
  couponId?: string;
  couponName?: string;
  couponDiscountAmount?: number;
  couponUsageStatus?: 'none' | 'applied' | 'released';
  paymentMethod: 'wechat' | 'alipay' | 'bank_transfer';
  status: AdminPaymentStatus;
  createdAt: string;
  paidAt?: string;
  paymentExpiresAt?: string;
  paymentExpiredAt?: string;
  priceAdjustment?: OrderPriceAdjustmentRecord;
  archivedAt?: string;
  archivedBy?: string;
}

export interface AdminOrderDetail extends AdminOrderRecord {
  bundleLines?: OrderBundleLine[];
  volcSyncStatus: 'success' | 'failed' | 'pending';
  volcReceipt: string;
  commissionId?: string;
  timeline: Array<{
    id: string;
    time: string;
    title: string;
    detail: string;
  }>;
}

export type AdminOpeningTaskStatus = 'pending_assign' | 'pending_handle' | 'purchasing' | 'waiting_confirm' | 'completed' | 'failed' | 'cancelled';

export interface AdminOpeningTaskRecord {
  id: string;
  orderId: string;
  tenantId: string;
  tenantName: string;
  ownerSales: string;
  deliveryOwner?: string;
  planName: string;
  bundleLines: OrderBundleLine[];
  orderAmount: number;
  fulfillmentMode: 'manual_official_site' | 'volc_api';
  status: AdminOpeningTaskStatus;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  timeline: Array<{
    id: string;
    time: string;
    title: string;
    detail: string;
  }>;
}

export interface AdminBankTransferReviewItem {
  id: string;
  orderId: string;
  tenantName: string;
  amount: number;
  attemptNo: number;
  proofName: string;
  uploadedAmount: number;
  uploadedAt: string;
  daysSinceUpload: number;
  reviewStatus: AdminBankTransferReviewStatus;
  deliveryOwner: string;
  financeOwner?: string;
  bankSerialNo?: string;
  deliveryReviewedAt?: string;
  financeReviewedAt?: string;
  reviewReason?: string;
  attempts?: Array<{
    id: string;
    attemptNo: number;
    proofName: string;
    uploadedAmount: number;
    uploadedAt: string;
    reviewStatus: AdminBankTransferReviewStatus;
    bankSerialNo?: string;
    deliveryReviewedAt?: string;
    financeReviewedAt?: string;
    reviewReason?: string;
  }>;
}

export interface AdminRefundRequest {
  id: string;
  orderId: string;
  tenantName: string;
  requestAmount: number;
  originalAmount: number;
  reason: string;
  appliedBy: string;
  appliedRole: string;
  status: AdminRefundStatus;
  createdAt: string;
  reviewer1?: string;
  reviewer2?: string;
  rejectReason?: string;
}

export interface AdminAnomalyOrder {
  id: string;
  orderId: string;
  tenantName: string;
  triggerReason: string;
  amount: number;
  createdAt: string;
  status: 'pending' | 'handled' | 'suspended';
}

export interface AdminSalesListItem {
  id: string;
  employeeNo: string;
  name: string;
  team: string;
  hiredAt: string;
  status: AdminSalesStatus;
  monthNewCustomers: number;
  monthGmv: number;
  monthCommission: number;
  totalCommission: number;
}

export interface AdminSalesDetail extends AdminSalesListItem {
  region: string;
  phone: string;
  email: string;
  baseCommissionRate: number;
  bankAccount?: SalesBankAccount;
  customers: AdminTenantListItem[];
  performance: Array<{
    month: string;
    gmv: number;
    commission: number;
    newCustomers: number;
  }>;
  commissions: Array<{
    id: string;
    orderId: string;
    tenantName: string;
    amount: number;
    commission: number;
    status: SalesCommissionStatus;
    createdAt: string;
  }>;
  invites: Array<{
    id: string;
    type: 'share_link' | 'invite_code';
    name: string;
    value: string;
    status: string;
    used: number;
  }>;
  audit: AdminTenantAuditRecord[];
}

export interface AdminSalesTransferRequest {
  id: string;
  tenantName: string;
  fromSales: string;
  toSales: string;
  applicant: string;
  reason: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer1?: string;
  reviewer2?: string;
}

export type AdminAgentTenantStatus = 'active' | 'pending_setup' | 'suspended';
export type AdminAgentTenantWebsiteStatus = 'configured' | 'draft' | 'not_configured';

export interface AdminAgentTenantListItem {
  id: string;
  companyName: string;
  shortName: string;
  status: AdminAgentTenantStatus;
  mirrorDomain: string;
  websiteStatus: AdminAgentTenantWebsiteStatus;
  logoFileName: string;
  collectionQrFileName: string;
  collectionBankAccountName: string;
  collectionBankName: string;
  collectionBranchName: string;
  collectionAccountNo: string;
  collectionNote: string;
  adminName: string;
  adminPhone: string;
  contactEmail: string;
  legalName: string;
  agreementLevel: string;
  procurementRuleId: string;
  procurementRuleName: string;
  procurementRate: number;
  salesCount: number;
  financeCount: number;
  customerCount: number;
  currentBalance: number;
  monthGmv: number;
  createdAt: string;
}

export interface AdminAgentTenantDetail extends AdminAgentTenantListItem {
  totalTopup: number;
  totalDeducted: number;
  staff: Array<{
    id: string;
    name: string;
    role: 'agentAdmin' | 'agentSales' | 'agentFinance';
    phone: string;
    status: 'active' | 'invited' | 'disabled';
  }>;
  recentCustomers: Array<{
    id: string;
    name: string;
    ownerSales: string;
    status: AdminTenantStatus;
    monthGmv: number;
  }>;
  recentOrders: Array<{
    id: string;
    tenantName: string;
    amount: number;
    status: 'pending' | 'pending_review' | 'paid' | 'refunded' | 'cancelled';
    createdAt: string;
  }>;
}

export type AdminSettlementRuleKind = 'commission' | 'procurement_discount';

export interface AdminCommissionRule {
  id: string;
  name: string;
  kind: AdminSettlementRuleKind;
  rate: number;
  cycleMonths: number;
  effectiveFrom: string;
  effectiveTo?: string;
  scope: string;
  status: 'draft' | 'active' | 'expired';
  createdBy: string;
}

export interface AdminAgentTenantUpsertPayload {
  companyName: string;
  shortName: string;
  legalName: string;
  status: AdminAgentTenantStatus;
  mirrorSiteEnabled: boolean;
  mirrorDomain: string;
  logoFileName: string;
  collectionQrFileName: string;
  collectionBankAccountName: string;
  collectionBankName: string;
  collectionBranchName: string;
  collectionAccountNo: string;
  collectionNote: string;
  adminName: string;
  adminPhone: string;
  contactEmail: string;
  agreementLevel: string;
  procurementRuleId: string;
}

export interface AdminCommissionTransaction {
  id: string;
  orderId: string;
  tenantName: string;
  salesName: string;
  orderKind?: CommissionOrderKind;
  originalAmount?: number;
  discountAmount?: number;
  paidAmount?: number;
  orderAmount: number;
  commissionAmount: number;
  rate?: number;
  ruleName?: string;
  ruleType?: CommissionRuleType;
  sourceType?:
    | 'opening_completed'
    | 'finance_reviewed'
    | 'sales_confirmed'
    | 'sales_disputed'
    | 'batch_confirmed'
    | 'batch_paid'
    | 'manual_adjust';
  sourceText?: string;
  batchId?: string;
  batchNo?: string;
  status: SalesCommissionStatus;
  financeOwner?: string;
  generatedAt: string;
  activatedAt?: string;
  withdrawableAt?: string;
  financeReviewedAt?: string;
  confirmedAt?: string;
  disputedAt?: string;
  disputeReason?: string;
  paidAt?: string;
  adjustReason?: string;
  confirmBasis?: string;
  bankTransferNo?: string;
  bankReceiptFileName?: string;
  adjusted?: boolean;
}

export type AdminCommissionWithdrawStatus = 'withdrawing' | 'withdrawn';

export interface AdminCommissionPayoutAccount {
  accountName: string;
  bankName: string;
  branchName: string;
  accountNo: string;
}

export interface AdminCommissionWithdrawRecord {
  id: string;
  salesName: string;
  transactionIds: string[];
  orderCount: number;
  totalAmount: number;
  status: AdminCommissionWithdrawStatus;
  financeOwner?: string;
  requestedAt: string;
  paidAt?: string;
  bankTransferNo?: string;
  bankReceiptFileName?: string;
  payoutGeneratedAt?: string;
  payoutAccount?: AdminCommissionPayoutAccount;
  recipientAccount?: AdminCommissionPayoutAccount;
}

export interface AdminCommissionBatch {
  id: string;
  batchNo: string;
  period: string;
  salesCount: number;
  commissionCount: number;
  totalAmount: number;
  status: AdminCommissionBatchStatus;
  financeOwner?: string;
  createdAt: string;
  reviewedAt?: string;
  exportedAt?: string;
  paidAt?: string;
  bankTransferNo?: string;
  bankReceiptFileName?: string;
  transactionIds?: string[];
  sampledItems: Array<{
    id: string;
    transactionId?: string;
    orderId?: string;
    tenantName: string;
    salesName: string;
    orderAmount?: number;
    amount: number;
    rate?: number;
    sourceText?: string;
    generatedAt?: string;
    reviewed: boolean;
  }>;
}

export interface AdminCommissionDashboardSummary {
  pendingAmount: number;
  pendingCount: number;
  pendingSalesConfirmAmount: number;
  pendingSalesConfirmCount: number;
  readyPayoutAmount: number;
  readyPayoutCount: number;
  exportedBatchAmount: number;
  exportedBatchCount: number;
  reconciliationDiffAmount: number;
  reconciliationDiffCount: number;
  todos: Array<{
    id: string;
    title: string;
    description: string;
    amount?: number;
    count?: number;
    route: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  alerts: Array<{
    id: string;
    title: string;
    description: string;
    level: 'warning' | 'error';
  }>;
}

export interface AdminPlanRecord {
  id: string;
  name: string;
  productType: 'seat_sub' | 'coding_plan' | 'expansion';
  specSummary: string;
  priceMonth?: number;
  priceQuarter?: number;
  priceYear?: number;
  status: AdminPlanStatus;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdBy: string;
}

export interface AdminPlanHistoryRecord {
  id: string;
  changedAt: string;
  changedBy: string;
  summary: string;
}

export interface AdminNewsRecord {
  id: string;
  title: string;
  category: '产品动态' | '行业资讯' | '最佳实践';
  tags: string[];
  status: AdminNewsStatus;
  publishedAt?: string;
  scheduledAt?: string;
  views: number;
  author: string;
  updatedAt: string;
  summary: string;
  cover?: string;
  content: string;
}

export interface AdminNewsStats {
  views: number;
  likes: number;
  consults: number;
}

export interface AdminLeadRecord {
  id: string;
  opportunityType: ConsultOpportunityType;
  company: string;
  contact: string;
  title: string;
  phone: string;
  email: string;
  requirement: string;
  source: string;
  status: AdminLeadStatus;
  slaHoursLeft: number;
  assignedSales?: string;
  assignedAt?: string;
  claimedAt?: string;
  lastFollowupAt?: string;
  latestFollowupSummary?: string;
  convertedAt?: string;
  convertedTenantId?: string;
  closedAt?: string;
  closeReason?: string;
  createdAt: string;
}

export interface AdminLeadFunnel {
  newCount: number;
  assignedCount: number;
  claimedCount: number;
  convertedCount: number;
  conversionRate: number;
}

export interface AdminRolePermissionMatrix {
  role: AdminRoleCode;
  name: string;
  permissions: Array<{
    key: string;
    label: string;
    enabled: boolean;
  }>;
}

export interface AdminDictionaryItem {
  id: string;
  label: string;
  value: string;
  enabled: boolean;
  order: number;
}

export interface AdminDictionaryRecord {
  code: string;
  name: string;
  items: AdminDictionaryItem[];
}

export interface AdminNotifyTemplate {
  id: string;
  name: string;
  trigger: string;
  channels: string[];
  subject?: string;
  content: string;
  enabled: boolean;
}

export interface AdminSystemParam {
  key: string;
  value: string;
  valueType: 'string' | 'int' | 'float' | 'bool' | 'json';
  description: string;
  updatedAt: string;
}

export interface AdminGlobalAuditRecord {
  id: string;
  createdAt: string;
  actor: string;
  role: string;
  action: string;
  targetType: string;
  targetId: string;
  tenantName?: string;
  ip: string;
  userAgent: string;
  result: 'success' | 'failed';
  reason?: string;
}

export interface AdminStaffRecord {
  id: string;
  accountId?: string;
  employeeNo: string;
  name: string;
  email: string;
  phone: string;
  roleCode: AdminRoleCode | OpsRoleCode | 'R2' | 'R3';
  defaultRole?: boolean;
  team?: string;
  status: 'active' | 'frozen' | 'left';
  hiredAt: string;
  lastLoginAt?: string;
  mfaEnabled: boolean;
}

export interface AdminStaffInheritanceRoleAssignment {
  roleCode: AdminStaffRecord['roleCode'];
  successorStaffId: string;
}

export interface AdminStaffInheritancePreviewItem {
  roleCode: AdminStaffRecord['roleCode'];
  fromStaffId: string;
  fromName: string;
  successorStaffId?: string;
  successorName?: string;
  affected: Array<{
    type: string;
    label: string;
    count: number;
    examples: string[];
  }>;
}

export interface AdminStaffInheritancePreview {
  accountId: string;
  employeeName: string;
  items: AdminStaffInheritancePreviewItem[];
}

export interface AdminStaffInheritancePayload {
  accountId: string;
  assignments: AdminStaffInheritanceRoleAssignment[];
}

export interface AdminMonitoringMetric {
  id: string;
  label: string;
  value: string;
  trend?: string;
  status: 'good' | 'warn' | 'danger';
}

export interface AdminAlertRule {
  id: string;
  name: string;
  threshold: string;
  channels: string[];
  enabled: boolean;
  level: 'P1' | 'P2' | 'P3';
}
