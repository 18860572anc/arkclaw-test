import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Button as ArcoButton, Checkbox, Input, Message } from '@arco-design/web-react';
import { Link, useLocation } from 'react-router-dom';
import './official-site.css';
import { privacyPolicyText } from '../public/privacyPolicy';
import { serviceTermsText } from '../public/serviceTerms';
import {
  AssistantEngineeringVisual,
  AssistantHrVisual,
  AssistantMarketVisual,
  AssistantOfficeVisual,
  CaseVisual,
  ContactScene,
  HeroVisual,
  SecurityVisual,
  TierIcon,
} from './OfficialIllustrations';

const TextArea = Input.TextArea;
const SITE_HOTLINE = '400-650-0030';

interface TierDefinition {
  key: 'starter' | 'standard' | 'premium' | 'ultimate';
  name: string;
  label: string;
  desc: string;
  features: string[];
  iconBg: string;
  iconColor: string;
  gradient: string;
}

const TIERS: TierDefinition[] = [
  {
    key: 'starter',
    name: 'Starter',
    label: '轻量版',
    desc: '适用于简易测试与产品试用，满足基础验证场景需求。',
    features: ['2 核 CPU / 4GB 运行内存', '40GB 持久存储云盘空间', '企业网盘 10GB 配额', '基础模型安全防火墙', '支持飞书 / 企业微信 / 钉钉登录', '自然语生成 Skill'],
    iconBg: '#E8F0FF',
    iconColor: '#1664FF',
    gradient: 'linear-gradient(90deg, #93B5FF, #1664FF)',
  },
  {
    key: 'standard',
    name: 'Standard',
    label: '标准版',
    desc: '适用于自动化办公、定时任务、流程审批与知识检索场景。',
    features: ['4 核 CPU / 8GB 运行内存', '80GB 持久存储云盘空间', '企业网盘 20GB 配额', 'Skill 风险扫描与防数据泄漏', '企业 AD 体系打通', '安全访问企业内部服务', '灵活模型切换与 Token 管理'],
    iconBg: '#EEEAFF',
    iconColor: '#7B6CFF',
    gradient: 'linear-gradient(90deg, #C7B6FF, #7B6CFF)',
  },
  {
    key: 'premium',
    name: 'Premium',
    label: '高级版',
    desc: '适用于高频技能执行、大数据处理与视觉识别场景。',
    features: ['8 核 CPU / 16GB 运行内存', '160GB 持久存储云盘空间', '企业网盘 40GB 配额', '零信任鉴权与运行安全控制', '企业私有 Skill 仓库', 'Claw Team 蜂群式任务执行', '个人 / 企业记忆隔离', '智能节省模型 Token'],
    iconBg: '#E0F7FF',
    iconColor: '#0EA5E9',
    gradient: 'linear-gradient(90deg, #93D8FF, #0EA5E9)',
  },
  {
    key: 'ultimate',
    name: 'Ultimate',
    label: '旗舰版',
    desc: '适用于多模态处理、多智能体协同与复杂多轮推理任务。',
    features: ['16 核 CPU / 32GB 运行内存', '160GB 持久存储云盘空间', '企业网盘 80GB 配额', '端到端审计追源', 'Skill 注册发现与治理', '数字工厂快速克隆应用', '自动升级与免运维', '问答 / 助手 / Agent 模式切换'],
    iconBg: '#FFF0E5',
    iconColor: '#FF7A38',
    gradient: 'linear-gradient(90deg, #FFC79A, #FF7A38)',
  },
];

