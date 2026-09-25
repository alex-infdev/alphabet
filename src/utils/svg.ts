const NS = 'http://www.w3.org/2000/svg';
export function svgElement<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const element = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}
export function glyphSvg(letter: string, style: string): SVGSVGElement {
  const svg = svgElement('svg', { viewBox: '0 0 120 150', class: 'glyph-svg', 'aria-label': `${letter}, ${style}` });
  const title = svgElement('title');
  title.textContent = `${letter} / ${style}`;
  svg.append(title);
  return svg;
}
