import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal } from '@arco-design/web-react';
import { privacyPolicyText } from './public/privacyPolicy';
import { serviceTermsText } from './public/serviceTerms';

type LoginMethod = 'account' | 'phone';

const featureCards = [
  {
    title: '零门槛免运维',
    description: '开箱即用零运维，7×24 小时在线，安全合规，模型矩阵覆盖 90%+ 业务办公场景。',
  },
  {
    title: '多位智能伙伴协同',
    description: '全场景预置成熟智能体，支持 Token 算力，可灵活组合协同共享专属能力。',
  },
  {
    title: '官方托管安全合规',
    description: '账号风险、NAT 出口、大模型与合规策略防护，从全栈服务护航您的业务落地。',
  },
  {
    title: '云协同原生体验',
    description: '云协同原生体验，文档自管、免登联动、一站式服务无缝接通。',
  },
];

const iconGradients = [
  'linear-gradient(135deg,#1664FF,#7B6CFF)',
  'linear-gradient(135deg,#7B6CFF,#38BDF8)',
  'linear-gradient(135deg,#1664FF,#38BDF8)',
  'linear-gradient(135deg,#7B6CFF,#1664FF)',
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('phone');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [termsVisible, setTermsVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);

  return (
    <div className="login-shell">
      <button type="button" className="login-agent-entry" onClick={() => navigate('/agent/admin')}>
        代理镜像站
      </button>
      <main className="login-page">
        <section className="login-visual login-visual--ark">
          <div className="login-visual__header">
            <div className="login-visual__badge">
              <span className="login-visual__logo">
                <svg width="40" height="40" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="login-page-gradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1664FF" />
                      <stop offset="100%" stopColor="#7B6CFF" />
                    </linearGradient>
                  </defs>
                  <path d="M16 3 L28 10 V22 L16 29 L4 22 V10 Z" fill="url(#login-page-gradient)" />
                  <path d="M16 3 L28 10 L16 17 L4 10 Z" fill="#fff" opacity="0.25" />
                  <path d="M11 19 L16 11 L21 19 H18 L17 17 H15 L14 19 Z" fill="#fff" />
                </svg>
              </span>
              <span>云脑智联 · ArkClaw</span>
            </div>
            <h1>
              ArkClaw <span>立即开始</span>
            </h1>
            <p>7×24 小时在线的专属智能伙伴</p>
          </div>

          <div className="login-feature-grid">
            {featureCards.map((card, index) => (
              <article key={card.title} className="login-feature-card">
                <div className="login-feature-card__title">
                  <span className="login-feature-card__icon" style={{ background: iconGradients[index] }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <strong>{card.title}</strong>
                </div>
                <span>{card.description}</span>
              </article>
            ))}
          </div>

          <div className="login-illustration">
            <LoginIllustration />
          </div>
        </section>

        <section className="login-panel">
          <div className="login-panel__card">
            <h2>欢迎来到 ArkClaw</h2>
            <p>登录账号开启您的智能办公旅程</p>

            <div className="login-method-tabs">
              <button
                type="button"
                className={loginMethod === 'phone' ? 'is-active' : ''}
                onClick={() => setLoginMethod('phone')}
              >
                手机号登录
              </button>
              <button
                type="button"
                className={loginMethod === 'account' ? 'is-active' : ''}
                onClick={() => setLoginMethod('account')}
              >
                账号登录
              </button>
            </div>

            <div className="login-field">
              <label>{loginMethod === 'account' ? '账号' : '手机号'}</label>
              <div className="login-account-combo">
                <input
                  value={loginMethod === 'account' ? account : phone}
                  onChange={(event) =>
                    loginMethod === 'account' ? setAccount(event.target.value) : setPhone(event.target.value)
                  }
                  placeholder={loginMethod === 'account' ? 'admin@company.com' : '请输入手机号'}
                />
              </div>
            </div>

            {loginMethod === 'account' ? (
              <div className="login-field">
                <label>密码</label>
                <div className="login-password-box">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="请输入密码"
                  />
                  <button type="button" className="login-password-toggle" onClick={() => setShowPassword((current) => !current)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      {showPassword ? (
                        <>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.6" />
                        </>
                      ) : (
                        <>
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.6" />
                          <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="1.6" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="login-field">
                <label>验证码</label>
                <div className="login-password-box login-password-box--code">
                  <input
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value)}
                    placeholder="请输入短信验证码"
                  />
                  <button type="button" className="login-code-trigger">
                    获取验证码
                  </button>
                </div>
              </div>
            )}

            <div className="login-agreement">
              <label>
                <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
                <span>
                  登录即表示您已阅读并同意{' '}
                  <button type="button" className="login-inline-link" onClick={() => setTermsVisible(true)}>
                    服务条款
                  </button>{' '}
                  和{' '}
                  <button type="button" className="login-inline-link" onClick={() => setPrivacyVisible(true)}>
                    隐私政策
                  </button>
                </span>
              </label>
            </div>

            <button type="button" className="login-submit" onClick={() => navigate('/tenant/overview')}>
              登录
            </button>

            <div className="login-links">
              <Link to="/register">免费注册</Link>
              <Link to="/forgot-password">忘记密码</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="login-footer">
        © 2026 云脑智联 ArkClaw. 保留所有权利. · <Link to="/contact">京 ICP 备 2026-XXXX 号</Link>
      </footer>

      <Modal
        title="云脑智联服务条款"
        visible={termsVisible}
        footer={null}
        style={{ width: 820 }}
        onCancel={() => setTermsVisible(false)}
      >
        <pre className="login-terms-modal">{serviceTermsText}</pre>
      </Modal>

      <Modal
        title="云脑智联隐私政策"
        visible={privacyVisible}
        footer={null}
        style={{ width: 820 }}
        onCancel={() => setPrivacyVisible(false)}
      >
        <pre className="login-terms-modal">{privacyPolicyText}</pre>
      </Modal>
    </div>
  );
}

function LoginIllustration() {
  const particles = [
    { x: 54, y: 52, r: 1.6, color: '#1664FF', opacity: 0.4 },
    { x: 96, y: 92, r: 2, color: '#7B6CFF', opacity: 0.32 },
    { x: 164, y: 42, r: 1.8, color: '#1664FF', opacity: 0.28 },
    { x: 288, y: 44, r: 2.2, color: '#7B6CFF', opacity: 0.38 },
    { x: 414, y: 86, r: 2, color: '#1664FF', opacity: 0.26 },
    { x: 496, y: 58, r: 1.4, color: '#7B6CFF', opacity: 0.42 },
    { x: 462, y: 194, r: 1.8, color: '#1664FF', opacity: 0.34 },
    { x: 392, y: 312, r: 2.2, color: '#7B6CFF', opacity: 0.28 },
    { x: 268, y: 336, r: 1.6, color: '#1664FF', opacity: 0.36 },
    { x: 118, y: 316, r: 2, color: '#7B6CFF', opacity: 0.24 },
    { x: 36, y: 262, r: 1.4, color: '#1664FF', opacity: 0.32 },
  ];

  return (
    <svg viewBox="0 0 540 360" aria-hidden="true">
      <defs>
        <radialGradient id="login-illust-orb" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="40%" stopColor="#A5C4FF" />
          <stop offset="100%" stopColor="#1664FF" stopOpacity="0.4" />
        </radialGradient>
        <radialGradient id="login-illust-orb-2" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="50%" stopColor="#C7B6FF" />
          <stop offset="100%" stopColor="#7B6CFF" stopOpacity="0.4" />
        </radialGradient>
        <linearGradient id="login-illust-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#E8F0FF" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      <ellipse cx="280" cy="180" rx="240" ry="140" fill="url(#login-illust-orb)" opacity="0.25" />
      <circle cx="380" cy="160" r="80" fill="url(#login-illust-orb)" />
      <ellipse cx="360" cy="140" rx="22" ry="14" fill="#fff" opacity="0.6" transform="rotate(-25 360 140)" />
      <circle cx="140" cy="240" r="42" fill="url(#login-illust-orb-2)" />
      <ellipse cx="130" cy="230" rx="12" ry="8" fill="#fff" opacity="0.65" transform="rotate(-25 130 230)" />

      <g transform="translate(60, 60)">
        <rect width="200" height="60" rx="12" fill="url(#login-illust-card)" stroke="#fff" strokeWidth="1.5" />
        <circle cx="22" cy="30" r="12" fill="url(#login-illust-orb-2)" />
        <rect x="44" y="18" width="120" height="6" rx="3" fill="#1F2D44" opacity="0.6" />
        <rect x="44" y="32" width="80" height="5" rx="2.5" fill="#7C8AA3" opacity="0.5" />
      </g>

      <g transform="translate(280, 240)">
        <rect width="180" height="56" rx="12" fill="url(#login-illust-card)" stroke="#fff" strokeWidth="1.5" />
        <rect x="16" y="14" width="80" height="5" rx="2.5" fill="#1664FF" opacity="0.7" />
        <rect x="16" y="26" width="140" height="4" rx="2" fill="#7C8AA3" opacity="0.4" />
        <rect x="16" y="36" width="100" height="4" rx="2" fill="#7C8AA3" opacity="0.4" />
      </g>

      {particles.map((particle, index) => (
        <circle
          key={`${particle.x}-${particle.y}-${index}`}
          cx={particle.x}
          cy={particle.y}
          r={particle.r}
          fill={particle.color}
          opacity={particle.opacity}
        />
      ))}
    </svg>
  );
}
