import type { CSSProperties } from 'react';

const floatingCardStyle = (extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  background: 'rgba(255,255,255,0.88)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.92)',
  borderRadius: 14,
  padding: '14px 16px',
  boxShadow: '0 18px 40px rgba(11,31,58,0.12)',
  ...extra,
});

const particlePositions = [
  [78, 92],
  [142, 74],
  [214, 98],
  [448, 86],
  [502, 160],
  [486, 292],
  [426, 346],
  [256, 382],
  [146, 322],
  [110, 220],
];

export function HeroVisual() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg viewBox="0 0 560 460" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id="site-hero-orb" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#A5C4FF" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#7B6CFF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#1664FF" stopOpacity="0.55" />
          </radialGradient>
          <radialGradient id="site-hero-orb-small" cx="40%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#C7B6FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#7B6CFF" stopOpacity="0.4" />
          </radialGradient>
          <linearGradient id="site-hero-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1664FF" stopOpacity="0" />
            <stop offset="50%" stopColor="#7B6CFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </linearGradient>
          <filter id="site-hero-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        <ellipse cx="320" cy="240" rx="210" ry="160" fill="url(#site-hero-orb)" opacity="0.35" filter="url(#site-hero-blur)" />
        <ellipse cx="320" cy="240" rx="200" ry="60" fill="none" stroke="url(#site-hero-ring)" strokeWidth="1.5" opacity="0.55" />
        <ellipse cx="320" cy="240" rx="160" ry="160" fill="none" stroke="#A5C4FF" strokeWidth="1" opacity="0.3" />
        <ellipse
          cx="320"
          cy="240"
          rx="220"
          ry="80"
          fill="none"
          stroke="url(#site-hero-ring)"
          strokeWidth="1"
          opacity="0.4"
          transform="rotate(-15 320 240)"
        />
        <circle cx="320" cy="240" r="120" fill="url(#site-hero-orb)" />
        <ellipse cx="285" cy="200" rx="40" ry="22" fill="#FFFFFF" opacity="0.55" transform="rotate(-25 285 200)" />
        <ellipse cx="320" cy="365" rx="80" ry="10" fill="#1664FF" opacity="0.18" filter="url(#site-hero-blur)" />
        <circle cx="490" cy="180" r="22" fill="url(#site-hero-orb-small)" />
        <circle cx="160" cy="290" r="16" fill="url(#site-hero-orb-small)" />
        <circle cx="440" cy="350" r="10" fill="#7B6CFF" opacity="0.5" />
        {particlePositions.map(([x, y], index) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={index % 3 === 0 ? 2.4 : index % 3 === 1 ? 1.8 : 1.4} fill="#1664FF" opacity={0.25 + (index % 3) * 0.12} />
        ))}
      </svg>

      <div style={floatingCardStyle({ top: '8%', right: '4%', width: 220, animation: 'site-float-y 4s ease-in-out infinite' })}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #1664FF, #7B6CFF)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1F2D44' }}>智能助手 · Ark</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: '#E8F0FF', marginBottom: 6 }} />
        <div style={{ height: 6, borderRadius: 3, background: '#E8F0FF', width: '78%' }} />
      </div>

      <div style={floatingCardStyle({ bottom: '12%', left: '2%', width: 180, animation: 'site-float-y 5s ease-in-out infinite 1s' })}>
        <div style={{ fontSize: 11, color: '#7C8AA3', marginBottom: 4 }}>本月会话</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#0B1F3A', letterSpacing: '-0.01em' }}>
          184,302
          <span style={{ color: '#16A34A', fontSize: 12, marginLeft: 8 }}>↑ 28%</span>
        </div>
        <div style={{ display: 'flex', gap: 2, marginTop: 8, alignItems: 'flex-end', height: 24 }}>
          {[40, 60, 35, 80, 55, 90, 65].map((height, index) => (
            <div
              key={height}
              style={{
                flex: 1,
                height: `${height}%`,
                background: index % 2 === 0 ? 'linear-gradient(180deg, #7B6CFF, #1664FF)' : 'linear-gradient(180deg, #38BDF8, #1664FF)',
                borderRadius: 2,
                opacity: 0.85,
              }}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '40%',
          right: '-2%',
          padding: '10px 14px',
          background: '#1664FF',
          color: '#fff',
          borderRadius: 12,
          fontSize: 12,
          boxShadow: '0 12px 28px rgba(22,100,255,0.4)',
          animation: 'site-float-y 4.5s ease-in-out infinite 0.5s',
        }}
      >
        <div style={{ fontSize: 10, opacity: 0.85, marginBottom: 2 }}>HR 助手</div>
        <div style={{ fontWeight: 500 }}>简历智能筛选完成 ✓</div>
      </div>
    </div>
  );
}

