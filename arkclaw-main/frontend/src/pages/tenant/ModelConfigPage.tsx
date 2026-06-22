import { useEffect, useState } from 'react';
import {
  Button,
  Input,
  Message,
  Select,
  Spin,
  Typography,
} from '@arco-design/web-react';
import {
  IconDelete,
  IconInfoCircle,
  IconLeft,
  IconPlusCircle,
} from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '../../services/mockApi';
import type { ModelConfig, ModelSource, OverviewData } from '../../types/domain';

const { Text } = Typography;

const planOptions = ['Coding Plan', 'General Plan'];
const modelOptions = ['doubao-seed-2.0-pro', 'doubao-seed-2.0', 'doubao-seed-1.6'];

export default function ModelConfigPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<OverviewData>();
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [minuteLimit, setMinuteLimit] = useState('0');
  const [dailyLimit, setDailyLimit] = useState('0');

  useEffect(() => {
    mockApi.getOverview().then((overview) => {
      setData(overview);
      setConfigs(overview.modelConfigs);
      setMinuteLimit(String(overview.modelConfigs[0]?.minuteTokenLimit ?? 0));
      setDailyLimit(String(overview.modelConfigs[0]?.dailyTokenLimit ?? 0));
    });
  }, []);

  if (!data) {
    return <Spin className="page-spin" tip="加载模型配置" />;
  }

  return (
    <div className="model-edit-page">
      <button className="model-edit-title" type="button" onClick={() => navigate('/tenant/overview')}>
        <IconLeft />
        <span>模型配置</span>
      </button>

      <div className="model-edit-content">
        <div className="model-edit-tip">
          <IconInfoCircle />
          <Text>模型配置修改后，新申请的 ArkClaw 自动生效，存量 ArkClaw 需员工点击设置中的切换模型手动切换生效</Text>
        </div>

        {configs.map((config) => (
          <ModelLevelEditor
            config={config}
            key={config.level}
            onAddSource={() => {
              setConfigs((items) =>
                items.map((item) =>
                  item.level === config.level
                    ? {
                        ...item,
                        sources: [
                          ...(item.sources ?? []),
                          {
                            id: `${item.level}-${Date.now()}`,
                            plan: 'Coding Plan',
                            model: 'doubao-seed-2.0-pro',
                            isDefault: !(item.sources?.length),
                          },
                        ],
                      }
                    : item,
                ),
              );
            }}
            onDeleteSource={(sourceId) => {
              setConfigs((items) =>
                items.map((item) =>
                  item.level === config.level
                    ? {
                        ...item,
                        sources: (item.sources ?? []).filter((source) => source.id !== sourceId),
                      }
                    : item,
                ),
              );
            }}
            onUpdateSource={(sourceId, patch) => {
              setConfigs((items) =>
                items.map((item) =>
                  item.level === config.level
                    ? {
                        ...item,
                        sources: (item.sources ?? []).map((source) =>
                          source.id === sourceId ? { ...source, ...patch } : source,
                        ),
                      }
                    : item,
                ),
              );
            }}
          />
        ))}

        <div className="model-limit-editor">
          <h3>模型限流配置</h3>
          <div className="limit-card">
            <div className="limit-field">
              <Text>单个 Claw 每分钟 Token 上限</Text>
              <Input value={minuteLimit} onChange={setMinuteLimit} addAfter="百万" />
            </div>
            <div className="limit-field">
              <Text>单个 Claw 每日 Token 上限</Text>
              <Input value={dailyLimit} onChange={setDailyLimit} addAfter="百万" />
            </div>
          </div>
        </div>
      </div>

      <div className="model-edit-footer">
        <Button onClick={() => navigate('/tenant/overview')}>取消</Button>
        <Button
          type="primary"
          onClick={() => {
            Message.success('模型配置已保存');
            navigate('/tenant/overview');
          }}
        >
          确认
        </Button>
      </div>
    </div>
  );
}

function ModelLevelEditor({
  config,
  onAddSource,
  onDeleteSource,
  onUpdateSource,
}: {
  config: ModelConfig;
  onAddSource: () => void;
  onDeleteSource: (sourceId: string) => void;
  onUpdateSource: (sourceId: string, patch: Partial<ModelSource>) => void;
}) {
  return (
    <section className="model-level-editor">
      <h2>{config.name}</h2>
      {config.sources?.length ? (
        config.sources.map((source) => (
          <div className="model-source-row" key={source.id}>
            <Select
              value={source.plan}
              className="source-plan-select"
              onChange={(value) => onUpdateSource(source.id, { plan: value as string })}
            >
              {planOptions.map((plan) => (
                <Select.Option value={plan} key={plan}>
                  {plan}
                </Select.Option>
              ))}
            </Select>
            <Select
              value={source.model}
              className="source-model-select"
              onChange={(value) => onUpdateSource(source.id, { model: value as string })}
            >
              {modelOptions.map((model) => (
                <Select.Option value={model} key={model}>
                  <span className="source-model-option">
                    {model === 'doubao-seed-2.0-pro' ? <span className="model-dot" /> : null}
                    {source.isDefault && model === source.model ? '默认模型 | ' : ''}
                    {model}
                  </span>
                </Select.Option>
              ))}
            </Select>
            <Button icon={<IconDelete />} size="small" type="text" onClick={() => onDeleteSource(source.id)} />
          </div>
        ))
      ) : null}
      <Button className="add-source-button" icon={<IconPlusCircle />} size="mini" type="text" onClick={onAddSource}>
        添加模型来源
      </Button>
    </section>
  );
}