const ASSISTANTS = [
  {
    key: 'office',
    label: '办公自动化助手',
    title: '办公自动化助手',
    points: [
      ['会议纪要自动整理', '一键转写录音、提取行动项与负责人，自动同步到日历与任务系统。'],
      ['智能日程与文档', '基于上下文起草日报、周报与项目报告，让重复行政工作不再占用时间。'],
    ],
    Visual: AssistantOfficeVisual,
  },
  {
    key: 'hr',
    label: 'HR 助手',
    title: 'HR 智能招聘助手',
    points: [
      ['简历智能筛选', 'AI 解析与岗位 JD 匹配，剔除噪声候选人，聚焦真正合适的人选。'],
      ['人才画像与面试', '自动生成结构化面试题与评估表，沉淀团队招聘标准。'],
      ['入职体验闭环', '员工入职、合规、培训、绩效一站式跟进，减少 HR 重复工作。'],
    ],
    Visual: AssistantHrVisual,
  },
  {
    key: 'rd',
    label: '研发助手',
    title: '智能研发协作助手',
    points: [
      ['代码理解与生成', '基于代码库上下文给出补全与重构建议，支持私有代码 RAG 索引。'],
      ['测试与代码审查', '自动生成单元测试与回归用例，识别潜在风险并给出修复建议。'],
      ['研发知识沉淀', '汇聚架构决策、API 文档与变更记录，形成可检索的研发记忆体系。'],
    ],
    Visual: AssistantEngineeringVisual,
  },
  {
    key: 'mkt',
    label: '营销助手',
    title: '营销内容智能创作',
    points: [
      ['多模态内容生产', '根据产品与人群标签批量生产文案、图像与短视频脚本，多语种一键覆盖。'],
      ['投放分析与优化', '接入投放数据自动分析 CTR / ROI，输出下一周的素材与人群建议。'],
    ],
    Visual: AssistantMarketVisual,
  },
];

const SECURITY = [
  ['cube', '精细配额成本可控', '空间 / 部门 / 个人三层配额精控，统一模型网关与智能风控，保障合规与成本可控。'],
  ['doc', '统一身份操作可溯', 'SSO 统一身份接入，细粒度权限与操作审计，让每次 AI 调用都有可追溯。'],
  ['cloud', '专属网络高效互联', '双层安全边界与精细访问控制，轻松互通云上与本地服务。'],
  ['search', '可观可控高效运维', '双粒度监控、完整审计与批量运维，让系统状态实时可见。'],
  ['shield', '全域防护安全合规', '覆盖权限、运行态与供应链全链路防护，提供安全运行底座。'],
  ['sso', '企业 Skill 能力引擎', '打通官方生态与自建 Skill，统一上架、审核、分发与治理。'],
  ['aiAssist', '智能网盘知识中枢', '打造企业知识中心，提供团队办公一站式存储、传输与分析能力。'],
  ['audit', '记忆高效准更省', '统一沉淀多端多模态记忆，提升回答准确率并节省 Token 与算力。'],
] as const;

const CASES = [
  {
    key: 'auto',
    tab: '某知名车企',
    title: '某知名汽车制造集团',
    desc: '基于 ArkClaw 企业版构建覆盖研发、生产、销售的一体化智能协同底座，把 BOM 文档、设计变更与产线问题汇入企业记忆体，跨部门检索响应时间从天级缩短到分钟级。',
    stats: [
      ['38', '%', '研发协同提速'],
      ['6.4', '万', '员工接入使用'],
      ['99.99', '%', '服务可用性'],
    ],
    visual: 'auto',
  },
  {
    key: 'internet',
    tab: '某互联网公司',
    title: '某头部互联网公司',
    desc: '打造覆盖办公与业务的双轨智能化方案，对内实现附件去标、信息分类、邮件汇总等办公自动化，对外支持营销分析洞察与业务表达提效。',
    stats: [
      ['187', '%', '营销 CTR 提升'],
      ['12', 'min', '日报汇总耗时'],
      ['4.2', '万', '日均交互量'],
    ],
    visual: 'internet',
  },
  {
    key: 'electronics',
    tab: '某消费电子公司',
    title: '某消费电子公司',
    desc: '将自研 IM 工具接入 ArkClaw 体系，无缝衔接内部办公平台，使员工在原有办公体系下快速获得智能化能力，有效提升日常办公效率。',
    stats: [
      ['5x', '', '问答响应速度'],
      ['82', '%', '一次解决率'],
      ['3.8', '万', '日活跃员工'],
    ],
    visual: 'electronics',
  },
  {
    key: 'info',
    tab: '某互联网资讯平台',
    title: '某互联网资讯平台',
    desc: '通过打通业务内网、云上网络体系与 AI 大模型，实现智能问数、生成内容质检和分发各场景的智能升级，显著提升工作流程与决策效率。',
    stats: [
      ['64', '%', '内容生产效率'],
      ['2.1', '亿', '月活跃用户覆盖'],
      ['24/7', '', '智能值班体系'],
    ],
    visual: 'info',
  },
];

