// Palettes de couleurs du MODÈLE 3D uniquement (le style du site est fixe).
// Le toggle clair/sombre ne change que l'aperçu 3D : couleurs de la bulle, du
// texte et fond de la scène — repris de l'identité visuelle de WhatsApp.

export const THEMES = {
  light: {
    bubble: '#ffffff', // bulle de message entrante (blanche)
    text: '#111b21', // texte sombre
    sceneBackground: '#ece5dd', // fond beige caractéristique du chat
  },
  dark: {
    bubble: '#202c33', // bulle entrante en mode sombre
    text: '#e9edef',
    sceneBackground: '#0b141a', // fond très sombre du chat
  },
};

// Palette de couleurs pour le NOM (comme les couleurs d'expéditeur de WhatsApp).
// Choisie pour rester lisible aussi bien sur bulle claire que sombre.
// La première est la couleur par défaut.
export const NAME_COLORS = [
  '#00a884', // vert WhatsApp
  '#34b7f1', // bleu
  '#e542a3', // rose
  '#7e57c2', // violet
  '#ff7043', // orange
  '#ffb300', // ambre
  '#ef5350', // rouge
  '#26a69a', // turquoise
  '#5c6bc0', // indigo
  '#a1887f', // taupe
];
