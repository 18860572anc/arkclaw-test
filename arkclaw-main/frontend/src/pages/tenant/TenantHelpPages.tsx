import { useEffect, useMemo, useState } from 'react';
import { Spin, Tag, Typography } from '@arco-design/web-react';
import { IconPlayArrow } from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import { privacyPolicyText } from '../public/privacyPolicy';
import { serviceTermsText } from '../public/serviceTerms';
import type { TenantDocLink, TenantGuideVideo } from '../../types/domain';

const { Paragraph } = Typography;

export function TenantGuideModalContent() {
  const [videos, setVideos] = useState<TenantGuideVideo[]>();

  useEffect(() => {
    mockApi.getTenantGuideVideos().then(setVideos);
  }, []);

  const groupedVideos = useMemo(() => {
    const rows = videos ?? [];
    return {
      basic: rows.filter((item) => item.level === 'basic'),
      advanced: rows.filter((item) => item.level === 'advanced'),
    };
  }, [videos]);

  if (!videos) {
    return <Spin className="page-spin" tip="加载使用指引" />;
  }

  return (
    <div className="tenant-help-modal-content">
      <section className="tenant-help-section">
        <div className="tenant-help-section__head">
          <div><h2>入门教程</h2></div>
        </div>
        <div className="tenant-help-grid">
          {groupedVideos.basic.map((item) => (
            <GuideVideoCard item={item} key={item.id} />
          ))}
        </div>
      </section>

      <section className="tenant-help-section">
        <div className="tenant-help-section__head">
          <div><h2>高阶教程</h2></div>
        </div>
        <div className="tenant-help-grid">
          {groupedVideos.advanced.map((item) => (
            <GuideVideoCard item={item} key={item.id} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function TenantDocsModalContent() {
  const [docs, setDocs] = useState<TenantDocLink[]>();
  const [activeDoc, setActiveDoc] = useState<string>('billing');

  useEffect(() => {
    mockApi.getTenantDocLinks().then(setDocs);
  }, []);

  if (!docs) {
    return <Spin className="page-spin" tip="加载文档" />;
  }

  return (
    <div className="tenant-help-modal-content tenant-help-modal-content--docs">
      <div className="tenant-help-modal-summary">
        <Paragraph>
          这里集中放客户管理员常用的协议与说明文档。服务条款、隐私政策和 ArkClaw 计费说明都直接在弹框内查看。
        </Paragraph>
      </div>
      <div className="tenant-docs-layout">
        <aside className="tenant-docs-sidebar">
          {docs.map((item) => (
            <button
              key={item.href}
              className={`tenant-docs-nav-item ${activeDoc === item.href ? 'is-active' : ''}`}
              type="button"
              onClick={() => setActiveDoc(item.href)}
            >
              {item.title}
            </button>
          ))}
        </aside>
        <div className="tenant-docs-content">
          {activeDoc === 'billing' ? <BillingGuideContent className="purchase-billing-guide--docs" /> : null}
          {activeDoc === 'service-terms' ? <LegalDocContent text={serviceTermsText} /> : null}
          {activeDoc === 'privacy-policy' ? <LegalDocContent text={privacyPolicyText} /> : null}
        </div>
      </div>
    </div>
  );
}

export function BillingGuideContent({ className = '' }: { className?: string }) {
  return (
    <div className={`purchase-billing-guide ${className}`.trim()}>
      <p className="purchase-billing-guide__lead">
        本文主要介绍 ArkClaw 的计费方式、席位规格、规格有效期等，帮助您清晰了解相关计费规则。
      </p>

      <section>
        <h3>计费方式</h3>
        <p>
          ArkClaw 实例采用 <strong>“包年包月”</strong> 的预付费计费方式，根据您选择的
          <strong>席位规格</strong>、<strong>席位数量</strong> 和 <strong>购买时长</strong>
          收取“席位”费用。席位费用已包含您使用 ArkClaw 所需的全部计算、存储、网络资源费用。
        </p>
        <blockquote>
          包年包月是一种先付费后使用的计费方式，在需要长时间使用 ArkClaw 实例的场景中，可以通过预付多月或多年的方式购买包年包月实例。包年购买将享受更多的优惠，优惠力度请以购买页面实际下单结果为准。
        </blockquote>
      </section>

      <section>
        <h4>增值费用</h4>
        <p>在您使用 ArkClaw 的过程中，若主动调用模型服务或联网搜索服务，将采用按量付费方式进行单独计费。</p>
        <ul>
          <li>
            模型服务：当 ArkClaw 实例配置并使用模型广场的模型时，所产生的 Tokens 消耗费用将由模型服务收取。详细计费规则，请参见
            <a href="https://www.volcengine.com/docs/82379/1544681" target="_blank" rel="noreferrer">模型服务计费说明</a>。
          </li>
          <li>
            联网搜索：当 ArkClaw 触发联网搜索功能时，所产生的 <code>web_search</code> 调用次数费用将由联网搜索服务收取。详细计费规则，请参见
            <a href="https://www.volcengine.com/docs/87772/2272951" target="_blank" rel="noreferrer">联网搜索计费说明</a>。
          </li>
        </ul>
      </section>

      <section>
        <h3>席位规格</h3>
        <div className="purchase-billing-table-wrap">
          <table>
            <thead>
              <tr>
                <th>席位规格</th>
                <th>计费单元</th>
                <th>CPU</th>
                <th>内存</th>
                <th>云盘（独享持久存储）</th>
                <th>支持组合的 CodingPlan 规格</th>
                <th>适用场景</th>
                <th>费用（仅 ArkClaw）</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>轻量版 Starter</td>
                <td>arkclaw.starter</td>
                <td>2 核</td>
                <td>4 GiB</td>
                <td>60 GiB</td>
                <td>CodingPlan Team Lite</td>
                <td>适用于测试和轻度使用场景。</td>
                <td>210 元/月</td>
              </tr>
              <tr>
                <td>标准版 Standard</td>
                <td>arkclaw.standard</td>
                <td>4 核</td>
                <td>8 GiB</td>
                <td>80 GiB</td>
                <td>CodingPlan Team Lite</td>
                <td>适用于自动化办公、流程审批、知识检索等场景。</td>
                <td>430 元/月</td>
              </tr>
              <tr>
                <td>高级版 Premium</td>
                <td>arkclaw.premium</td>
                <td>8 核</td>
                <td>16 GiB</td>
                <td>160 GiB</td>
                <td>CodingPlan Team Pro</td>
                <td>适用于大规模数据处理、长文本解析等场景。</td>
                <td>860 元/月</td>
              </tr>
              <tr>
                <td>旗舰版 Ultimate</td>
                <td>arkclaw.ultimate</td>
                <td>16 核</td>
                <td>32 GiB</td>
                <td>160 GiB</td>
                <td>CodingPlan Team Pro</td>
                <td>适用于多模态处理、多智能体协同、复杂循环任务等场景。</td>
                <td>1720 元/月</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3>组合购买 CodingPlan 规则</h3>
        <p>您可以在购买 ArkClaw 席位、变更 ArkClaw 席位等操作场景中，为 ArkClaw 组合绑定 CodingPlan Team Lite 或 CodingPlan Team Pro 规格。</p>
        <h4>绑定限制与注意事项</h4>
        <ul>
          <li><strong>规格匹配限制：</strong>不同的 ArkClaw 席位规格，支持绑定的 CodingPlan 规格有所不同。详细的对应关系请参见席位规格。</li>
          <li><strong>独立购买限制：</strong>若您直接在火山方舟控制台单独下单购买了 CodingPlan，则不支持绑定至现有的 ArkClaw 席位。</li>
          <li><strong>价格说明：</strong>组合购买的最终结算价格，请以购买页面的实际下单金额为准。</li>
        </ul>
      </section>

      <section>
        <h3>有效期</h3>
        <p>
          ArkClaw 企业版的有效期为您购买的时长（以 UTC+8 时间为准），一个计费周期的起点为开通资源的时间（精确到秒），终点为到期日的 23:59:59。
        </p>
        <p>
          例如，在 2026 年 3 月 23 日 14:00:00 购买了包年包月的标准版 ArkClaw，购买时长为 1 个月，则计费周期为：2026 年 3 月 23 日 14:00:00 至 2026 年 4 月 23 日 23:59:59。
        </p>
      </section>
    </div>
  );
}

function GuideVideoCard({ item }: { item: TenantGuideVideo }) {
  return (
    <div className="tenant-guide-card">
      <button
        className="tenant-guide-card__preview"
        type="button"
        onClick={() => window.open(item.href, '_blank', 'noopener,noreferrer')}
      >
        <div className="tenant-guide-card__preview-overlay">
          <div className="tenant-guide-card__preview-head">
            <Tag className={`tenant-guide-card__tag tenant-guide-card__tag--${item.level}`}>
              {item.level === 'basic' ? '入门教程' : '高阶教程'}
            </Tag>
            <div className="tenant-guide-card__preview-meta">
              <span>{item.source}</span>
            </div>
          </div>
          <div className="tenant-guide-card__preview-body">
            <div className="tenant-guide-card__preview-copy">
              <div className="tenant-guide-card__play">
                <IconPlayArrow />
              </div>
              <span>点击预览并跳转视频号观看</span>
            </div>
          </div>
          <div className="tenant-guide-card__preview-foot">
            {item.duration ? <span>{item.duration}</span> : null}
          </div>
        </div>
        <img src="/arkclaw-mascot.png" alt="" />
      </button>
      <div className="tenant-guide-card__title">{item.title}</div>
    </div>
  );
}

function LegalDocContent({ text }: { text: string }) {
  return (
    <div className="tenant-legal-doc">
      <pre className="tenant-legal-doc__content">{text}</pre>
    </div>
  );
}
