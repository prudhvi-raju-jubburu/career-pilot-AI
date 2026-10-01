import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  showShortcut = false,
  shortcutKey = '⌘K',
  className = '',
  style = {},
  ...props
}) {
  const inputRef = useRef(null);

  const handleClear = () => {
    if (onClear) onClear();
    else if (onChange) onChange({ target: { value: '' } });
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        ...style,
      }}
      className={className}
    >
      <Search
        size={16}
        style={{
          position: 'absolute',
          left: '0.85rem',
          color: 'var(--text-muted)',
          pointerEvents: 'none',
        }}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.55rem 2.2rem 0.55rem 2.4rem',
          fontSize: '0.875rem',
          fontFamily: 'inherit',
          color: 'var(--text-primary)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border-control)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sunken)',
          outline: 'none',
          transition: 'all var(--transition-fast)',
        }}
        className="input-tactile"
        {...props}
      />

      {value ? (
        <button
          type="button"
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '0.65rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Clear search"
          aria-label="Clear search"
        >
          <X size={15} />
        </button>
      ) : showShortcut ? (
        <span
          style={{
            position: 'absolute',
            right: '0.65rem',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.15rem 0.4rem',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'var(--bg-sunken)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
            pointerEvents: 'none',
          }}
        >
          {shortcutKey}
        </span>
      ) : null}
    </div>
  );
}
