



















import React, { memo, useMemo } from "react";
import { safeHtml } from "../utils/sanitize";import { cssClass, joinClasses } from "../utils/classStyles";

const SafeHTML = memo(function SafeHTML({ html, as: Tag = "div", className, style, ...rest }) {

  const sanitised = useMemo(() => safeHtml(html), [html]);

  return (
    <Tag
      className={joinClasses(className, cssClass(
        style))}
      dangerouslySetInnerHTML={sanitised}
      {...rest} />);


});

export default SafeHTML;
