import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Input,
  Message,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from '@arco-design/web-react';
import {
  IconCopy,
  IconEdit,
  IconLink,
  IconPlus,
  IconRefresh,
  IconUpload,
} from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import type {
  DepartmentTableRow,
  EmployeeRecord,
  UserManagementData,
  UserManagementTabKey,
} from '../../types/domain';

const { Title, Text } = Typography;
const TabPane = Tabs.TabPane;

export default function UserManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<UserManagementData>();
  const [departmentRows, setDepartmentRows] = useState<DepartmentTableRow[]>([]);
  const [employeeRows, setEmployeeRows] = useState<EmployeeRecord[]>([]);
  const [activeTab, setActiveTab] = useState<UserManagementTabKey>('employees');
  const [departmentPanelTab, setDepartmentPanelTab] = useState<'org' | 'custom'>('org');
  const [departmentKeyword, setDepartmentKeyword] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [showCreateDepartment, setShowCreateDepartment] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newDepartmentParent, setNewDepartmentParent] = useState('root');
  const [newDepartmentDescription, setNewDepartmentDescription] = useState('');
  const [newDepartmentLeader, setNewDepartmentLeader] = useState('');
  const [newDepartmentExternalId, setNewDepartmentExternalId] = useState('');

  useEffect(() => {
    Promise.all([
      mockApi.getUserManagementData(),
      mockApi.getDepartmentTable(),
      mockApi.getEmployeeRecords(),
    ]).then(([base, departments, employees]) => {
      setData(base);
      setDepartmentRows(departments);
      setEmployeeRows(employees);
      setActiveTab(location.state?.tab ?? base.activeTab);
    });
  }, [location.state]);

  const filteredDepartments = useMemo(() => {
    return departmentRows.filter((item) =>
      `${item.name}${item.externalId}${item.relation}`.toLowerCase().includes(departmentSearch.toLowerCase()),
    );
  }, [departmentRows, departmentSearch]);

  const employeeColumns = [
    {
      title: '姓名/ID',
      dataIndex: 'name',
      width: 180,
      render: (_: unknown, record: EmployeeRecord) => (
        <div className="users-table-name">
          <strong>{record.name}</strong>
          <span>{record.id}</span>
        </div>
      ),
    },
    { title: '邮箱', dataIndex: 'email', width: 200 },
    { title: '手机号', dataIndex: 'phone', width: 160 },
    {
      title: '登录方式',
      dataIndex: 'loginType',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: EmployeeRecord['status']) => (
        <Tag className="users-status-tag" color="gold">
          {value}
        </Tag>
      ),
    },
    {
      title: '操作',
      width: 100,
      render: () => (
        <Button type="text" size="mini">
          查看
        </Button>
      ),
    },
  ];

  const departmentColumns = [
    { title: '部门名称/ID', dataIndex: 'name', width: 210, render: (_: unknown, record: DepartmentTableRow) => (
      <div className="users-table-name">
        <strong>{record.name}</strong>
        <span>{record.id}</span>
      </div>
    )},
    { title: '外部唯一标识 ID', dataIndex: 'externalId', width: 180 },
    { title: '部门关系', dataIndex: 'relation', width: 220 },
    { title: '子部门数量', dataIndex: 'childCount', width: 120 },
    { title: '员工数', dataIndex: 'employeeCount', width: 100 },
    { title: '数据来源', dataIndex: 'source', width: 110 },
    { title: '部门创建时间', dataIndex: 'createdAt', width: 170 },
    {
      title: '操作',
      width: 96,
      render: () => (
        <Button type="text" size="mini">
          编辑
        </Button>
      ),
    },
  ];

  const resetDepartmentForm = () => {
    setNewDepartmentName('');
    setNewDepartmentParent('root');
    setNewDepartmentDescription('');
    setNewDepartmentLeader('');
    setNewDepartmentExternalId('');
  };

  const submitDepartment = () => {
    if (!newDepartmentName.trim()) {
      Message.error('请输入部门名称');
      return;
    }
    if (!newDepartmentExternalId.trim()) {
      Message.error('请输入外部唯一标识 ID');
      return;
    }
    Message.success('部门信息已暂存');
    setShowCreateDepartment(false);
    resetDepartmentForm();
  };

  if (!data) {
    return <Spin className="page-spin" tip="加载用户管理" />;
  }

  const selectedDepartmentCount = data.departmentNodes.length;
  const departmentCount = departmentRows.length;

  return (
    <div className="users-page">
      <div className="users-page__header">
        <Title heading={3}>用户管理</Title>
        <Space size={8} className="users-page__actions">
          <span className="users-auth-meta">当前认证方式 <IconLink /> {data.authChannel}</span>
          <Button
            size="small"
            icon={<IconRefresh />}
            onClick={() => navigate('/tenant/users/sync-results')}
          >
            更新员工数据
          </Button>
          <Button size="small" icon={<IconPlus />} onClick={() => setShowImportModal(true)}>
            新增员工信息
          </Button>
        </Space>
      </div>

      <div className="users-tabbar">
        <Tabs activeTab={activeTab} onChange={(value) => setActiveTab(value as UserManagementTabKey)} className="users-tabs">
          <TabPane key="employees" title="员工列表" />
          <TabPane key="departments" title="部门管理" />
          <TabPane key="access" title="登录配置" />
        </Tabs>
      </div>

      {activeTab === 'employees' ? (
        <div className="users-content">
          <Alert
            closable={false}
            type="warning"
            content={
              <div className="users-alert">
                <span>{data.warningText}</span>
                <button type="button" onClick={() => navigate('/tenant/users/sync-results')}>
                  更新数据
                </button>
              </div>
            }
          />

          <div className="users-subheading">
            <strong>员工列表</strong>
            <span>共 {data.employeeCount} 人</span>
          </div>

          <div className="users-employee-shell">
            <aside className="users-department-panel">
              <div className="users-department-tabs">
                {data.departmentPanelTabs.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={departmentPanelTab === item.key ? 'is-active' : ''}
                    onClick={() => setDepartmentPanelTab(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
                <button type="button" className="users-department-collapse">收起</button>
              </div>

              <div className="users-department-search">
                <Input.Search
                  className="table-search"
                  placeholder="搜索组织部门名称"
                  value={departmentKeyword}
                  onChange={setDepartmentKeyword}
                />
                <Button icon={<IconPlus />} />
                <Button icon={<IconRefresh />} />
              </div>

              <div className="users-department-empty">
                <div className="users-department-empty__icon">
                  <span />
                </div>
                <p>暂无组织部门，建立部门后便于管理</p>
                <Button type="primary" size="small" onClick={() => setShowCreateDepartment(true)}>
                  新建部门
                </Button>
              </div>
            </aside>

            <section className="users-employee-main">
              <div className="users-employee-main__toolbar">
                <span />
                <Space size={10}>
                  <label className="users-switch-label">
                    <Switch size="small" />
                    <span>按组展示</span>
                  </label>
                  <span className="users-all-list">全员列表</span>
                </Space>
              </div>

              {selectedDepartmentCount ? (
                <Table className="users-table" borderCell={false} columns={employeeColumns} data={employeeRows} pagination={false} rowKey="id" />
              ) : (
                <div className="users-empty-state users-empty-state--main">
                  <div className="users-empty-state__icon users-empty-state__icon--chart" />
                  <p>请选择部门</p>
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}

      {activeTab === 'departments' ? (
        <div className="users-content">
          <div className="users-section-bar">
            <div className="users-subheading users-subheading--departments">
              <strong>所有部门</strong>
              <span>共 {departmentCount} 个部门</span>
            </div>
            <Space size={8} className="users-toolbar-actions">
              <Select defaultValue="name" className="users-filter-select">
                <Select.Option value="name">名称</Select.Option>
              </Select>
              <Input.Search
                className="table-search users-toolbar-search"
                placeholder="请输入部门名"
                value={departmentSearch}
                onChange={setDepartmentSearch}
              />
              <Button icon={<IconPlus />} onClick={() => setShowCreateDepartment(true)}>
                新建部门
              </Button>
              <Button className="users-toolbar-icon" icon={<IconLink />} />
              <Button className="users-toolbar-icon" icon={<IconRefresh />} />
            </Space>
          </div>

          <div className="users-table-wrap users-table-wrap--departments">
            <Table
              className="users-table"
              borderCell={false}
              pagination={false}
              columns={departmentColumns}
              data={filteredDepartments}
              rowKey="id"
              noDataElement={<div className="users-empty-state users-empty-state--table"><div className="users-empty-state__icon users-empty-state__icon--tray" /><p>暂无数据</p></div>}
            />
          </div>
        </div>
      ) : null}

      {activeTab === 'access' ? (
        <div className="users-content">
          <div className="users-login-guide">
            <div className="users-login-guide__copy">
              <strong>请先按照指引完成配置，再进行员工登录链接分发</strong>
              <div className="users-login-guide__steps">
                <span>1 企业微信授权回调地址: {data.loginConfig.callbackUrl}</span>
                <Button type="text" size="mini">
                  去配置
                </Button>
                <span>2 员工登录链接: {data.loginConfig.loginUrl}</span>
                <Button icon={<IconCopy />} size="mini" />
              </div>
            </div>
            <Button className="users-guide-button">查看指引</Button>
          </div>

          <div className="users-subheading users-subheading--config">
            <strong>基础配置信息</strong>
            <Button type="text" size="mini">
              编辑
            </Button>
          </div>

          <div className="users-login-card">
            <div className="users-login-card__item">
              <span>认证方式</span>
              <strong>{data.loginConfig.authChannel}</strong>
            </div>
            <div className="users-login-card__item">
              <span>AgentID</span>
              <strong>{data.loginConfig.agentId}</strong>
            </div>
            <div className="users-login-card__item">
              <span>Agent Secret</span>
              <strong>{data.loginConfig.agentSecretMasked}</strong>
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        title="新建部门"
        visible={showCreateDepartment}
        onCancel={() => {
          setShowCreateDepartment(false);
          resetDepartmentForm();
        }}
        footer={null}
        className="users-modal"
      >
        <div className="users-form-grid">
          <label className="users-form-field">
            <span>部门名称</span>
            <div className="detail-control-shell">
              <Input placeholder="请输入部门名称" value={newDepartmentName} onChange={setNewDepartmentName} />
            </div>
          </label>
          <label className="users-form-field">
            <span>上级部门</span>
            <div className="detail-control-shell">
              <Select value={newDepartmentParent} onChange={setNewDepartmentParent}>
                {data.parentDepartmentOptions.map((item) => (
                  <Select.Option key={item.value} value={item.value}>
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </label>
          <label className="users-form-field users-form-field--full">
            <span>部门描述</span>
            <div className="detail-control-shell">
              <Input.TextArea
                placeholder="请输入部门描述"
                value={newDepartmentDescription}
                onChange={setNewDepartmentDescription}
                maxLength={512}
                showWordLimit
                autoSize={{ minRows: 2, maxRows: 2 }}
              />
            </div>
          </label>
          <label className="users-form-field users-form-field--full">
            <span>部门负责人</span>
            <div className="detail-control-shell">
              <Select
                showSearch
                placeholder="可输入员工名称搜索"
                value={newDepartmentLeader}
                onChange={setNewDepartmentLeader}
              >
                {data.departmentLeaderOptions.map((item) => (
                  <Select.Option key={item.value} value={item.value}>
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </label>
          <label className="users-form-field users-form-field--full">
            <span>外部唯一标识 ID</span>
            <div className="detail-control-shell">
              <Input
                placeholder="请输入外部唯一标识 ID"
                value={newDepartmentExternalId}
                onChange={setNewDepartmentExternalId}
              />
            </div>
          </label>
        </div>
        <div className="users-modal-footer">
          <Button
            onClick={() => {
              setShowCreateDepartment(false);
              resetDepartmentForm();
            }}
          >
            取消
          </Button>
          <Button type="primary" onClick={submitDepartment}>
            下一步
          </Button>
        </div>
      </Modal>

      <Modal
        title="导入员工信息"
        visible={showImportModal}
        onCancel={() => {
          setShowImportModal(false);
          setUploadedFileName('');
        }}
        footer={null}
        className="users-upload-modal"
      >
        <div
          className="users-upload-dropzone"
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              fileInputRef.current?.click();
            }
          }}
        >
          <IconUpload />
          <strong>{uploadedFileName || '点击或拖拽文件到此处上传'}</strong>
          <span>仅支持 CSV 或 XLSX 格式，CSV 模版 / XLSX 模版</span>
          <span>单次导入限制在 500 行内</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            className="users-upload-input"
            onChange={(event) => setUploadedFileName(event.target.files?.[0]?.name ?? '')}
          />
        </div>
        <div className="users-modal-footer">
          <Button
            onClick={() => {
              setShowImportModal(false);
              setUploadedFileName('');
            }}
          >
            取消
          </Button>
          <Button
            type="primary"
            onClick={() => {
              Message.success(uploadedFileName ? `已选择 ${uploadedFileName}` : '导入弹层已确认');
              setShowImportModal(false);
            }}
          >
            确定
          </Button>
        </div>
      </Modal>
    </div>
  );
}
