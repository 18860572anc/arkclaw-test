import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Button,
  Card,
  Checkbox,
  Input,
  Message,
  Select,
  Space,
  Typography,
} from '@arco-design/web-react';
import { IconSafe } from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';

const { Title, Text } = Typography;

const initialDraft = {
  companyName: '',
  uscc: '',
  industry: '',
  agentRegisterCode: '',
  contactName: '',
  phone: '',
  email: '',
  password: '',
  agree: false,
};

const requiredHintMap = {
  uscc: '用于识别企业主体并校验是否已注册',
  agentRegisterCode: '选填，填写后注册客户会归属对应代理',
  contactName: '用于后续业务对接联系人确认',
  phone: '用于后续业务对接电话沟通',
  email: '用于后续业务对接资料和通知接收',
  password: '用于企业管理员首次登录',
} as const;

function RequiredLabel({
  children,
  hint,
}: {
  children: string;
  hint?: string;
}) {
  return (
    <span className="public-register-field-label">
      <span><i className="form-required">*</i>{children}</span>
      {hint ? <small>{hint}</small> : null}
    </span>
  );
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const refPayload = searchParams.get('ref') ?? '';
  const initialAgentRegisterCode = searchParams.get('agentCode') ?? searchParams.get('inviteCode') ?? searchParams.get('code') ?? '';
  const [draft, setDraft] = useState({ ...initialDraft, agentRegisterCode: initialAgentRegisterCode.trim().toUpperCase() });
  const [usccState, setUsccState] = useState<any>();
  const [agentCodeState, setAgentCodeState] = useState<any>();
  const [industries, setIndustries] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>();

  useEffect(() => {
    mockApi.getSalesIndustries().then(setIndustries);
  }, []);

  useEffect(() => {
    if (!draft.uscc.trim()) {
      setUsccState(undefined);
      return;
    }
    const timer = window.setTimeout(async () => {
      const response = await mockApi.checkPublicRegisterUscc(draft.uscc);
      setUsccState(response);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [draft.uscc]);

  useEffect(() => {
    const code = draft.agentRegisterCode.trim().toUpperCase();
    if (!code) {
      setAgentCodeState(undefined);
      return;
    }
    const timer = window.setTimeout(async () => {
      const response = await mockApi.checkPublicRegisterInviteCode(code);
      setAgentCodeState(response);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [draft.agentRegisterCode]);

  const updateDraft = (key: keyof typeof initialDraft, value: string | boolean) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const agentCodeErrorText = agentCodeState?.reason === 'expired'
    ? '代理注册码已过期'
    : agentCodeState?.reason === 'disabled'
      ? '代理注册码已停用'
      : agentCodeState?.reason === 'exhausted'
        ? '代理注册码使用次数已达上限'
        : agentCodeState?.reason === 'invalid'
          ? '代理注册码不存在'
          : '';

  const handleSubmit = async () => {
    if (
      !draft.uscc.trim() ||
      !draft.companyName.trim() ||
      !draft.industry.trim() ||
      !draft.contactName.trim() ||
      !draft.phone.trim() ||
      !draft.email.trim() ||
      !draft.password.trim()
    ) {
      Message.error('请填写完整的注册信息');
      return;
    }
    if (!/^[0-9A-Z]{18}$/.test(draft.uscc.trim().toUpperCase())) {
      Message.error('统一社会信用代码需为 18 位字母数字');
      return;
    }
    if (!/^1\d{10}$/.test(draft.phone.trim())) {
      Message.error('请输入有效的中国手机号');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      Message.error('请输入有效邮箱');
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,16}$/.test(draft.password.trim())) {
      Message.error('管理员密码需为 8～16 位，并包含字母与数字');
      return;
    }
    if (!draft.agree) {
      Message.error('请先勾选服务协议和隐私政策');
      return;
    }
    if (usccState && !usccState.available) {
      Message.error(usccState.reason === 'owned_by_self' ? '该客户已在代理客户池中' : '贵公司已在平台注册过');
      return;
    }
    const agentRegisterCode = draft.agentRegisterCode.trim().toUpperCase();
    if (agentRegisterCode) {
      const checkedAgentCode = agentCodeState?.valid && agentCodeState.codeId
        ? agentCodeState
        : await mockApi.checkPublicRegisterInviteCode(agentRegisterCode);
      if (!checkedAgentCode.valid) {
        setAgentCodeState(checkedAgentCode);
        Message.error(agentCodeErrorText || '代理注册码无效，请检查后再提交');
        return;
      }
    }

    setSubmitting(true);
    try {
      const data = await mockApi.publicRegister({
        companyName: draft.companyName,
        uscc: draft.uscc,
        industry: draft.industry,
        contactName: draft.contactName,
        phone: draft.phone,
        email: draft.email,
        password: draft.password,
        agree: draft.agree,
        verificationPassed: true,
        refPayload,
        inviteCode: agentRegisterCode || undefined,
      });
      setResult(data);
      setDraft({ ...initialDraft, agentRegisterCode: '' });
    } catch (error) {
      Message.error(error instanceof Error ? error.message : '注册失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="public-register">
        <div className="public-register-brand">云脑智联 x ArkClaw</div>
        <Card className="public-register-card public-register-card--success" bordered>
          <Space direction="vertical" size={18} className="full-width">
            <IconSafe className="public-register-success-icon" />
            <div>
              <Title heading={4}>注册成功</Title>
              <Text type="secondary">
                {result.bound ? `已绑定代理 ${result.salesName}，客户归属已建立。` : '已完成普通注册，可继续进入企业空间开通流程。'}
              </Text>
            </div>
            <div className="public-register-result">
              <div><span>企业名称</span><strong>{result.tenantName}</strong></div>
              <div><span>租户 ID</span><strong>{result.tenantId}</strong></div>
            </div>
            <Space>
              <Link to="/login"><Button type="primary">前往登录</Button></Link>
              <Button onClick={() => setResult(undefined)}>继续注册其他企业</Button>
            </Space>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div className="public-register">
      <div className="public-register-brand">云脑智联 x ArkClaw</div>
      <div className="public-register-layout">
        <Card bordered className="public-register-card">
          <Space direction="vertical" size={20} className="full-width">
            <Title heading={3}>企业注册</Title>

            <div className="public-register-form">
              <label>
                <RequiredLabel hint={requiredHintMap.uscc}>统一社会信用代码</RequiredLabel>
                <Input value={draft.uscc} onChange={(value) => updateDraft('uscc', value)} placeholder="请输入18 位纳税人识别号" />
                {usccState?.available ? <small className="sales-form-hint sales-form-hint--success">统一社会信用代码可注册</small> : null}
                {usccState?.reason === 'owned_by_other' ? <small className="sales-form-hint sales-form-hint--danger">贵公司已在平台注册过，请联系您的客户经理</small> : null}
              </label>
              <label>
                <RequiredLabel>企业名称</RequiredLabel>
                <Input value={draft.companyName} onChange={(value) => updateDraft('companyName', value)} placeholder="请输入企业名称" />
              </label>
              <label>
                <RequiredLabel>行业</RequiredLabel>
                <Select value={draft.industry || undefined} onChange={(value) => updateDraft('industry', value)} placeholder="请选择行业">
                  {industries.map((industry) => (
                    <Select.Option key={industry} value={industry}>{industry}</Select.Option>
                  ))}
                </Select>
              </label>
              <label>
                <span className="public-register-field-label">
                  <span>代理注册码</span>
                  <small>{requiredHintMap.agentRegisterCode}</small>
                </span>
                <Input
                  value={draft.agentRegisterCode}
                  onChange={(value) => updateDraft('agentRegisterCode', value.trim().toUpperCase())}
                  placeholder="请输入代理注册码（选填）"
                />
                {agentCodeState?.valid ? <small className="sales-form-hint sales-form-hint--success">注册码有效，将绑定代理 {agentCodeState.salesName}</small> : null}
                {agentCodeErrorText ? <small className="sales-form-hint sales-form-hint--danger">{agentCodeErrorText}</small> : null}
              </label>
              <label>
                <RequiredLabel hint={requiredHintMap.contactName}>企业联系人</RequiredLabel>
                <Input value={draft.contactName} onChange={(value) => updateDraft('contactName', value)} placeholder="请输入企业联系人" />
              </label>
              <label>
                <RequiredLabel hint={requiredHintMap.phone}>企业联系人电话</RequiredLabel>
                <Input value={draft.phone} onChange={(value) => updateDraft('phone', value)} placeholder="请输入企业联系人电话" />
              </label>
              <label>
                <RequiredLabel hint={requiredHintMap.email}>企业联系人邮箱</RequiredLabel>
                <Input value={draft.email} onChange={(value) => updateDraft('email', value)} placeholder="请输入企业联系人邮箱" />
              </label>
              <label>
                <RequiredLabel hint={requiredHintMap.password}>管理员密码</RequiredLabel>
                <Input.Password value={draft.password} onChange={(value) => updateDraft('password', value)} placeholder="8～16 位，须含字母与数字" />
              </label>
            </div>

            <div className="public-register-checks">
              <Checkbox checked={draft.agree} onChange={(value) => updateDraft('agree', value)}>
                我已阅读并同意 <Link to="/service-terms">服务协议</Link> 和 <Link to="/privacy-policy">隐私政策</Link>
              </Checkbox>
            </div>

            <Button type="primary" size="large" loading={submitting} onClick={handleSubmit}>
              提交
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  );
}