const ACTIVITY_PRODUCTS = [
  {
    key: 'lite',
    icon: 'claw',
    title: 'ArkClaw 轻量版套餐',
    price: '50.00',
    unit: '/1个月',
    listPrice: '刊例价：¥99',
    ribbon: '-49% extra 入门首选',
    tags: ['新客首单礼', '1个月'],
    summary: '套餐包含方舟 Coding Plan Lite',
    features: ['适配个人智能体基础场景', '基础算力，2C4G 支撑基础任务稳定运行', '含大模型额度套餐', '支持 Doubao/GLM/DeepSeek 模型切换', '独享 40GB 持久存储空间', '专属助理，一键部署 ArkClaw'],
  },
  {
    key: 'standard',
    icon: 'claw',
    title: 'ArkClaw 标准版套餐',
    price: '230.00',
    unit: '/1个月',
    listPrice: '刊例价：¥318',
    ribbon: '-27% extra 更高性能',
    tags: ['新客首单礼', '1个月'],
    summary: '套餐包含方舟 Coding Plan Pro',
    features: ['适配个人工作流无缝接入', '进阶算力，4C8G 支持专业任务高效运行', '5 倍于 Coding Plan Lite 套餐', '支持 Doubao/GLM/DeepSeek 模型切换', '独享 60GB 持久存储空间', '支持AI 助手安全标准版'],
  },
  {
    key: 'doubao',
    icon: 'model',
    title: '豆包大模型 2.0',
    price: '19.00',
    unit: '/约1千tokens',
    listPrice: '刊例价：¥50',
    ribbon: '-62% extra 春晚同款模型',
    tags: ['新客首单礼', 'AI统一节省计划', '1个月'],
    summary: '多模态Agent智驭复杂任务',
    features: ['Agent时代原生', '更强复杂推理能力', '长链路任务执行', '多模态内容理解', '长上下文推理升级', '结构化结果输出'],
  },
  {
    key: 'video',
    icon: 'video',
    title: '豆包视频创作模型 1.5',
    price: '19.00',
    unit: '/约62个视频',
    listPrice: '刊例价：¥50',
    ribbon: '-62% extra 春晚同款模型',
    tags: ['新客首单礼', 'AI统一节省计划', '1个月'],
    summary: '音画联动生成电影质感片段',
    features: ['音视频联合生成', '毫秒级音画同步', '多人多语言对白', '还原真实对话质感', '动作精准流畅', '影视级叙事张力'],
  },
] as const;

function ActivityProductIcon({ type }: { type: (typeof ACTIVITY_PRODUCTS)[number]['icon'] }) {
  if (type === 'video') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="5" y="7" width="22" height="18" rx="5" fill="currentColor" opacity="0.92" />
        <path d="M14 12.5v7l6-3.5-6-3.5z" fill="#fff" />
      </svg>
    );
  }

  if (type === 'model') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M9 5h6v4H9V5zm8 0h6v4h-6V5zM5 13h6v6H5v-6zm16 0h6v6h-6v-6zM9 23h6v4H9v-4zm8 0h6v4h-6v-4z" fill="currentColor" opacity="0.95" />
        <path d="M12 16h8M16 9v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.42" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M25.3 10.8c-2.2-2.4-5.4-3.7-8.9-3.7C9.4 7.1 4 12.2 4 18.7c0 2.7 2.1 5 4.8 5.1 2.1.1 3.8-1.1 4.8-2.9.8-1.5 1.7-2.2 3-2.2 1.1 0 1.8.5 2.4 1.2l-2.8 1.9 2.1 3 8.1-5.5-5.6-8.1-3 2.1 1.8 2.7c-.9-.4-1.9-.7-3-.7-2.7 0-4.7 1.4-6.1 4-.4.8-1 1.1-1.6 1.1-.7 0-1.2-.6-1.2-1.4 0-4.4 3.7-7.9 8.7-7.9 2.5 0 4.6.9 6 2.4l2.9-2.7z" fill="currentColor" />
    </svg>
  );
}

