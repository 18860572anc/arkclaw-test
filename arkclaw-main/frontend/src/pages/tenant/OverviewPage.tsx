import { useEffect, useState } from 'react';
import { Button, Drawer, Message, Progress, Spin, Typography } from '@arco-design/web-react';
import {
  IconCopy,
  IconLaunch,
  IconPen,
} from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '../../services/mockApi';
import type { OverviewData, SeatPlan } from '../../types/domain';

const { Text } = Typography;

const metricValue = (data: OverviewData, label: string) =>
  data.metrics.find((item) => item.label === label)?.value ?? '-';

const tokenLimitText = (value?: number) => (value && value > 0 ? `${value} 百万` : '无限制');

export default function OverviewPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<OverviewData>();
  const [guideVisible, setGuideVisible] = useState(false);

  useEffect(() => {
    mockApi.getOverview().then(setData);
  }, []);

  const copyText = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    Message.success(`${label}已复制`);
  };

  if (!data) {
    return <Spin className="page-spin" tip="加载空间概览" />;
  }

  return (
    <div className="a0-page">
      <div className="a0-title-row">
        <h1>空间概览</h1>
        <span>ID: {data.tenant.volcSpaceId}</span>
        <Button className="inline-icon-button" icon={<IconCopy />} size="mini" type="text" />
      </div>

      <div className="a0-guide">
        <div className="a0-guide__main">
          <div className="a0-guide__title">请先按照 指引 完成配置，再进行员工登录链接分发</div>
          <div className="a0-guide__items">
            <span className="guide-index">1</span>
            <Text>企业微信授权回调地址：</Text>
            <Text>{data.guide.authCallbackUrl}</Text>
            <Button className="inline-icon-button" icon={<IconCopy />} size="mini" type="text" onClick={() => copyText(data.guide.authCallbackUrl, '授权回调地址')} />
            <Button type="text" size="mini" onClick={() => setGuideVisible(true)}>去配置</Button>
            <IconLaunch className="guide-link-icon" />
            <span className="guide-spacer" />
            <span className="guide-index">2</span>
            <Text>员工登录链接：</Text>
            <Text>{data.guide.employeeLoginUrl}</Text>
            <Button className="inline-icon-button" icon={<IconCopy />} size="mini" type="text" onClick={() => copyText(data.guide.employeeLoginUrl, '员工登录链接')} />
          </div>
        </div>
        <Button className="dark-button" onClick={() => setGuideVisible(true)}>查看指引</Button>
      </div>

      <section className="a0-section">
        <h2>Claw 运营监控</h2>
        <div className="operation-panel">
          <div className="operation-metric">
            <Text>Claw 实例总数</Text>
            <strong>{metricValue(data, 'Claw 实例总数')}</strong>
          </div>
          <div className="operation-metric">
            <Text>活跃的用户</Text>
            <strong>{metricValue(data, '活跃的用户')}</strong>
          </div>
        </div>
      </section>

      <section className="a0-section a0-section--model">
        <div className="section-heading">
          <h2>模型配置</h2>
        </div>
        <div className="model-panel">
          <div className="model-grid">
            {data.modelConfigs.map((config) => (
              <div className="model-column" key={config.level}>
                <h3>{config.name}</h3>
                <InfoRow label="默认模型" value={config.defaultModel} modelIcon={config.defaultModel !== '-'} />
                <InfoRow label="默认模型来源" value={config.plan} />
                <InfoRow label="可选模型" value={String(config.optionalModels)} link />
              </div>
            ))}
          </div>
          <h3 className="model-limit-title">模型限流</h3>
          <div className="model-limit-grid">
            <InfoRow label="单个 Claw 每分钟 Token 上限" value={tokenLimitText(data.modelConfigs[0]?.minuteTokenLimit)} />
            <InfoRow label="单个 Claw 每日 Token 上限" value={tokenLimitText(data.modelConfigs[0]?.dailyTokenLimit)} />
          </div>
        </div>
      </section>

      <section className="a0-section">
        <div className="section-heading">
          <h2>席位概览</h2>
          <Button className="a0-link-button" type="text" size="mini" onClick={() => navigate('/tenant/seats')}>查看详情</Button>
        </div>
        <div className="seat-overview-grid">
          {data.seats.map((seat) => (
            <SeatOverviewCard seat={seat} key={seat.level} />
          ))}
        </div>
      </section>

      <Drawer
        width={600}
        title="员工登录链接分发指引"
        visible={guideVisible}
        className="overview-guide-drawer"
        onCancel={() => setGuideVisible(false)}
        footer={(
          <div className="tenant-network-drawer-footer">
            <Button onClick={() => setGuideVisible(false)}>取消</Button>
            <Button type="primary" onClick={() => setGuideVisible(false)}>确定</Button>
          </div>
        )}
      >
        <div className="overview-guide-drawer__body">
          <div className="overview-guide-drawer__tip">
            <IconLaunch />
            <span>1 个企业微信企业应用仅需在首次创建时配置一次；如修改了企业微信应用的 agent id/secret，需要按照以下步骤重新配置。</span>
          </div>

          <section className="overview-guide-step">
            <div className="overview-guide-step__title">
              <span>1</span>
              <strong>复制授权回调域</strong>
            </div>
            <div className="overview-guide-copy-row">
              <span>{data.guide.authCallbackUrl}</span>
              <Button icon={<IconCopy />} type="text" size="mini" onClick={() => copyText(data.guide.authCallbackUrl, '授权回调地址')} />
            </div>
          </section>

          <section className="overview-guide-step">
            <div className="overview-guide-step__title">
              <span>2</span>
              <strong>配置企业微信应用</strong>
            </div>
            <ol className="overview-guide-list">
              <li>登录企业微信开放平台，进入你的应用（应用管理 / 自建），或直接点击跳转。</li>
              <li>配置企业微信授权登录，输入上一步复制的域名，保存配置。</li>
            </ol>

            <div className="overview-guide-panel">
              <div className="overview-guide-panel__grid">
                <div className="overview-guide-panel__card">
                  <strong>网页授权登录与 JS-SDK</strong>
                  <span>可管理包含下列网页可使用网页授权以及 JS-SDK。</span>
                  <button type="button">设置可信域名</button>
                </div>
                <div className="overview-guide-panel__card">
                  <strong>企业微信授权登录</strong>
                  <span>使用企业微信账号登录已有的 Web 应用或移动 App。</span>
                  <button type="button">设置</button>
                </div>
                <div className="overview-guide-panel__card">
                  <strong>可信域 IP</strong>
                  <span>配置企业可信 IP 白名单，在专属出口使用时需校验。</span>
                  <button type="button">设置</button>
                </div>
              </div>
            </div>

            <div className="overview-guide-subcard">
              <strong>设置可信域名</strong>
              <div className="overview-guide-formrow">
                <label>作为应用 OAuth2.0 网页授权功能的回调域名</label>
                <div className="overview-guide-field">{data.guide.authCallbackUrl}</div>
              </div>
              <div className="overview-guide-formrow">
                <label>可调用 JS-SDK、跳转小程序的可信域名</label>
                <div className="overview-guide-field">{data.guide.employeeLoginUrl.replace('https://', '')}</div>
              </div>
              <div className="overview-guide-subnote">配置可信域名需完成域名归属认证。</div>
            </div>

            <div className="overview-guide-subcard overview-guide-subcard--ip">
              <strong>企业可信 IP</strong>
              <span>仅所配 IP 可通过接口获取企业数据</span>
              <div className="overview-guide-ip">101.126.152.231</div>
            </div>
          </section>

          <section className="overview-guide-step">
            <div className="overview-guide-step__title">
              <span>3</span>
              <strong>分发员工登录链接</strong>
            </div>
            <div className="overview-guide-copy-row">
              <span>{data.guide.employeeLoginUrl}</span>
              <Button icon={<IconCopy />} type="text" size="mini" onClick={() => copyText(data.guide.employeeLoginUrl, '员工登录链接')} />
            </div>
          </section>
        </div>
      </Drawer>
    </div>
  );
}

