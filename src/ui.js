// Gestion du formulaire : lecture des valeurs, régénération debouncée et
// branchement des boutons.

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
    themeLight: document.getElementById('theme-light'),
    themeDark: document.getElementById('theme-dark'),
    export: document.getElementById('btn-export'),
    exportColor: document.getElementById('btn-export-color'),
  };

  let theme = 'light';

  const readParams = () => ({
    name: el.name.value.trim(),
    message: el.message.value.trim(),
    time: el.time.value.trim(),
    date: el.date.value.trim(),
    theme,
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