function SiteLogo({ withSub = true }: { withSub?: boolean }) {
  return (
    <Link to="/" className="site-logo">
      <svg className="site-logo__mark" viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id="site-logo-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1664FF" />
            <stop offset="100%" stopColor="#7B6CFF" />
          </linearGradient>
        </defs>
        <path d="M16 3 L28 10 V22 L16 29 L4 22 V10 Z" fill="url(#site-logo-gradient)" />
        <path d="M16 3 L28 10 L16 17 L4 10 Z" fill="#fff" opacity="0.25" />
        <path d="M11 19 L16 11 L21 19 H18 L17 17 H15 L14 19 Z" fill="#fff" />
      </svg>
      <span>ArkClaw</span>
      {withSub ? <span className="site-logo__sub">云脑智联</span> : null}
    </Link>
  );
}

function useAnchorScroll() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const element = document.getElementById(location.hash.slice(1));
    if (element) {
      window.setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  }, [location.hash, location.pathname]);
}

function SiteNavBar() {
  return (
    <header className="site-nav">
      <div className="site-wrap site-nav__inner">
        <SiteLogo />
        <nav className="site-nav__links">
          <Link to="/2026/newyear">活动</Link>
          <a href="/#tiers">价格</a>
          <a href="/#cases">客户案例</a>
          <a href="/#about">了解 ArkClaw</a>
        </nav>
        <div className="site-nav__cta">
          <Link to="/login" className="site-btn site-btn--nav">
            前往使用
          </Link>
        </div>
      </div>
    </header>
  );
}

function ActivityNavBar() {
  return (
    <header className="activity-nav">
      <div className="activity-nav__inner">
        <Link to="/" className="activity-logo">
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M4 25L14 5v20H4z" fill="#16A9FF" />
            <path d="M15 25L24 8l4 17H15z" fill="#1B66FF" />
            <path d="M13 25l7-12 4 12H13z" fill="#62D7FF" />
          </svg>
          <span>火山引擎</span>
        </Link>
        <nav className="activity-nav__links">
          <Link to="#activity-products">开工购爆款</Link>
          <Link to="#activity-products">开工送精品</Link>
          <Link to="#activity-products">开工有优惠</Link>
          <Link to="#activity-products">开工有创意</Link>
        </nav>
        <Link to="/" className="activity-nav__cloud" aria-label="返回官网">
          云
        </Link>
      </div>
    </header>
  );
}