export function TierIcon({ name }: { name: 'starter' | 'standard' | 'premium' | 'ultimate' }) {
  const icons = {
    starter: (
      <path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    ),
    standard: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      </>
    ),
    premium: (
      <>
        <path d="M12 2L3 7v6c0 5 3.5 8.5 9 10 5.5-1.5 9-5 9-10V7l-9-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    ultimate: (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 3v18M3 12h18M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
      </>
    ),
  };

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      {icons[name]}
    </svg>
  );
}

function GlassPanel({
  title,
  lines,
  badge,
  accent = '#1664FF',
}: {
  title: string;
  lines: string[];
  badge?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.85)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 20px 40px rgba(11,31,58,0.12)',
        borderRadius: 18,
        padding: 18,
        minWidth: 180,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <strong style={{ fontSize: 14, color: '#0B1F3A' }}>{title}</strong>
        {badge ? (
          <span
            style={{
              background: accent,
              color: '#fff',
              fontSize: 10,
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: 999,
            }}
          >
            {badge}
          </span>
        ) : null}
      </div>
      {lines.map((line, index) => (
        <div
          key={line}
          style={{
            height: 8,
            width: `${100 - index * 14}%`,
            borderRadius: 999,
            background: index === 0 ? accent : '#D9E5FF',
            opacity: index === 0 ? 1 : 0.7,
            marginTop: index === 0 ? 0 : 10,
          }}
        />
      ))}
    </div>
  );
}

export function AssistantOfficeVisual() {
  return (
    <div className="site-visual-stage">
      <div className="site-visual-orb site-visual-orb--large" />
      <div className="site-visual-screen">
        <div className="site-visual-screen__bar" />
        <div className="site-visual-screen__body">
          <div className="site-visual-screen__side">
            {[1, 2, 3, 4, 5].map((item) => (
              <span key={item} className={item === 2 ? 'is-active' : ''} />
            ))}
          </div>
          <div className="site-visual-screen__content">
            <div className="site-visual-line-chart">
              <svg viewBox="0 0 240 90" fill="none">
                <polyline points="8,72 44,48 74,60 110,34 142,44 178,22 230,30" stroke="#1664FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="8,80 44,68 74,72 110,60 142,64 178,50 230,54" stroke="#7B6CFF" strokeWidth="3" strokeDasharray="5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="site-visual-dual-card">
              <div className="bars">
                {[52, 70, 42, 84, 62].map((height) => (
                  <i key={height} style={{ height: `${height}%` }} />
                ))}
              </div>
              <div className="donut">
                <svg viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="26" fill="none" stroke="#E5EAF2" strokeWidth="10" />
                  <circle cx="40" cy="40" r="26" fill="none" stroke="#1664FF" strokeWidth="10" strokeDasharray="120 200" transform="rotate(-90 40 40)" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="site-visual-chip site-visual-chip--left">为您准备日报…</div>
    </div>
  );
}

