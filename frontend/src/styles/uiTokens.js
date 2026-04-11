export const uiTokens = {
  pageMaxWidth: 820,
  dashboardMaxWidth: 980,
  pagePadding: 'clamp(18px, 4vw, 28px) clamp(12px, 3.4vw, 20px)',
  panelRadiusSm: 12,
  panelRadius: 14,
  panelRadiusLg: 18,
  panelPadding: '24px 28px',
  panelPaddingMobile: '18px 14px',
  panelShadow: '0 2px 12px rgba(0,0,0,0.08)',
  titleSize: 'clamp(1.55rem, 3.8vw, 1.9rem)',
  titleColor: '#1a1a2e',
  subtitleSize: 'clamp(0.78rem, 2.5vw, 0.9rem)',
  subtitleColor: '#666',
  sectionTitleSize: 'clamp(1rem, 3vw, 1.06rem)',
  sectionTitleColor: '#333'
}

/** Semantic color helpers — all reference CSS custom properties so they
 *  adapt automatically between light and dark themes. */
export const sem = {
  success: {
    bg: 'var(--success-bg)',
    border: 'var(--success-border)',
    text: 'var(--success-text)',
    textStrong: 'var(--success-text-strong)',
    accent: 'var(--success-accent)'
  },
  warning: {
    bg: 'var(--warning-bg)',
    border: 'var(--warning-border)',
    text: 'var(--warning-text)',
    textStrong: 'var(--warning-text-strong)',
    accent: 'var(--warning-accent)'
  },
  error: {
    bg: 'var(--error-bg)',
    border: 'var(--error-border)',
    text: 'var(--error-text)',
    textStrong: 'var(--error-text-strong)',
    accent: 'var(--error-accent)'
  },
  info: {
    bg: 'var(--info-bg)',
    border: 'var(--info-border)',
    text: 'var(--info-text)',
    textStrong: 'var(--info-text-strong)',
    accent: 'var(--info-accent)'
  },
  purple: {
    bg: 'var(--purple-bg)',
    border: 'var(--purple-border)',
    text: 'var(--purple-text)',
    textStrong: 'var(--purple-text-strong)',
    accent: 'var(--purple-accent)'
  }
}

