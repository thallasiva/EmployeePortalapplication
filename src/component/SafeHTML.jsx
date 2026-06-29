/**
 * SafeHTML — safe replacement for dangerouslySetInnerHTML
 * ────────────────────────────────────────────────────────
 * NEVER use dangerouslySetInnerHTML with unsanitised input.
 * Use this component instead — it runs DOMPurify (or the built-in
 * fallback sanitiser) before inserting any HTML.
 *
 * Why dangerouslySetInnerHTML is risky:
 *  • XSS: <img src=x onerror="stealCookies()"> is rendered as-is
 *  • Even trusted APIs can be compromised (supply chain attack)
 *  • React's prop escaping doesn't apply inside dangerouslySetInnerHTML
 *
 * Usage:
 *   // ✗ UNSAFE:
 *   <div dangerouslySetInnerHTML={{ __html: serverContent }} />
 *
 *   // ✓ SAFE:
 *   <SafeHTML html={serverContent} />
 *   <SafeHTML html={serverContent} as="span" className="prose" />
 */
import React, { memo, useMemo } from "react";
import { safeHtml } from "../utils/sanitize";

const SafeHTML = memo(function SafeHTML({ html, as: Tag = "div", className, style, ...rest }) {
  // Memoised so sanitisation only runs when html changes
  const sanitised = useMemo(() => safeHtml(html), [html]);

  return (
    <Tag
      className={className}
      style={style}
      dangerouslySetInnerHTML={sanitised}
      {...rest}
    />
  );
});

export default SafeHTML;
