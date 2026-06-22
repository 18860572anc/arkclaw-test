import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Form,
  Input,
  Message,
  Radio,
  Select,
  Space,
} from '@arco-design/web-react';
import { IconLeft } from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import type { AppRegistrationPreset, EnterpriseAppKind } from '../../types/domain';

export default function AppRegistrationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const kind: EnterpriseAppKind = location.pathname.includes('create-mcp') ? 'mcp' : 'agent';
  const [preset, setPreset] = useState<AppRegistrationPreset>();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('企业自建');
  const [runtime, setRuntime] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    mockApi.getAppRegistrationPreset().then((data) => {
      setPreset(data);
      setSource(data.sourceOptions[0] ?? '企业自建');
      setRuntime((kind === 'agent' ? data.agentRuntimeOptions : data.mcpProtocolOptions)[0] ?? '');
    });
  }, [kind]);

  const pageTitle = kind === 'agent' ? '注册企业 Agent' : '注册企业 MCP';
  const runtimeLabel = kind === 'agent' ? '智能体运行时' : 'MCP 接入协议';
  const addressLabel = kind === 'agent' ? '应用地址' : '服务地址';
  const runtimeOptions = useMemo(() => {
    if (!preset) return [];
    return kind === 'agent' ? preset.agentRuntimeOptions : preset.mcpProtocolOptions;
  }, [kind, preset]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Message.error(`请输入${kind === 'agent' ? 'Agent' : 'MCP'}名称`);
      return;
    }
    if (!code.trim()) {
      Message.error('请输入唯一标识');
      return;
    }
    if (!runtime) {
      Message.error(`请选择${runtimeLabel}`);
      return;
    }
    if (!address.trim()) {
      Message.error(`请输入${addressLabel}`);
      return;
    }

    setSubmitting(true);
    await mockApi.registerEnterpriseApp({
      kind,
      name: name.trim(),
      code: code.trim(),
      description: description.trim(),
      source,
      runtime,
      address: address.trim(),
    });
    setSubmitting(false);
    Message.success(`${pageTitle}已保存`);
    navigate('/tenant/apps', { state: { tab: kind } });
  };

  if (!preset) {
    return null;
  }

  return (
    <div className="app-detail-screen">
      <div className="app-detail-page">
        <div className="app-detail-header">
          <Button
            type="text"
            icon={<IconLeft />}
            className="app-detail-header__back"
            onClick={() => navigate('/tenant/apps', { state: { tab: kind } })}
          />
          <h3>{pageTitle}</h3>
        </div>

        <div className="app-detail-layout">
          <section className="app-detail-section">
            <div className="app-detail-section__title">基本信息</div>
            <Form layout="vertical" className="app-detail-form">
              <Form.Item label={`${kind === 'agent' ? 'Agent' : 'MCP'} 名称`} required>
                <div className="detail-control-shell">
                  <Input placeholder="请输入" value={name} onChange={setName} />
                </div>
              </Form.Item>
              <Form.Item label="唯一标识" required>
                <div className="detail-control-shell">
                  <Input
                    placeholder="建议使用英文、数字或中划线"
                    value={code}
                    onChange={setCode}
                  />
                </div>
              </Form.Item>
              <Form.Item label="描述">
                <div className="detail-control-shell">
                  <Input.TextArea
                    placeholder="请输入"
                    value={description}
                    onChange={setDescription}
                    autoSize={{ minRows: 3, maxRows: 3 }}
                    maxLength={200}
                    showWordLimit
                  />
                </div>
              </Form.Item>
            </Form>
          </section>

          <section className="app-detail-section">
            <div className="app-detail-section__title">接入配置</div>
            <Form layout="vertical" className="app-detail-form">
              <Form.Item label="来源" required>
                <Radio.Group
                  type="button"
                  size="small"
                  value={source}
                  className="app-detail-switch"
                  onChange={(value) => setSource(value as string)}
                >
                  {preset.sourceOptions.map((item) => (
                    <Radio key={item} value={item}>
                      {item}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
              <Form.Item label={runtimeLabel} required>
                <div className="detail-control-shell">
                  <Select
                    value={runtime}
                    onChange={setRuntime}
                    placeholder={`请选择${runtimeLabel}`}
                  >
                    {runtimeOptions.map((item) => (
                      <Select.Option key={item} value={item}>
                        {item}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              </Form.Item>
              <Form.Item label={addressLabel} required>
                <div className="detail-control-shell">
                  <Input
                    placeholder={kind === 'agent' ? 'https://agent.example.com/invoke' : 'https://mcp.example.com'}
                    value={address}
                    onChange={setAddress}
                  />
                </div>
              </Form.Item>
            </Form>
          </section>
        </div>
      </div>

      <div className="app-detail-footer">
        <Space>
          <Button size="small" onClick={() => navigate('/tenant/apps', { state: { tab: kind } })}>
            取消
          </Button>
          <Button size="small" type="primary" loading={submitting} onClick={handleSubmit}>
            确定
          </Button>
        </Space>
      </div>
    </div>
  );
}
