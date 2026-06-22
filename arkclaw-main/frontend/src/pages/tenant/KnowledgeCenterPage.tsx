import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Empty,
  Input,
  Space,
  Typography,
} from '@arco-design/web-react';
import { IconRefresh } from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import type { KnowledgeCenterData } from '../../types/domain';

const { Title } = Typography;

export default function KnowledgeCenterPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<KnowledgeCenterData>();
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    mockApi.getKnowledgeCenterData().then(setData);
  }, []);

  if (!data) {
    return null;
  }

  return (
    <div className="knowledge-page">
      <div className="knowledge-page__header">
        <Title heading={3}>知识中心</Title>
      </div>

      <div className="knowledge-shell">
        <section className="knowledge-guide">
          {data.guideSteps.map((item, index) => (
            <div className="knowledge-guide__item" key={item.id}>
              <div className="knowledge-guide__index">{index + 1}</div>
              <div className="knowledge-guide__copy">
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </div>
            </div>
          ))}
        </section>

        <div className="knowledge-toolbar">
          <div className="knowledge-toolbar__left">
            <Button type="primary" onClick={() => navigate('/tenant/knowledge/connect')}>
              连接企业数据
            </Button>
            <Input.Search
              allowClear
              value={keyword}
              onChange={setKeyword}
              placeholder="搜索数据源、知识库或连接记录"
              className="table-search knowledge-search"
            />
          </div>

          <Space size={10}>
            <Button className="knowledge-refresh-button" icon={<IconRefresh />} />
          </Space>
        </div>

        <div className="knowledge-empty-panel">
          <Empty
            description={
              <div className="knowledge-empty-copy">
                <strong>{keyword ? `未找到与“${keyword}”相关的内容` : '暂未连接企业数据'}</strong>
                <span>连接企业知识库和数据库后，ArkClaw 才能在模板、技能和 Claw 助手中调用检索能力。</span>
              </div>
            }
          />
          <Button type="primary" onClick={() => navigate('/tenant/knowledge/connect')}>
            连接企业数据
          </Button>
        </div>
      </div>
    </div>
  );
}
