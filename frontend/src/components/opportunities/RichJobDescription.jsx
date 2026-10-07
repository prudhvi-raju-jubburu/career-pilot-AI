import React, { useMemo } from 'react';

/**
 * CareerPilot AI — RichJobDescription
 * Safely parses, sanitizes, and renders job descriptions that may contain
 * raw HTML (from RSS/MsoNormal/job boards) or plain text without scattering
 * raw HTML tags or breaking theme contrast.
 */
export default function RichJobDescription({ description, className = '' }) {
  const sanitized = useMemo(() => {
    if (!description || typeof description !== 'string') {
      return { isHtml: false, content: 'No detailed description provided by the source.' };
    }

    let raw = description.trim();

    // Check if HTML entities were escaped (e.g., &lt;p&gt;)
    if (
      raw.includes('&lt;') &&
      (raw.includes('&lt;p') ||
        raw.includes('&lt;div') ||
        raw.includes('&lt;span') ||
        raw.includes('&lt;ul') ||
        raw.includes('&lt;li') ||
        raw.includes('&lt;br') ||
        raw.includes('&lt;b') ||
        raw.includes('&lt;strong'))
    ) {
      if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = raw;
        raw = textarea.value;
      }
    }

    // Check if the content contains HTML tags
    const hasHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
    if (!hasHtml) {
      return { isHtml: false, content: raw };
    }

    if (typeof DOMParser === 'undefined') {
      // Fallback in non-browser environment: strip tags
      return { isHtml: false, content: raw.replace(/<[^>]+>/g, ' ') };
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(raw, 'text/html');

      // 1. Remove dangerous or non-content tags completely
      const dangerousTags = [
        'script', 'style', 'iframe', 'object', 'embed', 'form',
        'input', 'button', 'select', 'textarea', 'svg', 'canvas',
        'meta', 'link', 'applet', 'base'
      ];
      dangerousTags.forEach((tag) => {
        doc.querySelectorAll(tag).forEach((el) => el.remove());
      });

      // 2. Allowed semantic tags for job listings
      const allowedTags = new Set([
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
        'span', 'div', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'section'
      ]);

      // 3. Process all elements
      const elements = Array.from(doc.body.querySelectorAll('*'));
      for (const el of elements) {
        const tag = el.tagName.toLowerCase();

        if (!allowedTags.has(tag)) {
          // Unwrap disallowed element into its text/children
          const parent = el.parentNode;
          if (parent) {
            while (el.firstChild) {
              parent.insertBefore(el.firstChild, el);
            }
            parent.removeChild(el);
          }
          continue;
        }

        // Strip inline styles that cause dark-mode/light-mode contrast failures (e.g. color: #000000)
        el.removeAttribute('style');
        // Strip class attributes that contain foreign classes (e.g. MsoNormal, c-job-desc)
        el.removeAttribute('class');
        el.removeAttribute('id');

        // Clean attributes: remove on* event handlers and untrusted props
        const attrs = Array.from(el.attributes);
        for (const attr of attrs) {
          const name = attr.name.toLowerCase();
          if (name.startsWith('on') || name === 'style' || name === 'class' || name === 'id') {
            el.removeAttribute(attr.name);
          } else if (tag === 'a') {
            if (name === 'href') {
              const href = attr.value.trim().toLowerCase();
              if (href.startsWith('javascript:') || href.startsWith('data:')) {
                el.removeAttribute('href');
              } else {
                el.setAttribute('target', '_blank');
                el.setAttribute('rel', 'noopener noreferrer');
              }
            } else if (name !== 'target' && name !== 'rel' && name !== 'title') {
              el.removeAttribute(attr.name);
            }
          } else if (name !== 'title') {
            el.removeAttribute(attr.name);
          }
        }

        // Clean up empty paragraphs or spans with zero content
        if (
          (tag === 'p' || tag === 'div' || tag === 'span') &&
          !el.textContent.trim() &&
          !el.querySelector('br, hr, img')
        ) {
          el.remove();
        }
      }

      // Remove HTML comments
      const iterator = doc.createNodeIterator(doc.body, NodeFilter.SHOW_COMMENT);
      let commentNode;
      const commentsToRemove = [];
      while ((commentNode = iterator.nextNode())) {
        commentsToRemove.push(commentNode);
      }
      commentsToRemove.forEach((c) => c.remove());

      const cleanHtml = doc.body.innerHTML.trim();
      return { isHtml: true, content: cleanHtml || raw };
    } catch (e) {
      console.warn('HTML sanitization fallback:', e);
      return { isHtml: false, content: raw };
    }
  }, [description]);

  if (!sanitized.isHtml) {
    return (
      <div
        className={`rich-job-description ${className}`}
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.65,
          whiteSpace: 'pre-line',
          wordBreak: 'break-word',
        }}
      >
        {sanitized.content}
      </div>
    );
  }

  return (
    <>
      <div
        className={`rich-job-description ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitized.content }}
      />
      <style>{`
        .rich-job-description {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.65;
          word-break: break-word;
        }
        .rich-job-description p {
          margin-top: 0;
          margin-bottom: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.65;
        }
        .rich-job-description p:last-child {
          margin-bottom: 0;
        }
        .rich-job-description h1,
        .rich-job-description h2,
        .rich-job-description h3,
        .rich-job-description h4,
        .rich-job-description h5,
        .rich-job-description h6 {
          color: var(--text-primary);
          font-weight: 700;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          line-height: 1.35;
          letter-spacing: -0.01em;
        }
        .rich-job-description h1 { font-size: 1.15rem; }
        .rich-job-description h2 { font-size: 1.05rem; }
        .rich-job-description h3 { font-size: 0.975rem; }
        .rich-job-description h4,
        .rich-job-description h5,
        .rich-job-description h6 { font-size: 0.9rem; }
        .rich-job-description strong,
        .rich-job-description b {
          color: var(--text-primary);
          font-weight: 700;
        }
        .rich-job-description em,
        .rich-job-description i {
          font-style: italic;
        }
        .rich-job-description ul,
        .rich-job-description ol {
          margin-top: 0.4rem;
          margin-bottom: 0.85rem;
          padding-left: 1.35rem;
          color: var(--text-secondary);
        }
        .rich-job-description li {
          margin-bottom: 0.35rem;
          line-height: 1.6;
        }
        .rich-job-description a {
          color: var(--primary);
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color var(--transition-fast);
        }
        .rich-job-description a:hover {
          color: var(--primary-hover);
        }
        .rich-job-description blockquote {
          border-left: 3px solid var(--primary);
          margin: 0.85rem 0;
          padding: 0.35rem 0 0.35rem 0.85rem;
          color: var(--text-muted);
          font-style: italic;
        }
        .rich-job-description code {
          font-family: var(--font-mono, monospace);
          font-size: 0.8125rem;
          background: var(--bg-secondary);
          color: var(--primary);
          padding: 0.15rem 0.35rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
        }
        .rich-job-description pre {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 0.75rem 1rem;
          overflow-x: auto;
          margin: 0.75rem 0;
        }
        .rich-job-description hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 1.25rem 0;
        }
      `}</style>
    </>
  );
}
