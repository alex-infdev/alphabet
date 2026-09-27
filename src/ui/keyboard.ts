export function enableKeyboard(options: {
  dialog: HTMLDialogElement; action: (name: string) => void;
  undo: (redo: boolean) => void; nudge: (id: string, key: string, step: number) => void;
  select: (id: string, additive: boolean) => void; escape: () => void;
}): void {
  document.addEventListener('keydown', event => {
    const target = event.target as HTMLElement;
    const editing = target.closest('input, textarea, select, [contenteditable="true"]');
    if (options.dialog.open) return;
    const nativeUndo = target.closest('textarea, [contenteditable="true"], input:not([type="range"]):not([type="number"]):not([type="checkbox"]):not([type="radio"])');
    if (!nativeUndo && (event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'z') {
      event.preventDefault(); options.undo(event.shiftKey); return;
    }
    if (editing) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const pixel = target.closest<SVGElement>('[data-pixel]');
    if (pixel && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault(); options.nudge(pixel.dataset.pixel!, event.key, event.shiftKey ? 5 : 1); return;
    }
    if (pixel && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); options.select(pixel.dataset.pixel!, event.shiftKey); return;
    }
    if (event.key === ' ' && target.closest('button, a, summary')) return;
    if (event.repeat) return;
    const command = ({ ArrowLeft: 'previous', ArrowRight: 'next', r: 'randomize', h: 'panel', ' ': 'regenerate' } as Record<string, string>)[event.key.length === 1 ? event.key.toLowerCase() : event.key];
    if (command) { event.preventDefault(); options.action(command); }
    else if (event.key === 'Escape') options.escape();
  });
}
