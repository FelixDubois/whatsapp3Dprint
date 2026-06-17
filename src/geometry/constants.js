// Dimensions du modèle, exprimées en millimètres (1 unité Three.js = 1 mm).
// Ces valeurs sont choisies pour rester lisibles et imprimables en FDM.
export const DIMS = {
  bubbleWidth: 70, // largeur de la bulle (fixe ; la hauteur s'adapte au message)
  minBubbleHeight: 26, // hauteur minimale (messages courts)
  maxBubbleHeight: 130, // hauteur maximale (garde-fou)
  cornerRadius: 4, // rayon des coins arrondis
  baseThickness: 3, // épaisseur de la plaque
  embossHeight: 1, // hauteur du texte/relief en saillie
  embossSink: 0.2, // enfoncement du texte dans la base (garantit la fusion)

  // Queue de la bulle (coin haut-gauche)
  tailTopBase: 8, // longueur de la base de la queue le long du bord supérieur
  tailSideBase: 8, // longueur de la base de la queue le long du bord gauche
  tailOut: 5, // débordement de la pointe vers la gauche
  tailUp: 3, // débordement de la pointe vers le haut

  // Trou pour l'anneau du porte-clé (coin haut-droit)
  holeRadius: 2.6,
  holeMarginRight: 5.5, // distance du centre au bord droit
  holeMarginTop: 5.5, // distance du centre au bord supérieur

  // Marges internes pour la zone de texte
  padTop: 5,
  padRight: 6,
  padBottom: 4.5,
  padLeft: 5, // marge gauche de la zone de texte
};
