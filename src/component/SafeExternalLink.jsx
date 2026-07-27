
















const SafeExternalLink = ({ href, children, className = "", ...rest }) =>
<a
  href={href}
  target="_blank"
  rel="noopener noreferrer"
  className={className}
  {...rest}>

    {children}
  </a>;


export default SafeExternalLink;