export function AssistantHrVisual() {
  return (
    <div className="site-visual-stage">
      <div className="site-resume-stack">
        <div className="site-resume-card site-resume-card--ghost" />
        <div className="site-resume-card">
          <div className="site-resume-card__head">
            <strong>Resume 01</strong>
            <span>高级前端工程师 · 5年</span>
          </div>
          <div className="site-resume-tags">
            <span>React</span>
            <span>TS</span>
          </div>
          <div className="site-resume-lines">
            <i />
            <i />
            <i />
          </div>
          <div className="site-score-ring">
            <svg viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="22" fill="none" stroke="#E5EAF2" strokeWidth="6" />
              <circle cx="30" cy="30" r="22" fill="none" stroke="#1664FF" strokeWidth="6" strokeDasharray="110 140" transform="rotate(-90 30 30)" strokeLinecap="round" />
              <text x="30" y="35" textAnchor="middle">
                92
              </text>
            </svg>
          </div>
        </div>
      </div>
      <div className="site-visual-orb site-visual-orb--medium site-visual-orb--purple" />
      <div className="site-visual-chip site-visual-chip--top-right">⚡ 精准匹配</div>
      <div className="site-visual-chip site-visual-chip--bottom-right">↑ 效率提升 5x</div>
    </div>
  );
}

export function AssistantEngineeringVisual() {
  return (
    <div className="site-visual-stage">
      <div className="site-code-editor">
        <div className="site-code-editor__title">arkclaw.ts — main</div>
        <div className="site-code-editor__lines">
          {[48, 86, 112, 78, 96, 118, 68].map((width, index) => (
            <div key={width} className="site-code-editor__row">
              <span>{index + 1}</span>
              <i style={{ width }} />
              <i className="site-code-editor__dim" style={{ width: [74, 52, 38, 94, 58, 42, 76][index] }} />
            </div>
          ))}
        </div>
        <div className="site-code-editor__suggestion">
          <small>✨ Ark 建议</small>
          <b>自动补齐测试与回归检查</b>
        </div>
      </div>
      <div className="site-visual-orb site-visual-orb--small" />
      <GlassPanel title="单元测试" lines={['132 通过 · 0 失败', '覆盖率自动补齐', '回归用例已生成']} badge="94%" accent="#7CCBA2" />
    </div>
  );
}

export function AssistantMarketVisual() {
  return (
    <div className="site-visual-stage">
      <div className="site-phone-mock">
        <div className="site-phone-mock__banner" />
        <div className="site-phone-mock__card">
          <i />
          <i />
          <i />
        </div>
        <div className="site-phone-mock__card">
          <i />
          <i />
          <i />
        </div>
        <div className="site-phone-mock__promo" />
        <button type="button">立即转化 →</button>
      </div>
      <div className="site-market-side">
        <GlassPanel title="✨ AI 文案生成" lines={['主标题生成', '人群标签推荐', '多语种投放']} badge="活力" accent="#7B6CFF" />
        <div className="site-market-gallery">
          <div className="one" />
          <div className="two" />
        </div>
        <div className="site-market-stats">
          <small>CTR 提升</small>
          <strong>
            +187<span>%</span>
          </strong>
        </div>
      </div>
    </div>
  );
}

export function SecurityVisual({ kind }: { kind: string }) {
  const content = {
    cube: (
      <div className="site-security-stack">
        <span className="cube cube--top" />
        <span className="cube cube--mid" />
        <span className="cube cube--bottom" />
      </div>
    ),
    doc: (
      <div className="site-security-doc">
        <div className="card">
          <b />
          <i />
          <i />
          <i />
        </div>
        <div className="lock" />
      </div>
    ),
    cloud: (
      <div className="site-security-cloud">
        <div className="cloud-shape" />
        <span>↑</span>
        <span>↓</span>
      </div>
    ),
    search: (
      <div className="site-security-search">
        <div className="chart">
          <svg viewBox="0 0 100 60">
            <polyline points="6,42 24,28 40,32 56,18 72,22 92,12" stroke="#1664FF" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <div className="lens" />
      </div>
    ),
    shield: <div className="site-security-shield" />,
    sso: (
      <div className="site-security-hub">
        <div className="core" />
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <span key={item} className={`node node-${item + 1}`} />
        ))}
      </div>
    ),
    aiAssist: (
      <div className="site-security-folder">
        <div className="folder" />
        <div className="file file-one" />
        <div className="file file-two" />
      </div>
    ),
    audit: (
      <div className="site-security-memory">
        <span className="layer layer-1" />
        <span className="layer layer-2" />
        <span className="layer layer-3" />
        <div className="brain" />
      </div>
    ),
  };

  return <div className="site-security-stage">{content[kind as keyof typeof content]}</div>;
}

