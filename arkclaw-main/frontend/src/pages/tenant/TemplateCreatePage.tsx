import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Form,
  Input,
  Message,
  Radio,
  Select,
  Space,
  Spin,
  Typography,
} from '@arco-design/web-react';
import { IconLeft } from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import type { CreateTemplatePayload, SeatLevel, TemplatePreset } from '../../types/domain';

const { Text } = Typography;

const seatOptions: { value: SeatLevel; label: string; hint: string }[] = [
  { value: 'lite', label: '轻量', hint: '处理常见对话任务、知识查询与简单办公辅助。' },
  { value: 'standard', label: '标准', hint: '适合稳定运营类任务与多轮业务问答。' },
  { value: 'pro', label: '高级', hint: '适合跨系统协作、流程编排与复杂场景。' },
  { value: 'ultimate', label: '旗舰', hint: '适合高价值部门与大规模企业应用。' },
];

export default function TemplateCreatePage() {
  const navigate = useNavigate();
  const [preset, setPreset] = useState<TemplatePreset>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [seatLevel, setSeatLevel] = useState<SeatLevel>('lite');
  const [mirror, setMirror] = useState('公共镜像');
  const [soulMode, setSoulMode] = useState<'preset' | 'custom'>('preset');
  const [soulTemplateId, setSoulTemplateId] = useState('sales-expert');
  const [soulContent, setSoulContent] = useState('');
  const [plugins, setPlugins] = useState<string[]>([
    'Agent Identity',
    'AI Assistant Security',
    'APMPlus OpenClaw Observability Plugin',
  ]);
  const [skills, setSkills] = useState<string[]>([
    'Find Skills',
    'Browser',
    '深度研究 (DeepSearch)',
  ]);
  const [agentEditMode, setAgentEditMode] = useState(false);
  const [agentContent, setAgentContent] = useState('');

  useEffect(() => {
    const loadPreset = async () => {
      const data = await mockApi.getTemplatePreset();
      const defaultRole = data.roleTemplates[0];
      setPreset(data);
      setSoulTemplateId(defaultRole?.id ?? '');
      setSoulContent(defaultRole?.content ?? '');
      setMirror(data.mirrorOptions[0] ?? '公共镜像');
      setAgentContent(data.defaultAgentContent);
      setLoading(false);
    };

    loadPreset();
  }, []);

  const selectedSeatHint = useMemo(
    () => seatOptions.find((item) => item.value === seatLevel)?.hint ?? '',
    [seatLevel],
  );

  const handleSoulModeChange = (value: 'preset' | 'custom') => {
    setSoulMode(value);
    if (value === 'preset' && preset) {
      const selected =
        preset.roleTemplates.find((item) => item.id === soulTemplateId) ?? preset.roleTemplates[0];
      setSoulTemplateId(selected?.id ?? '');
      setSoulContent(selected?.content ?? '');
    }
  };

  const handleSoulTemplateChange = (value: string) => {
    setSoulTemplateId(value);
    const selected = preset?.roleTemplates.find((item) => item.id === value);
    setSoulContent(selected?.content ?? '');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Message.error('请输入模板名称');
      return;
    }
    if (!mirror) {
      Message.error('请选择镜像');
      return;
    }
    if (!soulContent.trim()) {
      Message.error('请完善职位人设内容');
      return;
    }

    setSubmitting(true);
    const payload: CreateTemplatePayload = {
      name: name.trim(),
      description: description.trim(),
      seatLevel,
      mirror,
      soulMode,
      soulTemplateId: soulMode === 'preset' ? soulTemplateId : undefined,
      soulContent: soulContent.trim(),
      plugins,
      skills,
      agentContent: agentContent.trim(),
    };
    const created = await mockApi.createClawTemplate(payload);
    setSubmitting(false);
    Message.success('模板已创建');
    navigate('/tenant/templates', {
      state: { tab: 'custom', selectedTemplateId: created.id },
    });
  };

  if (loading || !preset) {
    return <Spin className="page-spin" tip="加载模板配置" />;
  }

  return (
    <div className="template-create-screen">
      <div className="template-create-page">
        <div className="template-create-header">
          <Button
            type="text"
            className="template-create-header__back"
            icon={<IconLeft />}
            onClick={() => navigate('/tenant/templates')}
          />
          <h3>创建模板</h3>
        </div>

        <div className="template-create-layout">
          <section className="template-create-section">
            <div className="template-create-section__title">基本信息</div>
            <Form layout="vertical" className="template-create-form">
              <Form.Item label="模板名称" required>
                <div className="detail-control-shell">
                  <Input placeholder="请输入" value={name} onChange={setName} />
                </div>
              </Form.Item>
              <Form.Item label="描述">
                <div className="detail-control-shell">
                  <Input.TextArea
                    placeholder="请输入"
                    maxLength={200}
                    showWordLimit
                    autoSize={{ minRows: 2, maxRows: 2 }}
                    value={description}
                    onChange={setDescription}
                  />
                </div>
              </Form.Item>
              <Form.Item label="规格" required>
                <Radio.Group
                  type="button"
                  value={seatLevel}
                  onChange={(value) => setSeatLevel(value as SeatLevel)}
                  className="template-seat-group"
                >
                  {seatOptions.map((item) => (
                    <Radio key={item.value} value={item.value}>
                      {item.label}
                    </Radio>
                  ))}
                </Radio.Group>
                <div className="template-create-note">{selectedSeatHint}</div>
              </Form.Item>
            </Form>
          </section>

          <section className="template-create-section">
            <div className="template-create-section__title">高级配置</div>
            <Form layout="vertical" className="template-create-form">
              <Form.Item label="镜像" required>
                <Button size="small" className="template-mirror-button">
                  {mirror}
                </Button>
              </Form.Item>

              <Form.Item label="职位人设（SOUL.md）">
                <div className="template-soul-toolbar">
                  <TabsBlockHeader mode={soulMode} onChange={handleSoulModeChange} />
                  {soulMode === 'preset' ? (
                    <div className="detail-control-shell">
                      <Select
                        value={soulTemplateId}
                        onChange={handleSoulTemplateChange}
                        className="template-soul-select"
                      >
                        {preset.roleTemplates.map((item) => (
                          <Select.Option key={item.id} value={item.id}>
                            {item.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </div>
                  ) : null}
                </div>

                <div className="template-code-editor">
                  <div className="template-code-editor__gutter">
                    {Array.from({ length: 12 }).map((_, index) => (
                      <span key={index}>{index + 1}</span>
                    ))}
                  </div>
                  <Input.TextArea
                    value={soulContent}
                    onChange={setSoulContent}
                    autoSize={{ minRows: 12, maxRows: 12 }}
                    className="template-editor template-editor--code detail-control"
                  />
                </div>
              </Form.Item>

              <Form.Item label="内置插件">
                <div className="detail-control-shell">
                  <Select
                    mode="multiple"
                    placeholder="请选择内置插件"
                    value={plugins}
                    onChange={setPlugins}
                    allowClear
                  >
                    {preset.pluginOptions.map((item) => (
                      <Select.Option key={item} value={item}>
                        {item}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              </Form.Item>

              <Form.Item label="内置技能">
                <div className="detail-control-shell">
                  <Select
                    mode="multiple"
                    placeholder="请选择内置技能"
                    value={skills}
                    onChange={setSkills}
                    allowClear
                  >
                    {preset.skillOptions.map((item) => (
                      <Select.Option key={item} value={item}>
                        {item}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              </Form.Item>

              <Form.Item label="平台规范（AGENT.md）">
                {!agentEditMode ? (
                  <div className="template-agent-placeholder">
                    <Text type="secondary">{agentContent || '暂无添加自定义规则'}</Text>
                    <Button size="small" onClick={() => setAgentEditMode(true)}>
                      查看并编辑
                    </Button>
                  </div>
                ) : (
                  <Space direction="vertical" size={10} className="full-width">
                    <div className="detail-control-shell full-width">
                      <Input.TextArea
                        value={agentContent}
                        onChange={setAgentContent}
                        autoSize={{ minRows: 4, maxRows: 8 }}
                        className="template-editor"
                      />
                    </div>
                    <div>
                      <Button size="small" onClick={() => setAgentEditMode(false)}>
                        收起编辑
                      </Button>
                    </div>
                  </Space>
                )}
              </Form.Item>
            </Form>
          </section>
        </div>
      </div>

      <div className="template-create-footer">
        <Space>
          <Button size="small" onClick={() => navigate('/tenant/templates')}>
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

function TabsBlockHeader({
  mode,
  onChange,
}: {
  mode: 'preset' | 'custom';
  onChange: (value: 'preset' | 'custom') => void;
}) {
  return (
    <Radio.Group
      type="button"
      size="small"
      value={mode}
      onChange={onChange}
      className="template-inline-switch"
    >
      <Radio value="preset">基于模板</Radio>
      <Radio value="custom">自定义</Radio>
    </Radio.Group>
  );
}
