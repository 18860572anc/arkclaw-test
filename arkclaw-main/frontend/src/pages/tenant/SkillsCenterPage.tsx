import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Input,
  Message,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from '@arco-design/web-react';
import {
  IconApps,
  IconList,
  IconRefresh,
  IconUpload,
} from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import type { SkillCard, SkillCenterData } from '../../types/domain';

const { Title, Text } = Typography;
const TabPane = Tabs.TabPane;

export default function SkillsCenterPage() {
  const [data, setData] = useState<SkillCenterData>();
  const [activeTab, setActiveTab] = useState<'plaza' | 'featured'>('plaza');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [scene, setScene] = useState('all');
  const [source, setSource] = useState('all');
  const [skillType, setSkillType] = useState('all');
  const [sortMode, setSortMode] = useState<'hot' | 'rating'>('hot');

  useEffect(() => {
    mockApi.getSkillCenterData().then(setData);
  }, []);

  const plazaSkills = useMemo(() => {
    if (!data) return [];

    return [...data.plaza]
      .filter((item) => {
        const matchesKeyword = `${item.name}${item.description}${item.scene}${item.source}`
          .toLowerCase()
          .includes(keyword.toLowerCase());
        const matchesCategory = category === 'all' || item.category === category;
        const matchesScene = scene === 'all' || item.scene === scene;
        const matchesSource = source === 'all' || item.source === source;
        const matchesType = skillType === 'all' || item.type === skillType;
        return matchesKeyword && matchesCategory && matchesScene && matchesSource && matchesType;
      })
      .sort((left, right) => (sortMode === 'hot' ? right.downloads - left.downloads : right.rating - left.rating));
  }, [category, data, keyword, scene, skillType, sortMode, source]);

  const featuredSkills = useMemo(() => {
    return plazaSkills.slice().sort((left, right) => right.downloads - left.downloads);
  }, [plazaSkills]);

  const featuredColumns = [
    {
      title: '排序',
      width: 72,
      render: (_: unknown, __: SkillCard, index: number) => <span className="skills-rank">{index + 1}</span>,
    },
    {
      title: '技能名称',
      dataIndex: 'name',
      width: 220,
      render: (_: unknown, record: SkillCard) => (
        <div className="skills-table-name">
          <strong>{record.name}</strong>
          <span>{record.source}</span>
        </div>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      render: (value: string) => <span className="skills-table-desc">{value}</span>,
    },
    {
      title: '场景',
      dataIndex: 'scene',
      width: 118,
    },
    {
      title: '评分',
      dataIndex: 'rating',
      width: 92,
      render: (value: number) => <span className="skills-table-rating">{value.toFixed(1)}</span>,
    },
    {
      title: '下载量',
      dataIndex: 'downloads',
      width: 108,
    },
    {
      title: '操作',
      width: 90,
      render: () => (
        <Button
          type="text"
          size="mini"
          onClick={() => {
            Message.success('技能已加入待安装列表');
          }}
        >
          安装
        </Button>
      ),
    },
  ];

  if (!data) {
    return null;
  }

  return (
    <div className="skills-page">
      <div className="skills-page__header">
        <Title heading={3}>技能中心</Title>
      </div>

      <div className="skills-shell">
        <Tabs
          activeTab={activeTab}
          onChange={(value) => setActiveTab(value as 'plaza' | 'featured')}
          className="skills-tabs"
        >
          <TabPane key="plaza" title="技能广场" />
          <TabPane key="featured" title="企业精选" />
        </Tabs>

        <div className="skills-toolbar">
          <div className="skills-toolbar__left">
            <Button type="primary" icon={<IconUpload />}>
              上传技能
            </Button>
            <Input.Search
              allowClear
              value={keyword}
              onChange={setKeyword}
              placeholder="搜索技能名称、描述或场景"
              className="table-search skills-search"
            />
            <Select value={scene} onChange={setScene} className="skills-select">
              {data.sceneOptions.map((item) => (
                <Select.Option key={item.value} value={item.value}>
                  {item.label}
                </Select.Option>
              ))}
            </Select>
            <Select value={source} onChange={setSource} className="skills-select">
              {data.sourceOptions.map((item) => (
                <Select.Option key={item.value} value={item.value}>
                  {item.label}
                </Select.Option>
              ))}
            </Select>
            <Select value={skillType} onChange={setSkillType} className="skills-select">
              {data.typeOptions.map((item) => (
                <Select.Option key={item.value} value={item.value}>
                  {item.label}
                </Select.Option>
              ))}
            </Select>
          </div>

          <Space size={10}>
            <div className="skills-sort-switch">
              <button
                type="button"
                className={sortMode === 'hot' ? 'is-active' : ''}
                onClick={() => setSortMode('hot')}
              >
                热度
              </button>
              <button
                type="button"
                className={sortMode === 'rating' ? 'is-active' : ''}
                onClick={() => setSortMode('rating')}
              >
                评分
              </button>
            </div>
            <div className="skills-view-switch" aria-label="视图切换">
              <Button size="mini" className="skills-view-switch__button is-active" icon={<IconApps />} />
              <Button size="mini" className="skills-view-switch__button" icon={<IconList />} />
            </div>
            <Button className="skills-refresh-button" icon={<IconRefresh />} />
          </Space>
        </div>

        <div className="skills-categories">
          {data.categories.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`skills-category-chip ${category === item.id ? 'is-active' : ''}`}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {activeTab === 'plaza' ? (
          <div className="skills-grid">
            {plazaSkills.map((skill) => (
              <article className="skills-card" key={skill.id}>
                <div className={`skills-card__cover skills-card__cover--${skill.coverTone}`}>
                  <span className="skills-card__mark">{skill.name.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="skills-card__body">
                  <div className="skills-card__topline">
                    <strong>{skill.name}</strong>
                    <Tag size="small">{skill.source}</Tag>
                  </div>
                  <p>{skill.description}</p>
                  <div className="skills-card__meta">
                    <Text>{skill.scene}</Text>
                    <Text>{skill.type}</Text>
                  </div>
                  <div className="skills-card__tags">
                    {skill.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="skills-card__footer">
                    <span>评分 {skill.rating.toFixed(1)}</span>
                    <span>{skill.downloads} 次下载</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="skills-table-wrap">
            <Table
              borderCell={false}
              pagination={false}
              rowKey="id"
              className="skills-table"
              columns={featuredColumns}
              data={featuredSkills}
            />
          </div>
        )}
      </div>
    </div>
  );
}