function InfoRow({
  label,
  value,
  link = false,
  modelIcon = false,
}: {
  label: string;
  value: string;
  link?: boolean;
  modelIcon?: boolean;
}) {
  return (
    <div className="a0-info-row">
      <Text>{label}</Text>
      <span className={link ? 'a0-link-value' : ''}>
        {modelIcon ? <span className="model-dot" /> : null}
        {value}
      </span>
    </div>
  );
}

function SeatOverviewCard({ seat }: { seat: SeatPlan }) {
  const purchased = seat.used;
  const assigned = seat.active;
  const remaining = Math.max(purchased - assigned, 0);
  const percent = seat.used ? Math.round((seat.active / seat.used) * 100) : 0;

  return (
    <div className="seat-overview-card">
      <div className="seat-overview-card__head">
        <strong>{seat.name}</strong>
        <Text>总配额 {seat.quota}</Text>
      </div>
      <Progress percent={percent} size="small" showText={false} />
      <div className="seat-overview-card__row">
        <Text>已分配/已购买</Text>
        <span>{assigned}/{purchased}</span>
        <Text>剩余 {remaining}</Text>
      </div>
      <div className="seat-overview-card__row">
        <Text>每个员工最多申请</Text>
        <span>{seat.maxApplyPerEmployee}</span>
        <IconPen className="seat-help-icon" />
      </div>
      {seat.expiresAt ? <div className="seat-overview-card__expire">到期时间 {seat.expiresAt}</div> : null}
    </div>
  );
}
