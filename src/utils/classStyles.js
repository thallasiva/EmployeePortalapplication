const styleCache = new Map();
let styleSheet;

const unitlessProperties = new Set([
  "animationIterationCount",
  "borderImageOutset",
  "borderImageSlice",
  "borderImageWidth",
  "boxFlex",
  "boxFlexGroup",
  "boxOrdinalGroup",
  "columnCount",
  "columns",
  "flex",
  "flexGrow",
  "flexPositive",
  "flexShrink",
  "flexNegative",
  "flexOrder",
  "gridArea",
  "gridRow",
  "gridRowEnd",
  "gridRowSpan",
  "gridRowStart",
  "gridColumn",
  "gridColumnEnd",
  "gridColumnSpan",
  "gridColumnStart",
  "fontWeight",
  "lineClamp",
  "lineHeight",
  "opacity",
  "order",
  "orphans",
  "tabSize",
  "widows",
  "zIndex",
  "zoom",
]);

function getStyleSheet()
{
  if (typeof document === "undefined") return null;
  if (styleSheet) return styleSheet;

  const tag = document.createElement("style");
  tag.setAttribute("data-generated-class-styles", "true");
  document.head.appendChild(tag);
  styleSheet = tag.sheet;
  return styleSheet;
}

function kebabCase(property)
{
  return property
    .replace(/^ms/, "-ms")
    .replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function normalizeValue(property, value)
{
  if (value == null || typeof value === "boolean") return null;
  if (typeof value === "number" && value !== 0 && !unitlessProperties.has(property))
  {
    return `${value}px`;
  }
  return String(value);
}

function hash(value)
{
  let result = 5381;
  for (let i = 0; i < value.length; i += 1)
  {
    result = (result * 33) ^ value.charCodeAt(i);
  }
  return (result >>> 0).toString(36);
}

export function cssClass(style)
{
  if (!style || typeof style !== "object") return "";

  const rules = Object.entries(style)
    .map(([property, value]) =>
    {
      const normalized = normalizeValue(property, value);
      return normalized == null ? "" : `${kebabCase(property)}:${normalized}`;
    })
    .filter(Boolean)
    .join(";");

  if (!rules) return "";

  if (styleCache.has(rules)) return styleCache.get(rules);

  const className = `js-style-${hash(rules)}`;
  styleCache.set(rules, className);

  const sheet = getStyleSheet();
  if (sheet)
  {
    sheet.insertRule(`.${className}{${rules}}`, sheet.cssRules.length);
  }

  return className;
}

export function joinClasses(...classes)
{
  return classes.filter(Boolean).join(" ");
}
