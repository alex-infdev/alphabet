/** One tab stop for the canvas; Alt+arrows navigates, plain arrows edit. */
export function pixelNavigation(container: HTMLElement) {
  let current = '';
  const pixels = () => [...container.querySelectorAll<SVGElement>('[data-pixel][role="button"]')];
  function refresh() {
    const items = pixels();
    const active = items.find(item => item.dataset.pixel === current) ?? items[0];
    current = active?.dataset.pixel ?? '';
    for (const item of items) { item.tabIndex = item === active ? 0 : -1; item.setAttribute('aria-describedby', 'pixel-instructions'); }
  }
  container.addEventListener('focusin', event => {
    const pixel = (event.target as Element).closest<SVGElement>('[data-pixel]');
    if (pixel) { current = pixel.dataset.pixel!; refresh(); }
  });
  container.addEventListener('keydown', event => {
    if (!event.altKey || !event.key.startsWith('Arrow')) return;
    const items = pixels(); const origin = items.find(item => item === document.activeElement);
    if (!origin) return;
    event.preventDefault(); event.stopPropagation();
    const rect = origin.getBoundingClientRect();
    const horizontal = ['ArrowLeft', 'ArrowRight'].includes(event.key);
    const sign = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1;
    const candidates = items.filter(item => item !== origin).map(item => {
      const other = item.getBoundingClientRect();
      const dx = other.x + other.width / 2 - rect.x - rect.width / 2;
      const dy = other.y + other.height / 2 - rect.y - rect.height / 2;
      return { item, forward: (horizontal ? dx : dy) * sign, cross: Math.abs(horizontal ? dy : dx) };
    }).filter(item => item.forward > 1).sort((a, b) => a.forward + a.cross * 4 - b.forward - b.cross * 4);
    candidates[0]?.item.focus({ preventScroll: true });
  });
  return refresh;
}
