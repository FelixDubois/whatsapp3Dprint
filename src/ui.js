// Gestion du formulaire : lecture des valeurs, régénération debouncée et
// branchement des boutons. L'image téléversée est conservée dans l'état JS
// (pas dans le DOM) et fournie via getImage().

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
    initials: document.getElementById('in-initials'),
    image: document.getElementById('in-image'),
    clearImage: document.getElementById('btn-clear-image'),
    themeLight: document.getElementById('theme-light'),
    themeDark: document.getElementById('theme-dark'),
    export: document.getElementById('btn-export'),
    exportColor: document.getElementById('btn-export-color'),
  };

  let theme = 'light';
  let image = null; // HTMLImageElement ou null

  const readParams = () => ({
    name: el.name.value.trim(),
    message: el.message.value.trim(),
    time: el.time.value.trim(),
    initials: el.initials.value.trim(),
    theme,
    image,
  });

  const debouncedChange = debounce(() => handlers.onChange(readParams()), 200);
  for (const input of [el.name, el.message, el.time, el.initials]) {
    input.addEventListener('input', debouncedChange);
  }

  // Thème
  const setTheme = (t) => {
    theme = t;
    el.themeLight.classList.toggle('active', t === 'light');
    el.themeDark.classList.toggle('active', t === 'dark');
    handlers.onThemeChange(t);
  };
  el.themeLight.addEventListener('click', () => setTheme('light'));
  el.themeDark.addEventListener('click', () => setTheme('dark'));

  // Image
  el.image.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    image = await handlers.onImage(file);
    el.clearImage.classList.remove('hidden');
    handlers.onChange(readParams());
  });
  el.clearImage.addEventListener('click', () => {
    image = null;
    el.image.value = '';
    el.clearImage.classList.add('hidden');
    handlers.onChange(readParams());
  });

  // Export
  el.export.addEventListener('click', () => handlers.onExport());
  el.exportColor.addEventListener('click', () => handlers.onExportColor());

  return { readParams };
}
