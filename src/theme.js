// Palettes de couleurs reprenant l'identité visuelle de WhatsApp.
// Chaque thème décrit à la fois les couleurs du modèle 3D (base, texte, photo,
// accent) et celles de l'interface du site (fond, panneaux, etc.).

export const THEMES = {
  light: {
    // Modèle 3D
    bubble: '#ffffff', // bulle de message entrante (blanche)
    text: '#111b21', // texte sombre
    profile: '#25d366', // pastille photo (vert WhatsApp)
    profileText: '#ffffff', // initiales
    accent: '#25d366',
    sceneBackground: '#ece5dd', // fond beige caractéristique du chat
    // Interface
    ui: {
      bg: '#ece5dd',
      panel: '#ffffff',
      panelText: '#111b21',
      muted: '#667781',
      border: '#d8dcdf',
      input: '#f0f2f5',
      headerBar: '#075e54',
      headerText: '#ffffff',
    },
  },
  dark: {
    // Modèle 3D
    bubble: '#202c33', // bulle entrante en mode sombre
    text: '#e9edef',
    profile: '#00a884', // teal WhatsApp
    profileText: '#111b21',
    accent: '#00a884',
    sceneBackground: '#0b141a', // fond très sombre du chat
    // Interface
    ui: {
      bg: '#0b141a',
      panel: '#111b21',
      panelText: '#e9edef',
      muted: '#8696a0',
      border: '#2a3942',
      input: '#2a3942',
      headerBar: '#1f2c33',
      headerText: '#e9edef',
    },
  },
};

// Applique les variables CSS du thème sur la racine du document afin que
// l'interface (panneau, boutons, champs) suive le thème choisi.
export function applyUiTheme(themeName) {
  const t = THEMES[themeName].ui;
  const root = document.documentElement.style;
  root.setProperty('--bg', t.bg);
  root.setProperty('--panel', t.panel);
  root.setProperty('--panel-text', t.panelText);
  root.setProperty('--muted', t.muted);
  root.setProperty('--border', t.border);
  root.setProperty('--input', t.input);
  root.setProperty('--header-bar', t.headerBar);
  root.setProperty('--header-text', t.headerText);
  root.setProperty('--accent', THEMES[themeName].accent);
}
