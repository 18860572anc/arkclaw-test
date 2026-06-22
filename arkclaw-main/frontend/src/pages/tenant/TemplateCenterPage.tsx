import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  Checkbox,
  Drawer,
  Input,
  Message,
  Select,
  Space,
  Spin,
  Tabs,
  Typography,
} from '@arco-design/web-react';
import { IconPlus, IconRefresh } from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import type {
  ClawTemplate,
  DispatchTemplatePayload,
  TemplateDispatchCandidate,
  TemplateSource,
} from '../../types/domain';

const { Title } = Typography;
const TabPane = Tabs.TabPane;

interface TemplateLocationState {
  tab?: TemplateSource;
  selectedTemplateId?: string;
}

export default function TemplateCenterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as TemplateLocationState | null;

  const [activeTab, setActiveTab] = useState<TemplateSource>('public');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [publicTemplates, setPublicTemplates] = useState<ClawTemplate[]>([]);
  const [customTemplates, setCustomTemplates] = useState<ClawTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [dispatchSubmitting, setDispatchSubmitting] = useState(false);
  const [dispatchSource, setDispatchSource] = useState<TemplateSource>('public');
  const [dispatchTemplateId, setDispatchTemplateId] = useState('');
  const [dispatchCandidates, setDispatchCandidates] = useState<TemplateDispatchCandidate[]>([]);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');

  const currentTemplates = activeTab === 'public' ? publicTemplates : customTemplates;
  const dispatchTemplates = dispatchSource === 'public' ? publicTemplates : customTemplates;

  const candidateMap = useMemo(
    () => Object.fromEntries(dispatchCandidates.map((item) => [item.id, item])),
    [dispatchCandidates],
  );

  const filteredTemplates = useMemo(
    () =>
      currentTemplates.filter((item) =>
        `${item.name}${item.id}${item.description}`.toLowerCase().includes(keyword.toLowerCase()),
      ),
    [currentTemplates, keyword],
  );

  const filteredSourceCandidates = useMemo(
    () =>
      dispatchCandidates.filter((item) =>
        `${item.name}${item.email}${item.group}`.toLowerCase().includes(sourceSearch.toLowerCase()),
      ),
    [dispatchCandidates, sourceSearch],
  );

  const filteredTargetCandidates = useMemo(
    () =>
      targetKeys
        .map((id) => candidateMap[id])
        .filter(Boolean)
        .filter((item) =>
          `${item.name}${item.email}${item.group}`.toLowerCase().includes(targetSearch.toLowerCase()),
        ),
    [candidateMap, targetKeys, targetSearch],
  );

  const visibleSourceKeys = useMemo(
    () => filteredSourceCandidates.map((item) => item.id),
    [filteredSourceCandidates],
  );

  const allVisibleSelected = useMemo(
    () => visibleSourceKeys.length > 0 && visibleSourceKeys.every((id) => targetKeys.includes(id)),
    [targetKeys, visibleSourceKeys],
  );

  const selectedVisibleCount = useMemo(
    () => visibleSourceKeys.filter((id) => targetKeys.includes(id)).length,
    [targetKeys, visibleSourceKeys],
  );

  const loadData = async (showPageSpin = false) => {
    if (showPageSpin) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const [publicList, customList, candidates] = await Promise.all([
      mockApi.getClawTemplates('public'),
      mockApi.getClawTemplates('custom'),
      mockApi.getTemplateDispatchCandidates(),
    ]);

    setPublicTemplates(publicList);
    setCustomTemplates(customList);
    setDispatchCandidates(candidates);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData(true);
  }, []);

  useEffect(() => {
    if (!locationState) return;
    if (locationState.tab) {
      setActiveTab(locationState.tab);
    }
    if (locationState.selectedTemplateId) {
      setSelectedTemplateId(locationState.selectedTemplateId);
    }
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, locationState, navigate]);

  useEffect(() => {
    if (!dispatchTemplates.length) {
      setDispatchTemplateId('');
      return;
    }
    if (!dispatchTemplates.some((item) => item.id === dispatchTemplateId)) {
      setDispatchTemplateId(dispatchTemplates[0].id);
    }
  }, [dispatchTemplateId, dispatchTemplates]);

  useEffect(() => {
    if (!currentTemplates.length) {
      setSelectedTemplateId(undefined);
      return;
    }
    if (!currentTemplates.some((item) => item.id === selectedTemplateId)) {
      setSelectedTemplateId(currentTemplates[0].id);
    }
  }, [currentTemplates, selectedTemplateId]);

  const handleRefresh = async () => {
    await loadData(false);
    Message.success('模板列表已刷新');
  };

  const handleOpenDrawer = () => {
    const defaultSourceTemplates = activeTab === 'public' ? publicTemplates : customTemplates;
    setDispatchSource(activeTab);
    setDispatchTemplateId(defaultSourceTemplates[0]?.id ?? '');
    setTargetKeys([]);
    setSourceSearch('');
    setTargetSearch('');
    setDrawerVisible(true);
  };

  const handleToggleCandidate = (id: string, checked: boolean) => {
    setTargetKeys((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id];
      }
      return current.filter((item) => item !== id);
    });
  };

  const handleToggleAllVisible = (checked: boolean) => {
    setTargetKeys((current) => {
      if (checked) {
        return Array.from(new Set([...current, ...visibleSourceKeys]));
      }
      return current.filter((id) => !visibleSourceKeys.includes(id));
    });
  };

  const handleDispatch = async () => {
    if (!dispatchTemplateId) {
      Message.error('请选择模板');
      return;
    }
    if (!targetKeys.length) {
      Message.error('请选择员工');
      return;
    }

    setDispatchSubmitting(true);
    const payload: DispatchTemplatePayload = {
      source: dispatchSource,
      templateId: dispatchTemplateId,
      employeeIds: targetKeys,
    };
    const result = await mockApi.dispatchClawTemplate(payload);
    setDispatchSubmitting(false);
    setDrawerVisible(false);
    setTargetKeys([]);
    Message.success(`模板已派发给 ${result.count} 名员工`);
  };

  if (loading) {
    return <Spin className="page-spin" tip="加载 Claw 模板中心" />;
  }

  return (
    <div className="template-page template-page--proto">
      <div className="template-page__header">
        <Title heading={3}>Claw 模板中心</Title>
        <Button type="primary" onClick={handleOpenDrawer}>
          批量派发模板
        </Button>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={(value) => setActiveTab(value as TemplateSource)}
        className="template-tabs"
      >
        <TabPane key="public" title="模板市场" />
        <TabPane key="custom" title="自定义模板" />
      </Tabs>

      <div className="template-toolbar template-toolbar--proto">
        <div className="template-toolbar__left">
          {activeTab === 'custom' ? (
            <Button
              type="primary"
              size="small"
              icon={<IconPlus />}
              onClick={() => navigate('/tenant/templates/create')}
            >
              创建模板
            </Button>
          ) : null}
          <Input.Search
            allowClear
            placeholder="搜索名称、ID"
            value={keyword}
            onChange={setKeyword}
            className="table-search template-search"
          />
        </div>
        <Button
          className="template-refresh-button"
          icon={<IconRefresh />}
          loading={refreshing}
          onClick={handleRefresh}
        />
      </div>

      {filteredTemplates.length ? (
        <div className="template-grid template-grid--proto">
          {filteredTemplates.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`template-card template-card--proto ${
                selectedTemplateId === item.id ? 'template-card--active' : ''
              }`}
              onClick={() => setSelectedTemplateId(item.id)}
            >
              <div className="template-card__cover" style={{ background: item.coverStyle }}>
                <div className="template-card__cover-robot">
                  <span className="template-card__robot-head" />
                  <span className="template-card__robot-face" />
                  <span className="template-card__robot-body" />
                </div>
                <span className="template-card__cover-block template-card__cover-block--left" />
                <span className="template-card__cover-block template-card__cover-block--right" />
              </div>
              <div className="template-card__body">
                <strong>{item.name}</strong>
                <p className="template-card__desc">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
      ) : activeTab === 'custom' ? (
        <div className="template-empty template-empty--proto">
          <div className="template-empty__icon" aria-hidden="true">
            <span className="template-empty__icon-top" />
            <span className="template-empty__icon-body" />
          </div>
          <div className="template-empty__text">暂无自定义模板</div>
        </div>
      ) : (
        <div className="template-empty template-empty--proto">
          <div className="template-empty__icon" aria-hidden="true">
            <span className="template-empty__icon-top" />
            <span className="template-empty__icon-body" />
          </div>
          <div className="template-empty__text">未找到匹配的模板</div>
        </div>
      )}

      <Drawer
        title="管理下发人员"
        visible={drawerVisible}
        width={748}
        className="template-dispatch-drawer"
        onCancel={() => setDrawerVisible(false)}
        footer={
          <Space>
            <Button size="small" onClick={() => setDrawerVisible(false)}>
              取消
            </Button>
            <Button
              size="small"
              type="primary"
              loading={dispatchSubmitting}
              disabled={!dispatchTemplateId || !targetKeys.length}
              onClick={handleDispatch}
            >
              确定
            </Button>
          </Space>
        }
      >
        <div className="template-drawer">
          <div className="template-drawer__field">
            <div className="template-drawer__label">模板来源</div>
            <div className="template-source-switch">
              <button
                type="button"
                className={dispatchSource === 'public' ? 'is-active' : ''}
                onClick={() => setDispatchSource('public')}
              >
                模板市场
              </button>
              <button
                type="button"
                className={dispatchSource === 'custom' ? 'is-active' : ''}
                onClick={() => setDispatchSource('custom')}
              >
                自定义模板
              </button>
            </div>
          </div>

          <div className="template-drawer__field">
            <div className="template-drawer__label">选择模板</div>
            <Select
              placeholder="请选择模板"
              value={dispatchTemplateId || undefined}
              onChange={setDispatchTemplateId}
            >
              {dispatchTemplates.map((item) => (
                <Select.Option key={item.id} value={item.id}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className="template-drawer__field">
            <div className="template-drawer__label">选择员工</div>
            <div className="template-picker template-picker--proto">
              <div className="template-picker__panel">
                <div className="template-picker__toolbar">
                  <strong>全部：{dispatchCandidates.length}项</strong>
                </div>
                <div className="template-picker__search">
                  <Input.Search
                    allowClear
                    placeholder="请输入用户名"
                    value={sourceSearch}
                    onChange={setSourceSearch}
                    className="table-search"
                  />
                </div>
                <div className="template-picker__list">
                  <label className="template-picker__item template-picker__item--selectall">
                    <Checkbox
                      checked={allVisibleSelected}
                      indeterminate={!allVisibleSelected && selectedVisibleCount > 0}
                      onChange={handleToggleAllVisible}
                    />
                    <span>全选</span>
                  </label>

                  {filteredSourceCandidates.map((item) => (
                    <label className="template-picker__item" key={item.id}>
                      <Checkbox
                        checked={targetKeys.includes(item.id)}
                        onChange={(value) => handleToggleCandidate(item.id, value)}
                      />
                      <Avatar size={26} className="template-picker__avatar">
                        {item.avatarText}
                      </Avatar>
                      <div className="template-picker__item-body">
                        <strong>{item.name}</strong>
                        <span>-</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="template-picker__panel">
                <div className="template-picker__toolbar">
                  <strong>已选：{targetKeys.length}项</strong>
                </div>
                <div className="template-picker__search">
                  <Input.Search
                    allowClear
                    placeholder="请输入用户名"
                    value={targetSearch}
                    onChange={setTargetSearch}
                    className="table-search"
                  />
                </div>
                <div className="template-picker__list">
                  {filteredTargetCandidates.length ? (
                    filteredTargetCandidates.map((item) => (
                      <div className="template-picker__item template-picker__item--selected" key={item.id}>
                        <Avatar size={26} className="template-picker__avatar">
                          {item.avatarText}
                        </Avatar>
                        <div className="template-picker__item-body">
                          <strong>{item.name}</strong>
                          <span>{item.group}</span>
                        </div>
                        <Button
                          type="text"
                          size="mini"
                          className="template-picker__remove"
                          onClick={() => handleToggleCandidate(item.id, false)}
                        >
                          移除
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="template-picker__empty">
                      <div className="template-picker__empty-icon" aria-hidden="true">
                        <span />
                      </div>
                      <div className="template-picker__empty-text">暂无数据</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
