// Gestion du formulaire : lecture des valeurs, régénération debouncée et
// branchement des boutons.

import { NAME_COLORS } from './theme.js';

export function debounce(fn, ms = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function setupControls(handlers) {
  const el = {
    name: document.getElementById('in-name'),
    message: document.getElementById('in-message'),
    time: document.getElementById('in-time'),
    date: document.getElementById('in-date'),
    nameColors: document.getElementById('name-colors'),
    themeLight: document.getElementById('theme-light'),
    themeDark: document.getElementById('theme-dark'),
    export: document.getElementById('btn-export'),
    exportColor: document.getElementById('btn-export-color'),
  };

  let theme = 'light';
  let nameColor = NAME_COLORS[0];

  const readParams = () => ({
    name: el.name.value.trim(),
    message: el.message.value.replace(/\n+$/, ''), // garde les \n internes, retire ceux en fin
    time: el.time.value.trim(),
    date: el.date.value.trim(),
    nameColor,
    theme,
  });

  // Pastilles de couleur du nom
  const swatches = NAME_COLORS.map((color) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.style.background = color;
    b.title = color;
    if (color === nameColor) b.classList.add('active');
    b.addEventListener('click', () => {
      nameColor = color;
      swatches.forEach((s) => s.classList.toggle('active', s === b));
      handlers.onChange(readParams());
    });
    el.nameColors.appendChild(b);
    return b;
  });

  const debouncedChange = debounce(() => handlers.onChange(readParams()), 200);
  for (const input of [el.name, el.message, el.time, el.date]) {
    input.addEventListener('input', debouncedChange);
  }

  // Thème (couleurs du modèle 3D uniquement)
  const setTheme = (t) => {
    theme = t;
    el.themeLight.classList.toggle('active', t === 'light');
    el.themeDark.classList.toggle('active', t === 'dark');
    handlers.onThemeChange(t);
  };
  el.themeLight.addEventListener('click', () => setTheme('light'));
  el.themeDark.addEventListener('click', () => setTheme('dark'));

  // Export
  el.export.addEventListener('click', () => handlers.onExport());
  el.exportColor.addEventListener('click', () => handlers.onExportColor());

  return { readParams };
}
