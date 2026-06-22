import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Form, Input, Message, Spin, Typography } from '@arco-design/web-react';
import { IconLeft, IconPlus } from '@arco-design/web-react/icon';
import { mockApi } from '../../services/mockApi';
import type { BrandAsset, BrandCustomizationPayload } from '../../types/domain';

const { Text } = Typography;

const createDefaultForm = (): BrandCustomizationPayload => ({
  name: '',
  companyName: '',
  primarySlogan: '7x24小时在线的专属智能伙伴',
  secondarySlogan: '从聊天到执行，让 AI 真正完成工作。',
  docLinkLabel: '帮助文档',
  docLinkUrl: '',
  loginBackground: null,
  homeBanner: null,
  welcomeTitle: '欢迎使用 ArkClaw',
  helperDescription: 'ArkClaw会帮助你自动执行任务、处理流程、分析数据与生成内容，让工作更高效、更智能。',
  userSideLogo: null,
  securityLinkLabel: '隐私协议',
  securityLinkUrl: '',
});

export default function BrandEditorPage() {
  const navigate = useNavigate();
  const { brandId } = useParams();
  const isEditMode = Boolean(brandId);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<BrandCustomizationPayload>(createDefaultForm);

  useEffect(() => {
    const loadData = async () => {
      if (!brandId) {
        setForm(createDefaultForm());
        setLoading(false);
        return;
      }

      const data = await mockApi.getBrandCustomization(brandId);
      if (!data) {
        Message.error('未找到品牌配置');
        navigate('/tenant/brand');
        return;
      }

      setForm({
        name: data.name,
        companyName: data.companyName,
        primarySlogan: data.primarySlogan,
        secondarySlogan: data.secondarySlogan,
        docLinkLabel: data.docLinkLabel,
        docLinkUrl: data.docLinkUrl,
        loginBackground: data.loginBackground,
        homeBanner: data.homeBanner,
        welcomeTitle: data.welcomeTitle,
        helperDescription: data.helperDescription,
        userSideLogo: data.userSideLogo,
        securityLinkLabel: data.securityLinkLabel,
        securityLinkUrl: data.securityLinkUrl,
      });
      setLoading(false);
    };

    loadData();
  }, [brandId, navigate]);

  const updateField = <K extends keyof BrandCustomizationPayload>(key: K, value: BrandCustomizationPayload[K]) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Message.error('请输入名称描述');
      return;
    }
    if (!form.companyName.trim()) {
      Message.error('请输入企业品牌名');
      return;
    }
    if (!form.primarySlogan.trim()) {
      Message.error('请输入产品主 Slogan');
      return;
    }
    if (!form.welcomeTitle.trim()) {
      Message.error('请输入欢迎语主题');
      return;
    }

    setSubmitting(true);
    if (brandId) {
      await mockApi.updateBrandCustomization(brandId, form);
    } else {
      await mockApi.createBrandCustomization(form);
    }
    setSubmitting(false);
    Message.success(isEditMode ? '品牌配置已保存' : '品牌配置已创建');
    navigate('/tenant/brand');
  };

  if (loading) {
    return <Spin className="page-spin" tip="加载品牌配置" />;
  }

  return (
    <div className="brand-editor-screen">
      <div className="brand-editor-page">
        <div className="brand-editor-header">
          <Button
            type="text"
            className="brand-editor-header__back"
            icon={<IconLeft />}
            onClick={() => navigate('/tenant/brand')}
          />
          <h3>定制品牌信息</h3>
        </div>

        <div className="brand-editor-body">
          <div className="brand-editor-main">
            <section className="brand-editor-section">
              <h4>通用配置</h4>
              <Form layout="vertical" className="brand-editor-form">
                <Form.Item label={<PlainRequiredLabel title="名称描述" />} required>
                  <div className="detail-control-shell">
                    <Input
                      maxLength={32}
                      placeholder="请输入名称描述"
                      value={form.name}
                      onChange={(value) => updateField('name', value)}
                    />
                  </div>
                </Form.Item>

                <Form.Item label={<StepLabel index={1} title="企业品牌名" />} required>
                  <div className="detail-control-shell">
                    <Input
                      maxLength={16}
                      placeholder="请输入企业品牌名"
                      value={form.companyName}
                      onChange={(value) => updateField('companyName', value)}
                    />
                  </div>
                  <div className="brand-form-hint">仅支持 16 个字符以内</div>
                </Form.Item>
              </Form>
            </section>

            <section className="brand-editor-section">
              <h4>登录页</h4>
              <Form layout="vertical" className="brand-editor-form">
                <Form.Item label={<StepLabel index={2} title="产品主 Slogan" />}>
                  <div className="detail-control-shell">
                    <Input
                      maxLength={16}
                      placeholder="请输入产品主 Slogan"
                      value={form.primarySlogan}
                      onChange={(value) => updateField('primarySlogan', value)}
                    />
                  </div>
                  <div className="brand-form-hint">仅支持 16 个字符以内</div>
                </Form.Item>

                <Form.Item label={<StepLabel index={3} title="产品副 Slogan" />}>
                  <div className="detail-control-shell">
                    <Input.TextArea
                      maxLength={80}
                      autoSize={{ minRows: 2, maxRows: 3 }}
                      placeholder="请输入产品副 Slogan"
                      value={form.secondarySlogan}
                      onChange={(value) => updateField('secondarySlogan', value)}
                    />
                  </div>
                  <div className="brand-form-hint">仅支持 80 个字符以内</div>
                </Form.Item>

                <div className="brand-inline-grid">
                  <Form.Item label={<StepLabel index={4} title="帮助文档链接" />}>
                    <div className="detail-control-shell">
                      <Input
                        placeholder="请输入文档标题"
                        value={form.docLinkLabel}
                        onChange={(value) => updateField('docLinkLabel', value)}
                      />
                    </div>
                  </Form.Item>
                  <Form.Item label={<span className="brand-inline-label">URL</span>}>
                    <div className="detail-control-shell">
                      <Input
                        placeholder="请输入文档 URL"
                        value={form.docLinkUrl}
                        onChange={(value) => updateField('docLinkUrl', value)}
                      />
                    </div>
                  </Form.Item>
                </div>

                <Form.Item label={<StepLabel index={5} title="登录背景" />}>
                  <AssetField
                    asset={form.loginBackground}
                    defaultTone="galaxy"
                    hint="推荐尺寸：2880x1800px，大小不能超过 10 MB"
                    onChange={(value) => updateField('loginBackground', value)}
                  />
                </Form.Item>
              </Form>
            </section>

            <section className="brand-editor-section">
              <h4>初始化页面</h4>
              <Form layout="vertical" className="brand-editor-form">
                <Form.Item label={<StepLabel index={6} title="创建 ArkClaw 实例 banner" />}>
                  <AssetField
                    asset={form.homeBanner}
                    defaultTone="aurora"
                    hint="图片尺寸：884x216，大小不能超过 10 MB，图片背景建议使用白色或透明"
                    onChange={(value) => updateField('homeBanner', value)}
                  />
                </Form.Item>
              </Form>
            </section>

            <section className="brand-editor-section">
              <h4>配置详情页</h4>
              <Form layout="vertical" className="brand-editor-form">
                <Form.Item label={<StepLabel index={7} title="欢迎语主题" />} required>
                  <div className="detail-control-shell">
                    <Input
                      maxLength={16}
                      placeholder="请输入欢迎语主题"
                      value={form.welcomeTitle}
                      onChange={(value) => updateField('welcomeTitle', value)}
                    />
                  </div>
                  <div className="brand-form-hint">仅支持 16 个字符以内</div>
                </Form.Item>

                <Form.Item label={<StepLabel index={8} title="辅助描述" />}>
                  <div className="detail-control-shell">
                    <Input.TextArea
                      maxLength={80}
                      autoSize={{ minRows: 2, maxRows: 3 }}
                      placeholder="请输入辅助描述"
                      value={form.helperDescription}
                      onChange={(value) => updateField('helperDescription', value)}
                    />
                  </div>
                  <div className="brand-form-hint">仅支持 80 个字符以内</div>
                </Form.Item>

                <Form.Item label={<StepLabel index={9} title="用户侧 Logo" />}>
                  <AssetField
                    asset={form.userSideLogo}
                    defaultTone="logo"
                    hint="图片尺寸：56x56px，大小不能超过 10 MB"
                    compact
                    onChange={(value) => updateField('userSideLogo', value)}
                  />
                </Form.Item>

                <div className="brand-inline-grid">
                  <Form.Item label={<StepLabel index={10} title="安全与隐私设置" />}>
                    <div className="detail-control-shell">
                      <Input
                        placeholder="请输入文档链接名称说明"
                        value={form.securityLinkLabel}
                        onChange={(value) => updateField('securityLinkLabel', value)}
                      />
                    </div>
                  </Form.Item>
                  <Form.Item label={<span className="brand-inline-label">URL</span>}>
                    <div className="detail-control-shell">
                      <Input
                        placeholder="请输入文档链接"
                        value={form.securityLinkUrl}
                        onChange={(value) => updateField('securityLinkUrl', value)}
                      />
                    </div>
                  </Form.Item>
                </div>
              </Form>
            </section>
          </div>

          <aside className="brand-preview-panel">
            <h4>定制页面效果参考</h4>
            <PreviewCard title="个人工作台 · 登录页">
              <div
                className={`brand-preview-login ${getPreviewToneClass(form.loginBackground, 'galaxy')}`}
                style={buildAssetBackground(form.loginBackground)}
              >
                <div className="brand-preview-login__brand">
                  <span className="brand-preview-login__dot" />
                  <span>{form.companyName || '品牌名'} × ArkClaw 企业版</span>
                </div>
                <strong>{form.primarySlogan || '7x24小时在线的专属智能伙伴'}</strong>
                <p>{form.secondarySlogan || '从聊天到执行，让 AI 真正完成工作。'}</p>
                <div className="brand-preview-login__actions">
                  <span>立即登录</span>
                  <span>{form.docLinkLabel || '帮助文档'}</span>
                </div>
              </div>
            </PreviewCard>

            <PreviewCard title="个人工作台 · 初始化页面">
              <div className="brand-preview-home">
                <div className="brand-preview-home__headline">
                  <span className="brand-preview-home__badge">1</span>
                  <strong>{form.companyName || '品牌名'} × ArkClaw 企业版</strong>
                </div>
                <p>{form.primarySlogan || '创建你的 724 小时在线的专属智能伙伴'}</p>
                <div
                  className={`brand-preview-home__banner ${getPreviewToneClass(form.homeBanner, 'aurora')}`}
                  style={buildAssetBackground(form.homeBanner)}
                >
                  <span className="brand-preview-home__avatar brand-preview-home__avatar--blue" />
                  <span className="brand-preview-home__avatar brand-preview-home__avatar--orange" />
                  <span className="brand-preview-home__avatar brand-preview-home__avatar--red" />
                  <span className="brand-preview-home__avatar brand-preview-home__avatar--purple" />
                </div>
                <div className="brand-preview-home__skeleton">
                  <span />
                  <span />
                </div>
              </div>
            </PreviewCard>

            <PreviewCard title="个人工作台 · 配置详情页">
              <div className="brand-preview-config">
                <div className="brand-preview-config__side" />
                <div className="brand-preview-config__main">
                  <div className="brand-preview-config__logo">
                    <div
                      className={`brand-preview-config__logo-mark ${getPreviewToneClass(form.userSideLogo, 'logo')}`}
                      style={buildAssetBackground(form.userSideLogo)}
                    />
                    <div>
                      <strong>{form.welcomeTitle || '欢迎使用 ArkClaw'}</strong>
                      <p>{form.helperDescription || 'ArkClaw 会帮助你自动执行任务、处理流程与生成内容。'}</p>
                    </div>
                  </div>
                  <div className="brand-preview-config__link">
                    {form.securityLinkLabel || '隐私协议'}
                  </div>
                  <div className="brand-preview-config__input" />
                </div>
              </div>
            </PreviewCard>
          </aside>
        </div>
      </div>

      <div className="brand-editor-footer">
        <Button onClick={() => navigate('/tenant/brand')}>取消</Button>
        <Button type="primary" loading={submitting} onClick={handleSave}>
          保存
        </Button>
      </div>
    </div>
  );
}

