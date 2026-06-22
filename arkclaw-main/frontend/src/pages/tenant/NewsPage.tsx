import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Grid,
  Input,
  Space,
  Tabs,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { IconMessage } from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import type { NewsArticle } from '../../types/domain';

const { Row, Col } = Grid;
const { Title, Text, Paragraph } = Typography;
const TabPane = Tabs.TabPane;

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [category, setCategory] = useState('全部');
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string>();

  useEffect(() => {
    mockApi.getNews().then((items) => {
      setArticles(items);
      setSelectedId(items[0]?.id);
    });
  }, []);

  const filtered = useMemo(
    () =>
      articles.filter((item) => {
        const matchCategory = category === '全部' || item.category === category;
        const matchKeyword = `${item.title}${item.summary}${item.tags.join('')}`.includes(keyword);
        return matchCategory && matchKeyword;
      }),
    [articles, category, keyword],
  );

  const selected = articles.find((item) => item.id === selectedId) ?? filtered[0];

  return (
    <Space direction="vertical" size={18} className="full-width">
      <div className="page-heading">
        <div>
          <Title heading={3}>媒体资讯</Title>
          <Text type="secondary">官方资讯、产品更新与最佳实践</Text>
        </div>
        <Input.Search
          allowClear
          placeholder="搜索资讯"
          value={keyword}
          onChange={setKeyword}
          className="table-search"
        />
      </div>
      <Tabs activeTab={category} onChange={setCategory}>
        <TabPane key="全部" title="全部" />
        <TabPane key="产品动态" title="产品动态" />
        <TabPane key="行业资讯" title="行业资讯" />
        <TabPane key="最佳实践" title="最佳实践" />
      </Tabs>
      <Row gutter={18}>
        <Col span={9}>
          <Space direction="vertical" className="full-width">
            {filtered.map((item) => (
              <Card
                key={item.id}
                className={`news-card ${item.id === selected?.id ? 'news-card--active' : ''}`}
                hoverable
                onClick={() => setSelectedId(item.id)}
                bordered
              >
                <div className="news-card__cover" style={{ background: item.cover }} />
                <Space direction="vertical" size={8}>
                  <Tag color="arcoblue">{item.category}</Tag>
                  <Title heading={6}>{item.title}</Title>
                  <Text type="secondary">{item.summary}</Text>
                  <Text className="table-subtext">{item.publishedAt}</Text>
                </Space>
              </Card>
            ))}
          </Space>
        </Col>
        <Col span={15}>
          {selected ? (
            <Card bordered className="article-detail">
              <div className="article-cover" style={{ background: selected.cover }} />
              <Space direction="vertical" size={14} className="full-width">
                <Tag color="arcoblue">{selected.category}</Tag>
                <Title heading={3}>{selected.title}</Title>
                <Text type="secondary">{selected.publishedAt}</Text>
                <Paragraph>{selected.content}</Paragraph>
                <div className="article-tags">
                  {selected.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
                </div>
              </Space>
            </Card>
          ) : null}
        </Col>
      </Row>
      <Button className="assistant-float" type="primary" shape="circle" icon={<IconMessage />} />
    </Space>
  );
}
