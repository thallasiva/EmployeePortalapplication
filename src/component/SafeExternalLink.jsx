/**
 * SafeExternalLink
 * ================
 * A drop-in replacement for <a href="..."> when linking to external URLs.
 *
 * Security properties enforced automatically:
 *  • rel="noopener noreferrer"  — prevents the new tab from accessing
 *    window.opener (tabnabbing / reverse-tabnapping attacks).
 *  • target="_blank"            — opens in new tab (configurable).
 *  • No referrer sent           — the Referrer-Policy header already covers
 *    this server-side; the rel attribute is the client-side belt-and-braces.
 *
 * Usage:
 *   <SafeExternalLink href="https://example.com">Visit site</SafeExternalLink>
 *
 * Never use a plain <a target="_blank"> for external URLs — always use this.
 */
const SafeExternalLink = ({ href, children, className = "", ...rest }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={className}
    {...rest}
  >
    {children}
  </a>
);

export default SafeExternalLink;
