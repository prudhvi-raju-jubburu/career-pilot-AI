import React from 'react';

/**
 * Validates that an anchor URL uses safe protocols (https, http, or whitelisted internal paths)
 * and rejects dangerous vectors like javascript:, data:, vbscript:, or file: protocols.
 */
export function isSafeUrl(href) {
  if (!href || typeof href !== 'string') return false;
  const clean = href.trim().toLowerCase();
  // Disallow script schemes, data URIs, vbscript, file protocol
  if (/^(javascript|data|vbscript|file):/i.test(clean)) return false;
  // Disallow control characters
  if (/[\x00-\x1F\x7F]/.test(clean)) return false;

  // Internal routes
  if (clean.startsWith('/')) {
    // Only allow whitelisted application routes
    return /^(\/(opportunities|profile|applications|skill-gap|dashboard|settings|notifications|interview|mock-test))(\?.*)?$/i.test(clean);
  }

  // Safe external URLs (http/https only)
  try {
    const parsed = new URL(href);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Formats markdown text into clean React elements:
 * - Replaces ### headings with structured headers
 * - Replaces [link](url) with clickable styled anchors
 * - Replaces **bold** with <strong>
 * - Replaces *italic* with <em>
 * - Replaces `code` with <code>
 * - Formats bullet lists and numbered lists with clean alignment
 */
export function formatMarkdown(text) {
  if (!text) return '';

  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    if (trimmed === '') {
      return <div key={lineIdx} style={{ height: '0.4rem' }} />;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      return (
        <h4
          key={lineIdx}
          style={{
            fontSize: '1.02rem',
            fontWeight: 700,
            margin: '0.7rem 0 0.3rem',
            color: 'inherit',
            letterSpacing: '-0.01em',
          }}
        >
          {trimmed.slice(4)}
        </h4>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h3
          key={lineIdx}
          style={{
            fontSize: '1.12rem',
            fontWeight: 700,
            margin: '0.85rem 0 0.35rem',
            color: 'inherit',
            letterSpacing: '-0.01em',
          }}
        >
          {trimmed.slice(3)}
        </h3>
      );
    }

    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
    const isNumbered = /^\d+\.\s/.test(trimmed);

    // Clean bullet or numbered prefix
    let content = line;
    let bulletPrefix = null;
    if (isBullet) {
      bulletPrefix = '• ';
      content = trimmed.replace(/^([•\-\*]\s*)/, '');
    } else if (isNumbered) {
      const match = trimmed.match(/^(\d+\.)\s*(.*)$/);
      if (match) {
        bulletPrefix = match[1] + ' ';
        content = match[2];
      }
    }

    // Parse links, bold, italic, code
    const tokens = [];
    const regex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({ type: 'text', value: content.substring(lastIndex, match.index) });
      }
      const raw = match[0];
      if (raw.startsWith('[') && raw.endsWith(')')) {
        const linkMatch = raw.match(/^\[(.*)\]\((.*)\)$/);
        if (linkMatch) {
          tokens.push({ type: 'link', label: linkMatch[1], href: linkMatch[2] });
        } else {
          tokens.push({ type: 'text', value: raw });
        }
      } else if (raw.startsWith('**') && raw.endsWith('**')) {
        tokens.push({ type: 'bold', value: raw.slice(2, -2) });
      } else if (raw.startsWith('`') && raw.endsWith('`')) {
        tokens.push({ type: 'code', value: raw.slice(1, -1) });
      } else if (raw.startsWith('*') && raw.endsWith('*')) {
        tokens.push({ type: 'italic', value: raw.slice(1, -1) });
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      tokens.push({ type: 'text', value: content.substring(lastIndex) });
    }

    return (
      <div
        key={lineIdx}
        style={{
          display: 'flex',
          alignItems: 'baseline',
          marginBottom: '0.25rem',
          paddingLeft: isBullet || isNumbered ? '0.75rem' : 0,
          lineHeight: 1.55,
        }}
      >
        {bulletPrefix && (
          <span style={{ fontWeight: 700, marginRight: '0.4rem', color: 'inherit', flexShrink: 0 }}>
            {bulletPrefix}
          </span>
        )}
        <span style={{ flex: 1 }}>
          {tokens.map((token, tIdx) => {
            if (token.type === 'link') {
              const safe = isSafeUrl(token.href);
              if (!safe) {
                return <span key={tIdx} style={{ fontWeight: 600 }}>{token.label}</span>;
              }
              const isExternal = !token.href.startsWith('/');
              return (
                <a
                  key={tIdx}
                  href={token.href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  style={{
                    color: '#2563eb',
                    textDecoration: 'underline',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    if (token.href.startsWith('/')) {
                      e.preventDefault();
                      window.location.href = token.href;
                    }
                  }}
                >
                  {token.label}
                </a>
              );
            }
            if (token.type === 'bold') {
              return (
                <strong key={tIdx} style={{ fontWeight: 700, color: 'inherit' }}>
                  {token.value}
                </strong>
              );
            }
            if (token.type === 'italic') {
              return (
                <em key={tIdx} style={{ fontStyle: 'italic', opacity: 0.95 }}>
                  {token.value}
                </em>
              );
            }
            if (token.type === 'code') {
              return (
                <code
                  key={tIdx}
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    padding: '0.15rem 0.35rem',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '0.85em',
                  }}
                >
                  {token.value}
                </code>
              );
            }
            return <span key={tIdx}>{token.value}</span>;
          })}
        </span>
      </div>
    );
  });
}