function StepLabel({ index, title }: { index: number; title: string }) {
  return (
    <span className="brand-step-label">
      <span className="brand-step-label__index">{index}</span>
      <span>{title}</span>
    </span>
  );
}

function PlainRequiredLabel({ title }: { title: string }) {
  return <span className="brand-plain-label">{title}</span>;
}

function PreviewCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="brand-preview-card">
      <div className="brand-preview-card__title">{title}</div>
      <div className="brand-preview-card__body">{children}</div>
    </section>
  );
}

function AssetField({
  asset,
  compact = false,
  defaultTone,
  hint,
  onChange,
}: {
  asset: BrandAsset | null;
  compact?: boolean;
  defaultTone: BrandAsset['tone'];
  hint: string;
  onChange: (value: BrandAsset | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    inputRef.current?.click();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const tone = asset?.tone ?? defaultTone;
    onChange({
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      tone,
    });
  };

  return (
    <div className="brand-asset-field">
      <div
        className={`brand-upload-tile ${compact ? 'brand-upload-tile--compact' : ''}`}
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
      >
        {asset?.previewUrl ? (
          <div className="brand-upload-tile__image" style={buildAssetBackground(asset)} />
        ) : null}
        <div className="brand-upload-tile__plus">
          <IconPlus />
        </div>
        {asset?.name ? <div className="brand-upload-tile__name">{asset.name}</div> : null}
        <input ref={inputRef} type="file" accept="image/*" className="brand-upload-input" onChange={handleChange} />
      </div>
      <div className="brand-form-hint">{hint}</div>
      {asset?.name ? (
        <Button type="text" size="mini" className="brand-upload-clear" onClick={() => onChange(null)}>
          清除当前图片
        </Button>
      ) : (
        <Text className="brand-upload-meta">点击上传后仅在当前原型会话中保留预览。</Text>
      )}
    </div>
  );
}

function buildAssetBackground(asset: BrandAsset | null) {
  return asset?.previewUrl ? { backgroundImage: `url(${asset.previewUrl})` } : undefined;
}

function getPreviewToneClass(asset: BrandAsset | null, fallback: BrandAsset['tone']) {
  return `brand-preview-tone--${asset?.tone ?? fallback}`;
}
