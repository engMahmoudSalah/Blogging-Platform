// Allow-list HTML sanitizer for post bodies written by other users.
const TAGS = new Set(['p','br','strong','b','em','i','u','s','strike','h1','h2','h3','h4','ul','ol','li','blockquote','pre','code','a','img','span','hr','sub','sup']);
const ATTRS: Record<string, string[]> = { a: ['href', 'title'], img: ['src', 'alt'], '*': ['class'] };
const safeUrl = (v: string, img: boolean) => /^https?:\/\//i.test(v) || (!img && /^mailto:/i.test(v)) || (img && /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(v));

export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      const tag = child.tagName.toLowerCase();
      if (!TAGS.has(tag)) {
        if (['script', 'style', 'iframe', 'object', 'embed', 'form', 'svg', 'math'].includes(tag)) { child.remove(); continue; }
        walk(child);
        child.replaceWith(...Array.from(child.childNodes));
        continue;
      }
      for (const a of Array.from(child.attributes)) {
        const name = a.name.toLowerCase();
        const ok = (ATTRS[tag] || []).includes(name) || ATTRS['*'].includes(name);
        if (!ok || (name === 'href' && !safeUrl(a.value, false)) || (name === 'src' && !safeUrl(a.value, true))) child.removeAttribute(a.name);
      }
      if (tag === 'a') { child.setAttribute('rel', 'noopener noreferrer nofollow'); child.setAttribute('target', '_blank'); }
      if (tag === 'img') child.setAttribute('loading', 'lazy');
      walk(child);
    }
  };
  walk(doc.body);
  return doc.body.innerHTML;
}
