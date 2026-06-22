import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Empty,
  Input,
  Select,
  Space,
  Tabs,
  Typography,
} from '@arco-design/web-react';
import {
  IconApps,
  IconList,
  IconPlus,
  IconRefresh,
} from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import type { AppCenterData, EnterpriseAppKind } from '../../types/domain';

const { Title, Text } = Typography;
const TabPane = Tabs.TabPane;

export default function AppsCenterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = location.state?.tab === 'mcp' ? 'mcp' : 'agent';
  const [data, setData] = useState<AppCenterData>();
  const [activeTab, setActiveTab] = useState<EnterpriseAppKind>(initialTab);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('all');

  useEffect(() => {
    mockApi.getAppCenterData().then(setData);
  }, []);

  useEffect(() => {
    if (location.state?.tab === 'agent' || location.state?.tab === 'mcp') {
      setActiveTab(location.state.tab);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const registerPath = activeTab === 'agent' ? '/tenant/apps/create-agent' : '/tenant/apps/create-mcp';
  const registerLabel = activeTab === 'agent' ? '注册 Agent' : '注册 MCP';
  const emptyTitle = activeTab === 'agent' ? '暂无已注册 Agent' : '暂无已注册 MCP';
  const emptyDescription =
    activeTab === 'agent'
      ? '注册企业 Agent 后，可统一纳入应用中心进行配置与发布。'
      : '注册企业 MCP 后，可为模板和 Claw 助手提供统一的工具能力。';

  const summary = useMemo(() => {
    const statusLabel = data?.statusOptions.find((item) => item.value === status)?.label ?? '全部状态';
    const sourceLabel = data?.sourceOptions.find((item) => item.value === source)?.label ?? '全部来源';
    return `${statusLabel} / ${sourceLabel}${keyword ? ` / ${keyword}` : ''}`;
  }, [data, keyword, source, status]);

  if (!data) {
    return null;
  }

  return (
    <div className="apps-page">
      <div className="apps-page__header">
        <Title heading={3}>应用中心</Title>
      </div>

      <div className="apps-shell">
        <Tabs
          activeTab={activeTab}
          onChange={(value) => setActiveTab(value as EnterpriseAppKind)}
          className="apps-tabs"
        >
          <TabPane key="agent" title="企业 Agent" />
          <TabPane key="mcp" title="企业 MCP" />
        </Tabs>

        <div className="apps-toolbar">
          <div className="apps-toolbar__left">
            <Button type="primary" icon={<IconPlus />} onClick={() => navigate(registerPath)}>
              {registerLabel}
            </Button>
            <Input.Search
              allowClear
              value={keyword}
              onChange={setKeyword}
              placeholder="搜索名称、唯一标识或描述"
              className="table-search apps-search"
            />
            <Select value={status} onChange={setStatus} className="apps-select">
              {data.statusOptions.map((item) => (
                <Select.Option key={item.value} value={item.value}>
                  {item.label}
                </Select.Option>
              ))}
            </Select>
            <Select value={source} onChange={setSource} className="apps-select">
              {data.sourceOptions.map((item) => (
                <Select.Option key={item.value} value={item.value}>
                  {item.label}
                </Select.Option>
              ))}
            </Select>
          </div>

          <Space size={10}>
            <div className="apps-view-switch" aria-label="视图切换">
              <Button size="mini" className="apps-view-switch__button is-active" icon={<IconList />} />
              <Button size="mini" className="apps-view-switch__button" icon={<IconApps />} />
            </div>
            <Button className="apps-refresh-button" icon={<IconRefresh />} />
          </Space>
        </div>

        <div className="apps-summary">
          <Text>{summary}</Text>
        </div>

        <div className="apps-empty-panel">
          <Empty
            description={
              <div className="apps-empty-copy">
                <strong>{emptyTitle}</strong>
                <span>{emptyDescription}</span>
              </div>
            }
          />
          <Button type="primary" onClick={() => navigate(registerPath)}>
            {registerLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
