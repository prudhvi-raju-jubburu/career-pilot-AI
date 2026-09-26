import React from 'react';

/**
 * Formats markdown text into clean React elements:
 * - Replaces **bold** with <strong> (no stars)
 * - Replaces *italic* with <em>
 * - Replaces `code` with <code>
 * - Formats bullet lists and numbered lists with clean alignment
 */
export function formatMarkdown(text) {
  if (!text) return '';

  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    if (line.trim() === '') {
      return <div key={lineIdx} style={{ height: '0.4rem' }} />;
    }

    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('- ') || line.trim().startsWith('* ');
    const isNumbered = /^\d+\.\s/.test(line.trim());

    // Clean bullet or numbered prefix
    let content = line;
    let bulletPrefix = null;
    if (isBullet) {
      bulletPrefix = '• ';
      content = line.trim().replace(/^([•\-\*]\s*)/, '');
    } else if (isNumbered) {
      const match = line.trim().match(/^(\d+\.)\s*(.*)$/);
      if (match) {
        bulletPrefix = match[1] + ' ';
        content = match[2];
      }
    }

    // Parse bold, italic, code
    const tokens = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({ type: 'text', value: content.substring(lastIndex, match.index) });
      }
      const raw = match[0];
      if (raw.startsWith('**') && raw.endsWith('**')) {
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
