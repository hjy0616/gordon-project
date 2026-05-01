import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "a",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "blockquote",
  "code",
  "pre",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "class"],
  table: ["class"],
  th: ["colspan", "rowspan", "scope", "style"],
  td: ["colspan", "rowspan", "style"],
  p: ["style"],
  h1: ["style"],
  h2: ["style"],
  h3: ["style"],
};

const ALLOWED_STYLES: sanitizeHtml.IOptions["allowedStyles"] = {
  "*": {
    "text-align": [/^(left|right|center|justify)$/],
  },
};

const ALLOWED_SCHEMES = ["http", "https", "mailto"];

const INTERNAL_IMAGE_PREFIX = "/api/posts/image?key=";

export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedStyles: ALLOWED_STYLES,
    allowedSchemes: ALLOWED_SCHEMES,
    allowedSchemesByTag: {
      img: [],
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      table: (tagName, attribs) => {
        const classes = new Set(
          (attribs.class ?? "").split(/\s+/).filter(Boolean),
        );
        classes.add("tiptap-table");
        classes.add("not-prose");
        return {
          tagName,
          attribs: { ...attribs, class: Array.from(classes).join(" ") },
        };
      },
    },
    exclusiveFilter: (frame) => {
      if (frame.tag === "img") {
        const src = frame.attribs.src ?? "";
        if (!src.startsWith(INTERNAL_IMAGE_PREFIX)) return true;
      }
      return false;
    },
  });
}