export function CaseVisual({ kind }: { kind: string }) {
  if (kind === 'auto') {
    return (
      <div className="site-case-scene">
        <div className="site-case-ambient" />
        <div className="site-car">
          <span className="roof" />
          <span className="wheel wheel-left" />
          <span className="wheel wheel-right" />
        </div>
      </div>
    );
  }

  if (kind === 'internet') {
    return (
      <div className="site-case-scene site-case-scene--network">
        <div className="site-network-servers">
          {[1, 2, 3].map((item) => (
            <div key={item} className="server-card" />
          ))}
        </div>
        <div className="site-network-hub">
          <div className="core" />
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <span key={item} className={`node node-${item}`} />
          ))}
        </div>
      </div>
    );
  }

  if (kind === 'electronics') {
    return (
      <div className="site-case-scene site-case-scene--dashboard">
        <div className="chart-stack">
          <div className="line-card" />
          <div className="pie-card" />
          <div className="bar-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="site-case-scene site-case-scene--insight">
      <div className="insight-card">
        <div className="insight-card__header" />
        <div className="insight-card__table">
          {[1, 2, 3, 4].map((item) => (
            <i key={item} />
          ))}
        </div>
      </div>
      <div className="insight-side">
        <div className="metric-circle" />
        <div className="metric-pill">24/7 智能值班</div>
      </div>
    </div>
  );
}

export function ContactScene() {
  return (
    <svg viewBox="0 0 520 520" style={{ width: '100%', maxWidth: 520, marginTop: 48 }}>
      <defs>
        <radialGradient id="site-contact-orb">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="40%" stopColor="#A5C4FF" />
          <stop offset="100%" stopColor="#1664FF" stopOpacity="0.5" />
        </radialGradient>
        <linearGradient id="site-contact-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8F0FF" />
          <stop offset="100%" stopColor="#C7B6FF" stopOpacity="0.6" />
        </linearGradient>
        <pattern id="site-contact-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M0 20 L20 20 M20 0 L20 20" stroke="#1664FF" strokeWidth="0.4" opacity="0.3" />
        </pattern>
      </defs>
      <g transform="translate(260, 360) scale(1.4, 0.5)">
        <rect x="-260" y="-100" width="520" height="200" fill="url(#site-contact-grid)" />
      </g>
      <ellipse cx="260" cy="380" rx="200" ry="36" fill="url(#site-contact-base)" opacity="0.6" />
      <ellipse cx="260" cy="380" rx="160" ry="28" fill="#fff" opacity="0.55" />
      <ellipse cx="260" cy="380" rx="120" ry="20" fill="#A5C4FF" opacity="0.4" />
      <circle cx="260" cy="280" r="120" fill="url(#site-contact-orb)" />
      <ellipse cx="220" cy="240" rx="36" ry="22" fill="#fff" opacity="0.55" transform="rotate(-25 220 240)" />
      <g transform="translate(380, 130)">
        <path d="M0,30 L26,0 L18,8 L40,30 L18,52 L26,60 Z" fill="#0B1F3A" opacity="0.85" />
      </g>
      {[
        ['敏捷迭代', '#1664FF', 80, 130],
        ['数据驱动', '#7B6CFF', 60, 220],
        ['体验提升', '#38BDF8', 80, 310],
      ].map(([label, color, x, y]) => (
        <g key={label as string} transform={`translate(${x}, ${y})`}>
          <rect width="130" height="36" rx="18" fill="#fff" stroke="#E5EAF2" />
          <circle cx="20" cy="18" r="7" fill={color as string} />
          <text x="36" y="22" fontSize="11" fill="#1F2D44" fontWeight="500">
            {label as string}
          </text>
        </g>
      ))}
      {[
        [118, 116],
        [154, 192],
        [412, 96],
        [442, 176],
        [382, 300],
        [156, 340],
      ].map(([x, y], index) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={index % 2 === 0 ? 2.2 : 1.4} fill="#1664FF" opacity={0.24 + index * 0.08} />
      ))}
    </svg>
  );
}
