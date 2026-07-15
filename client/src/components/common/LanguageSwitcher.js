import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
];

const LanguageSwitcher = ({ compact = false }) => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = languages.find((l) => l.code === i18n.language) || languages[0];

  const switchLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
    setOpen(false);
  };

  if (compact) {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          className="toggle-btn"
          onClick={() => setOpen(!open)}
          data-tooltip="Change Language"
          style={{ fontSize: '1rem', gap: 4 }}
        >
          {current.flag}
        </button>
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden', zIndex: 500, minWidth: 130,
          }}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => switchLang(lang.code)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '9px 14px',
                  background: i18n.language === lang.code ? 'rgba(99,102,241,0.1)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  color: i18n.language === lang.code ? 'var(--primary-light)' : 'var(--text-primary)',
                  fontSize: '0.875rem', fontFamily: 'var(--font)',
                  fontWeight: i18n.language === lang.code ? 600 : 400,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = i18n.language === lang.code ? 'rgba(99,102,241,0.1)' : 'transparent'}
              >
                <span style={{ fontSize: '1.1rem' }}>{lang.flag}</span>
                {lang.label}
                {i18n.language === lang.code && <span style={{ marginLeft: 'auto', color: 'var(--primary)' }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => switchLang(lang.code)}
          className={`btn btn-sm ${i18n.language === lang.code ? 'btn-primary' : 'btn-ghost'}`}
          style={{ gap: 5 }}
        >
          {lang.flag} {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
