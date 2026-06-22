import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Message,
  Select,
  Space,
  Typography,
} from '@arco-design/web-react';
import { IconLeft, IconPlus } from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import type { KnowledgeCenterData } from '../../types/domain';

const { Text } = Typography;

interface LibraryRow {
  id: string;
  name: string;
  region: string;
}

export default function KnowledgeConnectPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<KnowledgeCenterData>();
  const [step, setStep] = useState(1);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [libraries, setLibraries] = useState<LibraryRow[]>([]);
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    mockApi.getKnowledgeCenterData().then((result) => {
      setData(result);
      const defaultLibrary = result.libraryOptions[0];
      setLibraries(
        defaultLibrary
          ? [{ id: `lib-row-${Date.now()}`, name: defaultLibrary.name, region: defaultLibrary.region }]
          : [],
      );
    });
  }, []);

  const allSources = useMemo(() => {
    if (!data) return [];
    return [...data.featuredSources, ...data.databaseSources];
  }, [data]);

  const handleNext = () => {
    if (!selectedSourceId) {
      Message.error('请先选择一个数据源');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!libraries.length || !libraries[0]?.name) {
      Message.error('请至少选择一个知识库');
      return;
    }
    if (!accessKey.trim() || !secretKey.trim()) {
      Message.error('请完善访问凭证');
      return;
    }

    setSubmitting(true);
    await mockApi.connectKnowledgeSource({
      sourceId: selectedSourceId,
      libraries: libraries.map((item) => ({ name: item.name, region: item.region })),
      accessKey: accessKey.trim(),
      secretKey: secretKey.trim(),
    });
    setSubmitting(false);
    Message.success('知识连接已保存');
    navigate('/tenant/knowledge');
  };

  const updateLibrary = (id: string, patch: Partial<LibraryRow>) => {
    setLibraries((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  if (!data) {
    return null;
  }

  return (
    <div className="knowledge-detail-screen">
      <div className="knowledge-detail-page">
        <div className="knowledge-detail-header">
          <Button
            type="text"
            icon={<IconLeft />}
            className="knowledge-detail-header__back"
            onClick={() => navigate('/tenant/knowledge')}
          />
          <h3>连接企业数据</h3>
        </div>

        <div className="knowledge-stepper">
          <div className={`knowledge-stepper__item ${step === 1 ? 'is-active' : 'is-done'}`}>
            <span>1</span>
            <strong>选择数据源</strong>
          </div>
          <div className={`knowledge-stepper__item ${step === 2 ? 'is-active' : ''}`}>
            <span>2</span>
            <strong>配置连接</strong>
          </div>
        </div>

        {step === 1 ? (
          <div className="knowledge-source-layout">
            <section className="knowledge-source-section">
              <div className="knowledge-detail-section__title">数据与知识</div>
              <div className="knowledge-source-grid knowledge-source-grid--featured">
                {data.featuredSources.map((item) => (
                  <SourceCard
                    key={item.id}
                    item={item}
                    selected={selectedSourceId === item.id}
                    onClick={() => setSelectedSourceId(item.id)}
                  />
                ))}
              </div>
            </section>

            <section className="knowledge-source-section">
              <div className="knowledge-detail-section__title">其他数据库</div>
              <div className="knowledge-source-grid">
                {data.databaseSources.map((item) => (
                  <SourceCard
                    key={item.id}
                    item={item}
                    selected={selectedSourceId === item.id}
                    onClick={() => setSelectedSourceId(item.id)}
                  />
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="knowledge-config-layout">
            <section className="knowledge-config-section">
              <div className="knowledge-detail-section__title">知识库配置</div>
              <div className="knowledge-library-list">
                {libraries.map((item, index) => (
                  <div className="knowledge-library-row" key={item.id}>
                    <div className="knowledge-library-row__index">Viking {index + 1}</div>
                    <Select
                      value={item.name}
                      className="knowledge-library-row__name"
                      onChange={(value) => {
                        const target = data.libraryOptions.find((option) => option.name === value);
                        updateLibrary(item.id, {
                          name: value as string,
                          region: target?.region ?? item.region,
                        });
                      }}
                    >
                      {data.libraryOptions.map((option) => (
                        <Select.Option key={option.id} value={option.name}>
                          {option.name}
                        </Select.Option>
                      ))}
                    </Select>
                    <Input
                      value={item.region}
                      className="knowledge-library-row__region"
                      onChange={(value) => updateLibrary(item.id, { region: value })}
                    />
                  </div>
                ))}
                <Button
                  type="text"
                  icon={<IconPlus />}
                  className="knowledge-library-add"
                  onClick={() =>
                    setLibraries((items) => [
                      ...items,
                      {
                        id: `lib-row-${Date.now()}`,
                        name: data.libraryOptions[0]?.name ?? '',
                        region: data.libraryOptions[0]?.region ?? '',
                      },
                    ])
                  }
                >
                  新增 Viking 知识库
                </Button>
              </div>
            </section>

            <section className="knowledge-config-section">
              <div className="knowledge-detail-section__title">访问凭证</div>
              <div className="knowledge-credential-form">
                <label>
                  <span>Access Key</span>
                  <Input value={accessKey} onChange={setAccessKey} placeholder="请输入 Access Key" />
                </label>
                <label>
                  <span>Secret Key</span>
                  <Input.Password value={secretKey} onChange={setSecretKey} placeholder="请输入 Secret Key" />
                </label>
              </div>
            </section>

            <div className="knowledge-source-summary">
              <Text>已选择数据源：{allSources.find((item) => item.id === selectedSourceId)?.name ?? '-'}</Text>
            </div>
          </div>
        )}
      </div>

      <div className="knowledge-detail-footer">
        <Space>
          <Button size="small" onClick={() => navigate('/tenant/knowledge')}>
            取消
          </Button>
          {step === 2 ? (
            <Button size="small" onClick={() => setStep(1)}>
              上一步
            </Button>
          ) : null}
          <Button
            size="small"
            type="primary"
            loading={submitting}
            onClick={step === 1 ? handleNext : handleSubmit}
          >
            {step === 1 ? '下一步' : '确定'}
          </Button>
        </Space>
      </div>
    </div>
  );
}

function SourceCard({
  item,
  selected,
  onClick,
}: {
  item: KnowledgeCenterData['featuredSources'][number];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`knowledge-source-card knowledge-source-card--${item.accent} ${selected ? 'is-active' : ''}`}
      onClick={onClick}
    >
      <div className="knowledge-source-card__icon">{item.name.slice(0, 1)}</div>
      <div className="knowledge-source-card__body">
        <strong>{item.name}</strong>
        <span>{item.description}</span>
      </div>
    </button>
  );
}
