import type { Control, Parameters } from '../types';

export function displayValue(value: number, unit = ''): string {
  return `${Number.isInteger(value) ? value : value.toFixed(2).replace(/0$/, '')}${unit}`;
}
export function createControls(controls: Control[], params: Parameters, onChange: (key: string, value: number | string | boolean) => void, onAction: (key: string) => void): DocumentFragment {
  const fragment = document.createDocumentFragment();
  for (const control of controls) {
    if (control.type === 'action') {
      const button = document.createElement('button');
      button.className = 'regenerate-button';
      button.textContent = `${control.label} ↻`;
      button.addEventListener('click', () => onAction(control.key));
      fragment.append(button);
      continue;
    }
    const label = document.createElement('label');
    label.className = `control control-${control.type}`;
    const name = document.createElement('span');
    name.className = 'control-name';
    name.textContent = control.label;
    label.append(name);
    if (control.type === 'text') {
      const input = document.createElement('input');
      input.type = 'text'; input.name = control.key; input.value = String(params[control.key] ?? '');
      input.autocomplete = 'off'; input.spellcheck = false;
      const help = document.createElement('small'); help.textContent = control.help;
      input.addEventListener('input', () => {
        const clean = control.sanitize(input.value);
        if (clean !== input.value) input.value = clean;
        onChange(control.key, clean);
      });
      label.append(input, help);
    } else if (control.type === 'select') {
      const select = document.createElement('select');
      select.name = control.key;
      for (const option of control.options) select.add(new Option(option.label, option.value));
      select.value = String(params[control.key]);
      select.addEventListener('change', () => onChange(control.key, select.value));
      label.append(select);
    } else {
      const input = document.createElement('input');
      input.name = control.key;
      if (control.type === 'toggle') {
        input.type = 'checkbox';
        input.checked = Boolean(params[control.key]);
        const status = control.key === 'grid' ? document.createElement('span') : null;
        if (status) { status.className = 'grid-toggle-state'; status.setAttribute('aria-hidden', 'true'); status.textContent = input.checked ? 'On' : 'Off'; name.append(status); }
        input.addEventListener('change', () => { if (status) status.textContent = input.checked ? 'On' : 'Off'; onChange(control.key, input.checked); });
      } else {
        input.type = control.type;
        input.min = String(control.min); input.max = String(control.max); input.step = String(control.step);
        input.value = String(params[control.key]);
        const output = document.createElement('output');
        output.textContent = displayValue(Number(input.value), control.unit);
        if (control.type === 'range') label.append(output);
        const commit = () => {
          if (input.value === '' || !Number.isFinite(input.valueAsNumber)) return;
          const clamped = Math.min(control.max, Math.max(control.min, input.valueAsNumber));
          const value = Number((control.min + Math.round((clamped - control.min) / control.step) * control.step).toFixed(4));
          input.value = String(value);
          input.style.setProperty('--fill', `${(value - control.min) / (control.max - control.min) * 100}%`);
          output.textContent = displayValue(value, control.unit);
          onChange(control.key, value);
        };
        input.style.setProperty('--fill', `${(Number(input.value) - control.min) / (control.max - control.min) * 100}%`);
        input.addEventListener(control.type === 'number' ? 'change' : 'input', commit);
      }
      label.append(input);
    }
    fragment.append(label);
  }
  return fragment;
}
