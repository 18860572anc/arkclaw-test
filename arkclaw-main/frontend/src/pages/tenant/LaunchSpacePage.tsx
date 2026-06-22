import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Message, Spin, Typography } from '@arco-design/web-react';
import { IconRobot, IconSafe } from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import type { LaunchAuthMethod, LaunchSpaceSetup } from '../../types/domain';

const { Text } = Typography;

const authOptions: {
  key: LaunchAuthMethod;
  label: string;
  icon: ReactNode;
}[] = [
  { key: 'feishu', label: '飞书', icon: <span className="launch-auth-chip__brand launch-auth-chip__brand--feishu">飞</span> },
  { key: 'wecom', label: '企业微信', icon: <span className="launch-auth-chip__brand launch-auth-chip__brand--wecom">企</span> },
  { key: 'dingtalk', label: '钉钉', icon: <span className="launch-auth-chip__brand launch-auth-chip__brand--dingtalk">钉</span> },
  { key: 'standard', label: '其他标准...', icon: <IconSafe /> },
  { key: 'platform', label: '平台托管', icon: <IconRobot /> },
];

export default function LaunchSpacePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<LaunchSpaceSetup>();

  useEffect(() => {
    mockApi.getLaunchSpaceSetup().then((data) => {
      setForm(data);
      setLoading(false);
    });
  }, []);

  const helperText = useMemo(() => {
    if (!form) return '';
    if (form.authMethod === 'feishu') {
      return '配置管理员创建的飞书企业应用信息，可通过该应用的可见范围配置管控 ArkClaw 企业版员工端的访问权限。';
    }
    if (form.authMethod === 'wecom') {
      return '填写企业微信自建应用如上信息，并在企业应用中配置员工范围，ArkClaw 将据此控制员工访问权限。';
    }
    if (form.authMethod === 'dingtalk') {
      return '填写钉钉企业应用如上信息，并在企业应用中配置应用的可使用范围，ArkClaw 将据此控制员工访问权限。';
    }
    if (form.authMethod === 'standard') {
      return '支持通过标准身份协议（OIDC / OAuth 2.0 / SAML）集成企业现有身份系统。';
    }
    return '服务开通后，您可以在用户管理页面导入员工账号和初始密码，员工通过账户邮箱链接登录，首次登录时需重置密码。';
  }, [form]);

  const updateField = <K extends keyof LaunchSpaceSetup>(key: K, value: LaunchSpaceSetup[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const handleSubmit = async () => {
    if (!form) return;

    if (form.authMethod === 'feishu' && (!form.feishuAppId.trim() || !form.feishuAppSecret.trim())) {
      Message.error('请填写飞书 App ID 与 App Secret');
      return;
    }
    if (
      form.authMethod === 'wecom' &&
      (!form.wecomCorpId.trim() || !form.wecomAgentId.trim() || !form.wecomAgentSecret.trim())
    ) {
      Message.error('请填写企业微信 CorpID、AgentID 与 Agent Secret');
      return;
    }
    if (
      form.authMethod === 'dingtalk' &&
      (!form.dingtalkAppId.trim() || !form.dingtalkClientId.trim() || !form.dingtalkClientSecret.trim())
    ) {
      Message.error('请填写钉钉 App ID、Client ID 与 Client Secret');
      return;
    }

    setSubmitting(true);
    await mockApi.saveLaunchSpaceSetup(form);
    setSubmitting(false);
    Message.success('企业空间已开通');
    navigate('/tenant/overview');
  };

  if (loading || !form) {
    return <Spin className="page-spin" tip="加载开通配置" />;
  }

  return (
    <div className="launch-page">
      <div className="launch-page__hero">
        <h1>
          欢迎开通 <span>ArkClaw</span> <em>企业版</em>
        </h1>
        <p>
          ArkClaw 企业版是面向团队可信赖的智能副驾，提供一站式企业级智能解决方案，开箱即用，让每位员工轻松拥有专属智能助手。
        </p>
      </div>

      <div className="launch-panel">
        <section className="launch-card">
          <div className="launch-card__title">员工访问控制</div>
          <div className="launch-card__body">
            <div className="launch-label">
              <span className="launch-required">*</span>
              <span>认证方式</span>
            </div>
            <div className="launch-auth-grid">
              {authOptions.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`launch-auth-chip ${form.authMethod === item.key ? 'is-active' : ''}`}
                  onClick={() => updateField('authMethod', item.key)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {form.authMethod === 'feishu' ? (
              <div className="launch-fields">
                <Field label="App ID" required>
                  <Input value={form.feishuAppId} placeholder="请输入" onChange={(value) => updateField('feishuAppId', value)} />
                </Field>
                <Field label="App Secret" required>
                  <Input.Password
                    value={form.feishuAppSecret}
                    placeholder="请输入"
                    visibilityToggle
                    onChange={(value) => updateField('feishuAppSecret', value)}
                  />
                </Field>
              </div>
            ) : null}

            {form.authMethod === 'wecom' ? (
              <div className="launch-fields">
                <Field label="企业 ID" required fullRow>
                  <Input
                    value={form.wecomCorpId}
                    placeholder="请输入企业微信 CorpID"
                    onChange={(value) => updateField('wecomCorpId', value)}
                  />
                </Field>
                <Field label="Agent ID" required>
                  <Input
                    value={form.wecomAgentId}
                    placeholder="请输入应用 AgentID"
                    onChange={(value) => updateField('wecomAgentId', value)}
                  />
                </Field>
                <Field label="Agent Secret" required>
                  <Input.Password
                    value={form.wecomAgentSecret}
                    placeholder="请输入应用 Secret"
                    visibilityToggle
                    onChange={(value) => updateField('wecomAgentSecret', value)}
                  />
                </Field>
              </div>
            ) : null}

            {form.authMethod === 'dingtalk' ? (
              <div className="launch-fields">
                <Field label="App ID" required fullRow>
                  <Input value={form.dingtalkAppId} placeholder="请输入" onChange={(value) => updateField('dingtalkAppId', value)} />
                </Field>
                <Field label="Client ID" required>
                  <Input
                    value={form.dingtalkClientId}
                    placeholder="请输入"
                    onChange={(value) => updateField('dingtalkClientId', value)}
                  />
                </Field>
                <Field label="Client Secret" required>
                  <Input.Password
                    value={form.dingtalkClientSecret}
                    placeholder="请输入"
                    visibilityToggle
                    onChange={(value) => updateField('dingtalkClientSecret', value)}
                  />
                </Field>
              </div>
            ) : null}

            <div className={`launch-helper ${form.authMethod === 'platform' ? 'launch-helper--warning' : ''}`}>
              {form.authMethod === 'platform' ? (
                <>
                  <div className="launch-warning-line">选择平台托管后，将无法切换至其他认证方式，请注意</div>
                  <div className="launch-warning-line">
                    服务开通后，您可以在用户管理页面导入员工账号和初始密码，员工通过用户邮箱链接登录，首次登录时需重置密码。
                  </div>
                  <div className="launch-warning-line">
                    可预先下载：
                    <button type="button">CSV 模版</button>
                    <button type="button">XLSX 模版</button>
                    <span>，提前准备员工信息</span>
                  </div>
                </>
              ) : (
                <>
                  <span>{helperText}</span>
                  {(form.authMethod === 'feishu' || form.authMethod === 'wecom' || form.authMethod === 'dingtalk') ? (
                    <button type="button">配置指引</button>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </section>

        <section className="launch-card">
          <div className="launch-card__title">网络配置</div>
          <div className="launch-card__body launch-card__body--compact">
            <Text className="launch-network-copy">
              系统将在当前 Region 下为您自动创建一套专属的 VPC、子网、安全组、APIG、NAT 等资源。
            </Text>
          </div>
        </section>
      </div>

      <div className="launch-page__footer">
        <Button className="dark-button launch-submit" loading={submitting} onClick={handleSubmit}>
          立即开通
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  required = false,
  fullRow = false,
  children,
}: {
  label: string;
  required?: boolean;
  fullRow?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`launch-field ${fullRow ? 'launch-field--full' : ''}`}>
      <label className="launch-label">
        {required ? <span className="launch-required">*</span> : null}
        <span>{label}</span>
      </label>
      <div className="launch-control">{children}</div>
    </div>
  );
}
