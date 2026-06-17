import { defineConfig } from 'vite';

// base relatif pour pouvoir héberger le site dans n'importe quel sous-dossier
// (GitHub Pages, Netlify, etc.) sans configuration supplémentaire.
export default defineConfig({
  base: './',
});
