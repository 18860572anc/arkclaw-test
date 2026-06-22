import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Button,
  Checkbox,
  Drawer,
  Input,
  Message,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
} from '@arco-design/web-react';
import {
  IconCopy,
  IconEdit,
  IconInfoCircle,
} from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import type {
  TenantNetworkConfig,
  TenantNetworkPrivateEgress,
  TenantNetworkPublicEgress,
  TenantNetworkPublicIngress,
} from '../../types/domain';

const { Title, Text } = Typography;

export default function NetworkPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<TenantNetworkConfig>();
  const [domainDrawerVisible, setDomainDrawerVisible] = useState(false);
  const [publicModalVisible, setPublicModalVisible] = useState(false);
  const [privateDrawerVisible, setPrivateDrawerVisible] = useState(false);
  const [domainDraft, setDomainDraft] = useState<TenantNetworkPublicIngress>();
  const [publicDraft, setPublicDraft] = useState<TenantNetworkPublicEgress>();
  const [privateDraft, setPrivateDraft] = useState<TenantNetworkPrivateEgress>();

  useEffect(() => {
    mockApi.getTenantNetworkConfig().then((response) => {
      setData(response);
      setLoading(false);
    });
  }, []);

  const saveAll = async (nextData: TenantNetworkConfig) => {
    setSaving(true);
    const saved = await mockApi.saveTenantNetworkConfig(nextData);
    setData(saved);
    setSaving(false);
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      Message.success('已复制');
    } catch {
      Message.info(value);
    }
  };

  const openDomainDrawer = () => {
    if (!data) return;
    setDomainDraft({ ...data.publicIngress });
    setDomainDrawerVisible(true);
  };

  const openPublicModal = () => {
    if (!data) return;
    setPublicDraft({ ...data.publicEgress });
    setPublicModalVisible(true);
  };

  const openPrivateDrawer = () => {
    if (!data) return;
    setPrivateDraft({ ...data.privateEgress, zones: [...data.privateEgress.zones] });
    setPrivateDrawerVisible(true);
  };

  const saveDomainDrawer = async () => {
    if (!data || !domainDraft) return;
    if (domainDraft.customDomainEnabled && !domainDraft.customDomain.trim()) {
      Message.error('请输入自定义域名');
      return;
    }

    await saveAll({
      ...data,
      publicIngress: domainDraft,
    });
    setDomainDrawerVisible(false);
    Message.success('公网入口配置已更新');
  };

  const savePublicModal = async () => {
    if (!data || !publicDraft) return;

    await saveAll({
      ...data,
      publicEgress: publicDraft,
    });
    setPublicModalVisible(false);
    Message.success('公网出口配置已更新');
  };

  const savePrivateDrawer = async () => {
    if (!data || !privateDraft) return;
    if (privateDraft.enabled && !privateDraft.vpc) {
      Message.error('请选择 VPC');
      return;
    }
    if (privateDraft.enabled && privateDraft.zones.length === 0) {
      Message.error('请至少选择一个可用区');
      return;
    }

    await saveAll({
      ...data,
      privateEgress: privateDraft,
    });
    setPrivateDrawerVisible(false);
    Message.success('私网出口配置已更新');
  };

  if (loading || !data) {
    return <Spin className="page-spin" tip="加载网络配置" />;
  }

  return (
    <div className="tenant-network-page">
      <Title heading={3}>网络配置</Title>

      <section className="tenant-network-section">
        <SectionHeading title="空间访问入口" />
        <div className="tenant-network-block-head">
          <div className="tenant-network-block-title">
            <strong>公网入口</strong>
            <IconInfoCircle />
          </div>
          <Button type="text" size="mini" icon={<IconEdit />} onClick={openDomainDrawer}>
            编辑
          </Button>
        </div>

        <div className="tenant-network-card tenant-network-card--ingress">
          <NetworkInfoItem
            label="员工登录链接"
            value={data.publicIngress.loginUrl}
            action={<Button type="text" size="mini" icon={<IconCopy />} onClick={() => handleCopy(data.publicIngress.loginUrl)} />}
            link
          />
          <div className="tenant-network-stack">
            <NetworkInfoItem
              label="企业自定义域名"
              value={data.publicIngress.customDomain}
              action={(
                <div className="tenant-network-inline-actions">
                  <Tag color={data.publicIngress.certificateStatus === 'configured' ? 'green' : 'gray'}>
                    {data.publicIngress.certificateStatus === 'configured' ? '已配置' : '未配置'}
                  </Tag>
                  <Button type="text" size="mini" icon={<IconCopy />} onClick={() => handleCopy(data.publicIngress.customDomain)} />
                </div>
              )}
              link
            />
            <NetworkInfoItem label="证书名称" value={data.publicIngress.certificateName} link />
          </div>
          <NetworkInfoItem label="自定义域名跳转" value={data.publicIngress.redirectStatus} />
        </div>
      </section>

      <section className="tenant-network-section">
        <SectionHeading title="空间网络出口" />

        <div className="tenant-network-block-head">
          <div className="tenant-network-block-title">
            <strong>公网出口</strong>
            <Tag color={data.publicEgress.enabled ? 'green' : 'gray'}>
              {data.publicEgress.enabled ? '已开启' : '未开启'}
            </Tag>
          </div>
          <Button type="text" size="mini" icon={<IconEdit />} onClick={openPublicModal}>
            编辑
          </Button>
        </div>

        <div className="tenant-network-card tenant-network-card--egress">
          <div className="tenant-network-subcard-title">
            <span>公网访问跨境加速</span>
            <IconEdit />
          </div>
          <div className="tenant-network-subgrid">
            <NetworkInfoItem label="开启状态" value={data.publicEgress.accelerationEnabled ? '已开启' : '未开启'} />
            <NetworkInfoItem label="加速域名" value={data.publicEgress.accelerationDomain || '-'} />
          </div>
        </div>

        <div className="tenant-network-block-head tenant-network-block-head--private">
          <div className="tenant-network-block-title">
            <strong>私网出口</strong>
            <Tag color={data.privateEgress.enabled ? 'green' : 'gray'}>
              {data.privateEgress.enabled ? '已开启' : '未开启'}
            </Tag>
          </div>
          <Button type="text" size="mini" icon={<IconEdit />} onClick={openPrivateDrawer}>
            编辑
          </Button>
        </div>

        {data.privateEgress.enabled ? (
          <div className="tenant-network-card tenant-network-card--private">
            <div className="tenant-network-subgrid tenant-network-subgrid--three">
              <NetworkInfoItem label="所属项目" value={data.privateEgress.project} />
              <NetworkInfoItem label="VPC" value={data.privateEgress.vpc} />
              <NetworkInfoItem label="安全组" value={data.privateEgress.securityGroup} />
              <NetworkInfoItem label="可用区及子网" value={data.privateEgress.zones.join('、')} />
              <NetworkInfoItem label="指定访问目标" value={data.privateEgress.targetIpRange || '-'} />
              <NetworkInfoItem label="域名解析配置" value={data.privateEgress.dnsResolutionEnabled ? '已开启' : '未开启'} />
            </div>
          </div>
        ) : null}
      </section>

      <Drawer
        width={520}
        title="公网入口自定义域名"
        visible={domainDrawerVisible}
        onCancel={() => setDomainDrawerVisible(false)}
        footer={(
          <div className="tenant-network-drawer-footer">
            <Button onClick={() => setDomainDrawerVisible(false)}>取消</Button>
            <Button type="primary" loading={saving} onClick={saveDomainDrawer}>确定</Button>
          </div>
        )}
      >
        {domainDraft ? (
          <div className="tenant-network-drawer-body">
            <DrawerSectionTitle title="方式一：企业自定义域名" />
            <div className="tenant-network-tip">
              <IconInfoCircle />
              <span>使用自定义域名，请前往域名解析服务商配置 CNAME 记录。配置生效后即可通过自定义域名访问。</span>
            </div>

            <DrawerField label="自定义域名配置开关">
              <Switch
                checked={domainDraft.customDomainEnabled}
                onChange={(value) => setDomainDraft((current) => (current ? { ...current, customDomainEnabled: value } : current))}
              />
            </DrawerField>

            <DrawerField label="自定义域名" required>
              <Input
                value={domainDraft.customDomain}
                onChange={(value) => setDomainDraft((current) => (current ? { ...current, customDomain: value } : current))}
                placeholder="请输入域名"
              />
            </DrawerField>

            <DrawerField label="证书配置" required>
              <div className="tenant-network-inline-form">
                <Select value="default" disabled>
                  <Select.Option value="default">default</Select.Option>
                </Select>
                <Select
                  value={domainDraft.certificateName}
                  onChange={(value) => setDomainDraft((current) => (current ? { ...current, certificateName: value } : current))}
                >
                  {data.options.certificateOptions.map((item) => (
                    <Select.Option key={item} value={item}>
                      {item}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </DrawerField>

            <div className="tenant-network-drawer-collapsed">
              <DrawerSectionTitle title="方式二：自定义域名前缀" />
              <Button type="text" size="mini">展开</Button>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Modal
        title="公网出口"
        visible={publicModalVisible}
        footer={null}
        className="tenant-network-public-modal"
        onCancel={() => setPublicModalVisible(false)}
      >
        {publicDraft ? (
          <div className="tenant-network-public-modal__body">
            <DrawerField label="公网出口开关" required inline>
              <Switch
                checked={publicDraft.enabled}
                onChange={(value) => setPublicDraft((current) => (current ? { ...current, enabled: value } : current))}
              />
            </DrawerField>
            <div className="tenant-network-modal-footer">
              <Button onClick={() => setPublicModalVisible(false)}>取消</Button>
              <Button type="primary" loading={saving} onClick={savePublicModal}>确定</Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Drawer
        width={600}
        title="私网出口"
        visible={privateDrawerVisible}
        onCancel={() => setPrivateDrawerVisible(false)}
        footer={(
          <div className="tenant-network-drawer-footer">
            <Button onClick={() => setPrivateDrawerVisible(false)}>取消</Button>
            <Button type="primary" loading={saving} onClick={savePrivateDrawer}>确定</Button>
          </div>
        )}
      >
        {privateDraft ? (
          <div className="tenant-network-drawer-body tenant-network-drawer-body--private">
            <DrawerField label="私网出口开关" inline>
              <div className="tenant-network-switch-wrap">
                <Switch
                  checked={privateDraft.enabled}
                  onChange={(value) => setPrivateDraft((current) => (current ? { ...current, enabled: value } : current))}
                />
                <span>开启后，ArkClaw 可通过私网访问 VPC 内服务。</span>
              </div>
            </DrawerField>

            <DrawerSectionTitle title="基本信息" />
            <DrawerField label="所属项目">
              <Select
                value={privateDraft.project}
                onChange={(value) => setPrivateDraft((current) => (current ? { ...current, project: value } : current))}
              >
                {data.options.projectOptions.map((item) => (
                  <Select.Option key={item} value={item}>
                    {item}
                  </Select.Option>
                ))}
              </Select>
            </DrawerField>
            <DrawerField label="VPC" required>
              <Select
                placeholder="请选择"
                value={privateDraft.vpc}
                onChange={(value) => setPrivateDraft((current) => (current ? { ...current, vpc: value } : current))}
              >
                {data.options.vpcOptions.map((item) => (
                  <Select.Option key={item} value={item}>
                    {item}
                  </Select.Option>
                ))}
              </Select>
            </DrawerField>
            <DrawerField label="可用区及子网" required>
              <div className="tenant-network-zone-grid">
                {data.options.zoneOptions.map((item) => (
                  <Checkbox
                    key={item}
                    checked={privateDraft.zones.includes(item)}
                    onChange={(checked) => {
                      setPrivateDraft((current) => {
                        if (!current) return current;
                        const nextZones = checked
                          ? [...current.zones, item]
                          : current.zones.filter((zone) => zone !== item);
                        return { ...current, zones: nextZones };
                      });
                    }}
                  >
                    {item}
                  </Checkbox>
                ))}
              </div>
              <Text type="secondary">为了保障高可用，请选择两个可用区。</Text>
            </DrawerField>
            <DrawerField label="安全组">
              <Select
                placeholder="请选择安全组"
                value={privateDraft.securityGroup}
                onChange={(value) => setPrivateDraft((current) => (current ? { ...current, securityGroup: value } : current))}
              >
                {data.options.securityGroupOptions.map((item) => (
                  <Select.Option key={item} value={item}>
                    {item}
                  </Select.Option>
                ))}
              </Select>
              <Text type="secondary">最多支持配置 4 个安全组。</Text>
            </DrawerField>

            <DrawerSectionTitle title="指定访问目标" />
            <DrawerField label="指定访问目标 IP 段范围" required>
              <Input
                placeholder="请输入"
                value={privateDraft.targetIpRange}
                onChange={(value) => setPrivateDraft((current) => (current ? { ...current, targetIpRange: value } : current))}
              />
              <Text type="secondary">最多支持指定 50 个目标地址段，每个地址段之间以英文逗号分隔。</Text>
            </DrawerField>

            <DrawerSectionTitle title="域名解析配置" />
            <DrawerField label="域名解析配置开关">
              <Switch
                checked={privateDraft.dnsResolutionEnabled}
                onChange={(value) => setPrivateDraft((current) => (current ? { ...current, dnsResolutionEnabled: value } : current))}
              />
            </DrawerField>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="tenant-network-section-title">
      <span />
      <h2>{title}</h2>
      <IconInfoCircle />
    </div>
  );
}

function DrawerSectionTitle({ title }: { title: string }) {
  return (
    <div className="tenant-network-drawer-title">
      <span />
      <strong>{title}</strong>
      <IconInfoCircle />
    </div>
  );
}

function NetworkInfoItem({
  label,
  value,
  action,
  link = false,
}: {
  label: string;
  value: string;
  action?: ReactNode;
  link?: boolean;
}) {
  return (
    <div className="tenant-network-info-item">
      <span>{label}</span>
      <div className={`tenant-network-info-item__value ${link ? 'is-link' : ''}`}>
        <strong>{value || '-'}</strong>
        {action}
      </div>
    </div>
  );
}

function DrawerField({
  label,
  children,
  required = false,
  inline = false,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  inline?: boolean;
}) {
  return (
    <label className={`tenant-network-field ${inline ? 'tenant-network-field--inline' : ''}`}>
      <span>
        {required ? <em>*</em> : null}
        {label}
      </span>
      <div className="detail-control-shell">{children}</div>
    </label>
  );
}
