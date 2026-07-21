const ALLOWED_TAGS = new Set([
  "b",
  "strong",
  "i",
  "em",
  "u",
  "ul",
  "ol",
  "li",
  "a",
  "p",
  "br",
]);

const SAFE_PROTOCOLS = /^(https?:|mailto:)/i;

function isSafeHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("#")) return true;
  return SAFE_PROTOCOLS.test(trimmed);
}

function sanitizeNode(node: Node): void {
  const childNodes = [...node.childNodes];

  for (const child of childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) {
      child.remove();
      continue;
    }

    const element = child as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      const parent = element.parentNode;
      if (!parent) {
        element.remove();
        continue;
      }

      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
      continue;
    }

    [...element.attributes].forEach((attr) => {
      element.removeAttribute(attr.name);
    });

    if (tag === "a") {
      const href = element.getAttribute("href") ?? "";
      if (!isSafeHref(href)) {
        const parent = element.parentNode;
        if (parent) {
          while (element.firstChild) {
            parent.insertBefore(element.firstChild, element);
          }
          parent.removeChild(element);
        } else {
          element.remove();
        }
        continue;
      }

      element.setAttribute("href", href.trim());
      element.setAttribute("rel", "noopener noreferrer");
      element.setAttribute("target", "_blank");
    }

    sanitizeNode(element);
  }
}

export function sanitizeHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return "";

  if (typeof DOMParser === "undefined") {
    return trimmed
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(trimmed, "text/html");
  sanitizeNode(doc.body);

  return doc.body.innerHTML.trim();
}

export function stripHtml(html: string): string {
  const sanitized = sanitizeHtml(html);
  if (typeof DOMParser === "undefined") {
    return sanitized.replace(/<[^>]+>/g, "").trim();
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitized, "text/html");
  return (doc.body.textContent ?? "").trim();
}

export function isHtmlEmpty(html: string): boolean {
  return stripHtml(html).length === 0;
}