function FloatingPanel() {
  return (
    <div className="site-float-panel" aria-label="quick actions">
      <Link to="/contact">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M4 4h16v12H7l-3 3V4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        在线咨询
      </Link>
      <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 19V6M5 12l7-7 7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        回顶
      </button>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer" id="about">
      <div className="site-wrap">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <SiteLogo />
            <p>ArkClaw 云脑智联，企业级智能化办公平台。让 AI 真正落入业务，让组织更聪明地协作。</p>
          </div>
          <div className="site-footer__contact">
            <div className="site-footer__contact-label">商务合作热线</div>
            <a className="phone" href={`tel:${SITE_HOTLINE.replace(/-/g, '')}`}>
              {SITE_HOTLINE}
            </a>
            <p className="site-footer__contact-copy">欢迎电话咨询，或前往联系页提交业务需求，我们会尽快与您对接。</p>
            <div className="site-footer__actions">
              <Link to="/contact" className="site-btn site-btn--primary site-btn--compact">
                立即咨询
              </Link>
            </div>
          </div>
        </div>
        <div className="site-footer__bottom">
          <span>© 2026 云脑智联 ArkClaw. 保留所有权利。</span>
          <div className="links">
            <Link to="/service-terms">服务条款</Link>
            <Link to="/privacy-policy">隐私政策</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SiteServices() {
  return (
    <section className="site-services">
      <div className="site-wrap site-services__grid">
        {[
          ['专属架构师服务', '一对一上云方案设计'],
          ['免费试用资格', '14 天完整功能试用'],
          ['专家培训认证', '产品 / 实施认证体系'],
          ['7×24 技术支持', '中英双语金牌响应'],
        ].map(([title, text]) => (
          <div key={title} className="site-service">
            <div className="site-service__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="site-service__text">
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function OfficialPageChrome({
  children,
  className = '',
  nav = <SiteNavBar />,
  showServices = true,
  showFooter = true,
  showFloat = true,
}: {
  children: ReactNode;
  className?: string;
  nav?: ReactNode;
  showServices?: boolean;
  showFooter?: boolean;
  showFloat?: boolean;
}) {
  useAnchorScroll();

  return (
    <div className={`official-site${className ? ` ${className}` : ''}`}>
      {nav}
      {children}
      {showServices ? <SiteServices /> : null}
      {showFooter ? <SiteFooter /> : null}
      {showFloat ? <FloatingPanel /> : null}
    </div>
  );
}

export function OfficialNewYearActivityPage() {
  return (
    <OfficialPageChrome className="official-site--activity" nav={<ActivityNavBar />} showServices={false} showFooter={false} showFloat={false}>
      <main className="activity-page">
        <section className="activity-hero">
          <div className="activity-sweep activity-sweep--left" aria-hidden="true" />
          <div className="activity-sweep activity-sweep--right" aria-hidden="true" />
          <div className="site-wrap activity-hero__inner">
            <div className="activity-hero__copy">
              <h1>开工养虾季</h1>
              <p>ArkClaw套餐首月50元起，豆包旗舰模型19元购</p>
              <Link to="/tenant/purchase" className="activity-hero__button">
                即刻订阅养虾套餐
              </Link>
            </div>
            <div className="activity-hero__scene" aria-hidden="true">
              <div className="activity-hero__track" />
              <div className="activity-hero__star activity-hero__star--left" />
              <div className="activity-hero__sale">SALE</div>
              <div className="activity-hero__ticket" />
              <div className="activity-hero__gift">
                <span />
              </div>
              <img className="activity-hero__mascot" src="/arkclaw-mascot.png" alt="" />
            </div>
          </div>
        </section>

        <section className="activity-products" id="activity-products">
          <div className="site-wrap">
            <div className="activity-products__head">
              <Link to="#activity-rules">查看活动规则</Link>
              <h2>开工购爆款</h2>
              <p>来ArkClaw零门槛养虾，开箱即用</p>
            </div>

            <div className="activity-product-grid">
              {ACTIVITY_PRODUCTS.map((product) => (
                <article key={product.key} className="activity-product-card">
                  <div className="activity-product-card__ribbon">{product.ribbon}</div>
                  <div className={`activity-product-card__icon activity-product-card__icon--${product.icon}`}>
                    <ActivityProductIcon type={product.icon} />
                  </div>
                  <h3>{product.title}</h3>
                  <div className="activity-product-card__price">
                    <strong>¥{product.price}</strong>
                    <span>{product.unit}</span>
                    <em>{product.listPrice}</em>
                  </div>
                  <div className="activity-product-card__tags">
                    {product.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <Link to="/tenant/purchase" className="activity-product-card__button">
                    立即购买
                  </Link>
                  <div className="activity-product-card__summary">{product.summary}</div>
                  <ul>
                    {product.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="activity-rules" id="activity-rules">
          <div className="site-wrap">
            <div className="activity-rules__panel">
              <h2>活动规则</h2>
              <div className="activity-rules__grid">
                <div>
                  <strong>活动对象</strong>
                  <span>面向首次购买 ArkClaw 套餐或豆包模型包的新客户。</span>
                </div>
                <div>
                  <strong>优惠说明</strong>
                  <span>活动价以购买页实际下单金额为准，同一账号同类商品限享一次。</span>
                </div>
                <div>
                  <strong>开通方式</strong>
                  <span>完成下单后进入租户开通流程，可按需配置模型、席位与安全能力。</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </OfficialPageChrome>
  );
}

export function OfficialHomePage() {
  const [activeAssistant, setActiveAssistant] = useState('office');
  const [activeCase, setActiveCase] = useState('auto');

  const assistant = useMemo(() => ASSISTANTS.find((item) => item.key === activeAssistant) ?? ASSISTANTS[0], [activeAssistant]);
  const currentCase = useMemo(() => CASES.find((item) => item.key === activeCase) ?? CASES[0], [activeCase]);
  const AssistantVisual = assistant.Visual;

  return (
    <OfficialPageChrome>
      <main>
        <section className="site-hero">
          <div className="site-wrap site-hero__grid">
            <div>
              <h1>
                ArkClaw <span>企业版</span>
              </h1>
              <h2>安全可控的生产力平台</h2>
              <p>
                一站式企业数字化效率智能体平台，帮助企业完成各方位生产力跃迁。让 AI 落入业务流程，把员工的核心精力还给真正重要的工作。
              </p>
              <div className="site-hero__actions">
                <Link to="/contact" className="site-btn site-btn--primary">
                  立即咨询
                </Link>
              </div>
            </div>
            <div className="site-hero__visual">
              <HeroVisual />
            </div>
          </div>
        </section>

        <section className="site-section" id="tiers">
          <div className="site-wrap">
            <div className="site-section__head">
              <h2>多种产品规格，满足多样需求</h2>
              <p>从初创团队到超大规模集团，每一阶段都有匹配的部署形态与服务承诺。</p>
            </div>
            <div className="site-tier-grid">
              {TIERS.map((tier) => (
                <article key={tier.key} className="site-tier-card" style={{ ['--site-card-gradient' as string]: tier.gradient, ['--site-icon-bg' as string]: tier.iconBg, ['--site-icon-color' as string]: tier.iconColor }}>
                  <div className="site-tier-card__header">
                    <div className="site-tier-card__icon">
                      <TierIcon name={tier.key} />
                    </div>
                    <div className="site-tier-card__name">
                      {tier.name}
                      <strong>{tier.label}</strong>
                    </div>
                  </div>
                  <p className="site-tier-card__desc">{tier.desc}</p>
                  <ul className="site-tier-card__list">
                    {tier.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <Link to="/contact" className="site-link-arrow">
                    查看详情
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="site-section site-section--alt" id="assistants">
          <div className="site-wrap">
            <div className="site-section__head">
              <h2>多类型 7×24 小时在线智能伙伴，专业可靠</h2>
              <p>围绕企业核心场景预置成熟智能体，覆盖办公、人力、研发、营销四大角色，可按需组合扩展。</p>
            </div>
            <div className="site-pill-tabs">
              {ASSISTANTS.map((item) => (
                <button key={item.key} type="button" className={item.key === activeAssistant ? 'is-active' : ''} onClick={() => setActiveAssistant(item.key)}>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="site-assistant-card">
              <div className="site-assistant-card__text">
                <h3>{assistant.title}</h3>
                <ul>
                  {assistant.points.map(([strong, text]) => (
                    <li key={strong}>
                      <span>
                        <strong>{strong}：</strong>
                        {text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link to="/contact" className="site-btn site-btn--primary">
                  立即体验
                </Link>
              </div>
              <div className="site-assistant-card__visual">
                <AssistantVisual />
              </div>
            </div>
          </div>
        </section>

        <section className="site-section">
          <div className="site-wrap">
            <div className="site-section__head">
              <h2>企业级安全管控，全场景自动化高可用</h2>
              <p>让 AI 在企业内看得见、管得住、跑得稳。8 个核心管控模块，开箱即用。</p>
            </div>
            <div className="site-feature-grid">
              {SECURITY.map(([kind, title, desc]) => (
                <article key={kind} className="site-feature-card">
                  <h3>{title}</h3>
                  <p>{desc}</p>
                  <div className="site-feature-card__visual">
                    <SecurityVisual kind={kind} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="site-section site-section--alt" id="cases">
          <div className="site-wrap">
            <div className="site-section__head">
              <h2>来自企业客户的信任</h2>
              <p>赋能多行业，加速企业智能化转型。</p>
            </div>
            <div className="site-case-card">
              <div className="site-case-card__grid">
                <div className="site-case-card__text">
                  <div className="site-case-tabs">
                    {CASES.map((item) => (
                      <button key={item.key} type="button" className={item.key === activeCase ? 'is-active' : ''} onClick={() => setActiveCase(item.key)}>
                        {item.tab}
                      </button>
                    ))}
                  </div>
                  <h3>{currentCase.title}</h3>
                  <p>{currentCase.desc}</p>
                  <div className="site-case-stats">
                    {currentCase.stats.map(([num, unit, label]) => (
                      <div key={label}>
                        <div className="num">
                          {num}
                          <em>{unit}</em>
                        </div>
                        <div className="label">{label}</div>
                      </div>
                    ))}
                  </div>
                  <Link to="/contact" className="site-btn site-btn--primary">
                    立即咨询
                  </Link>
                </div>
                <div className="site-case-card__visual">
                  <CaseVisual kind={currentCase.visual} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="site-trust-strip">
          <div className="site-wrap">
            <div className="site-trust-strip__head">已服务 200+ 行业客户，覆盖金融、制造、能源、互联网、零售</div>
            <div className="site-trust-strip__grid">
              {['某汽车集团', '某能源国央', '某互联网巨擘', '某消费电子', '某金融银行', '某地产集团'].map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="site-cta">
          <div className="site-wrap site-cta__inner">
            <div>
              <h2>准备好让 AI 真正落入业务？</h2>
              <p>预约 30 分钟咨询，我们的解决方案专家将为您量身定制 ArkClaw 落地路径。</p>
            </div>
            <div className="site-cta__actions">
              <Link to="/contact" className="site-btn site-btn--primary site-btn--light">
                立即咨询 →
              </Link>
              <Link to="/login" className="site-btn site-btn--ghost site-btn--on-dark">
                查看产品后台
              </Link>
            </div>
          </div>
        </section>
      </main>
    </OfficialPageChrome>
  );
}

export function OfficialContactPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    code: '',
    company: '',
    desc: '',
    agree: false,
  });
  const [codeSent, setCodeSent] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (codeSent <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => setCodeSent((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [codeSent]);

  const isPhoneValid = /^1[3-9]\d{9}$/.test(form.phone);
  const isFormValid = Boolean(form.name && isPhoneValid && form.code && form.company && form.agree);

  function updateField<Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function sendCode() {
    if (!isPhoneValid) {
      Message.error('请输入正确的手机号');
      return;
    }

    setCodeSent(60);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.agree) {
      Message.error('请先同意服务条款');
      return;
    }

    if (!form.name || !form.phone || !form.code || !form.company) {
      Message.error('请填写所有必填项');
      return;
    }

    setSubmitted(true);
  }

  return (
    <div className="official-site">
      <SiteNavBar />
      <main className="site-contact-page">
        <section className="site-contact-page__left">
          <div className="site-contact-page__intro">
            <h1>云脑智联</h1>
            <p className="subhead">一键开启企业增长新空间</p>
          </div>
          <div className="site-value-list">
            {[
              ['敏捷迭代', '#1664FF', '极致敏捷数字底座', '从通用云原生走向融合化、行业化，保障云上安全。'],
              ['数据驱动', '#7B6CFF', '数据业务决策科学', '帮助企业以数据驱动业务，构建全链路数据体系。'],
              ['体验提升', '#38BDF8', '持续提升互动体验', '让内容与交互超越传统界限，不断升级体验。'],
            ].map(([pill, color, title, text]) => (
              <div key={title} className="site-value-card">
                <span className="site-value-card__pill" style={{ background: color as string }}>
                  {pill}
                </span>
                <div className="site-value-card__text">
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="site-contact-page__scene">
            <ContactScene />
          </div>
        </section>

        <section className="site-contact-page__right">
          <div className="site-contact-form-panel">
            <h2>ArkClaw 企业版</h2>
            <p>ArkClaw 企业版，开启全可控的生产力平台</p>

            {submitted ? (
              <div className="site-success-banner">
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15" />
                  <path d="M5 8.5l2 2 4-5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                提交成功，我们将在 1 个工作日内与您联系。
              </div>
            ) : null}

            <form onSubmit={submit} className="site-contact-form">
              <div className="site-contact-form__field">
                <div className="site-contact-form__label site-contact-form__label--required">联系人</div>
                <div className="site-contact-form__control">
                  <Input
                    className="site-contact-input"
                    value={form.name}
                    onChange={(value) => updateField('name', value)}
                    placeholder="请输入联系人姓名"
                  />
                </div>
              </div>

              <div className="site-contact-form__field">
                <div className="site-contact-form__label site-contact-form__label--required">联系电话</div>
                <div className="site-contact-form__control">
                  <Input
                    className="site-contact-input"
                    value={form.phone}
                    onChange={(value) => updateField('phone', value)}
                    placeholder="请输入联系人手机号"
                    maxLength={11}
                  />
                </div>
              </div>

              <div className="site-contact-form__field">
                <div className="site-contact-form__label site-contact-form__label--required">验证码</div>
                <div className="site-contact-form__control">
                  <div className="site-contact-form__row">
                    <Input
                      className="site-contact-input"
                      value={form.code}
                      onChange={(value) => updateField('code', value)}
                      placeholder="请输入验证码"
                      maxLength={6}
                    />
                    <ArcoButton type="default" className="site-contact-code-btn" disabled={codeSent > 0} onClick={sendCode}>
                      {codeSent > 0 ? `${codeSent}s 后重发` : '发送验证码'}
                    </ArcoButton>
                  </div>
                </div>
              </div>

              <div className="site-contact-form__field">
                <div className="site-contact-form__label site-contact-form__label--required">公司名称</div>
                <div className="site-contact-form__control">
                  <Input
                    className="site-contact-input"
                    value={form.company}
                    onChange={(value) => updateField('company', value)}
                    placeholder="请输入公司名称"
                  />
                </div>
              </div>

              <div className="site-contact-form__field site-contact-form__field--top">
                <div className="site-contact-form__label">咨询问题(可选)</div>
                <div className="site-contact-form__control">
                  <TextArea
                    className="site-contact-textarea"
                    value={form.desc}
                    onChange={(value) => updateField('desc', value.slice(0, 255))}
                    placeholder="期待将您的业务需求反馈给我们"
                    maxLength={255}
                    autoSize={{ minRows: 4, maxRows: 4 }}
                  />
                  <small>{form.desc.length}/255</small>
                </div>
              </div>

              <div className="site-contact-form__agree">
                <div className="site-contact-form__label" />
                <div className="site-contact-form__row">
                  <Checkbox checked={form.agree} onChange={(checked) => updateField('agree', checked)}>
                    已阅读并同意云脑智联 <Link to="/service-terms">服务条款</Link> 和 <Link to="/privacy-policy">隐私政策</Link>
                  </Checkbox>
                </div>
              </div>

              <div className="site-contact-form__submit-row">
                <div className="site-contact-form__label" />
                <div className="site-contact-form__control">
                  <ArcoButton htmlType="submit" type="primary" className="site-contact-form__submit" disabled={!isFormValid}>
                    提交
                  </ArcoButton>
                </div>
              </div>
            </form>

            <div className="site-contact-form__foot">
              表单提交后，会有工作人员与您电话联系
              <br />
              如您现在有需要帮助，可立即拨打 <strong>{SITE_HOTLINE}</strong> 与我们联系
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function OfficialLegalPage({
  title,
  description,
  content,
}: {
  title: string;
  description: string;
  content: string;
}) {
  return (
    <OfficialPageChrome showServices={false} showFloat={false}>
      <main className="site-legal-page">
        <div className="site-wrap">
          <section className="site-legal-card">
            <div className="site-legal-card__head">
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            <pre className="site-legal-content">{content}</pre>
          </section>
        </div>
      </main>
    </OfficialPageChrome>
  );
}

export function OfficialServiceTermsPage() {
  return <OfficialLegalPage title="服务条款" description="查看云脑智联官网及相关服务的使用约定。" content={serviceTermsText} />;
}

export function OfficialPrivacyPolicyPage() {
  return <OfficialLegalPage title="隐私政策" description="查看云脑智联对用户个人信息的处理与保护说明。" content={privacyPolicyText} />;
}
