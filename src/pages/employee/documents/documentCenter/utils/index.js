import { API_BASE_URL } from "../../../../../api/client";

export function toJumpId(value) {
  return `jump-${String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function scrollElementIntoContainer(el) {
  const container = el.closest("[data-doc-scroll]");
  if (container) {
    const elTop = el.getBoundingClientRect().top;
    const containerTop = container.getBoundingClientRect().top;
    container.scrollTo({
      top: container.scrollTop + (elTop - containerTop) - 8,
      behavior: "smooth"
    });
    return;
  }
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function docFileUrl(relPath) {
  if (!relPath) return "#";
  const base = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${base}${relPath}`;
}
