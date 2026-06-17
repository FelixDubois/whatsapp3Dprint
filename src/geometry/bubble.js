import * as THREE from 'three';
import { DIMS } from './constants.js';

// Construit la silhouette de la bulle de message (rectangle à coins arrondis +
// queue WhatsApp en haut à gauche + trou traversant pour l'anneau en haut à
// droite), puis l'extrude pour obtenir un solide.
//
// Repère : la bulle est tracée dans le plan XY, centrée horizontalement sur 0.
// Origine telle que le corps occupe x ∈ [left, right], y ∈ [bottom, top].
//
// La hauteur est passée en paramètre (calculée selon la longueur du message)
// afin que la bulle s'adapte au contenu, comme une vraie bulle WhatsApp.
//
// Retourne { geometry, bounds } où bounds décrit les limites utiles pour le
// placement du texte.
export function buildBubble(height) {
  const {
    bubbleWidth: W,
    cornerRadius: r,
    baseThickness,
    tailTopBase,
    tailSideBase,
    tailOut,
    tailUp,
    holeRadius,
    holeMarginRight,
    holeMarginTop,
  } = DIMS;

  const H = height || DIMS.minBubbleHeight;
  const left = -W / 2;
  const right = W / 2;
  const bottom = -H / 2;
  const top = H / 2;

  const shape = new THREE.Shape();

  // Tracé du contour dans le sens trigonométrique (anti-horaire).
  // Départ juste après le coin bas-gauche, sur le bord inférieur.
  shape.moveTo(left + r, bottom);
  shape.lineTo(right - r, bottom); // bord inférieur

  // Coin bas-droit
  shape.absarc(right - r, bottom + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(right, top - r); // bord droit

  // Coin haut-droit
  shape.absarc(right - r, top - r, r, 0, Math.PI / 2, false);
  shape.lineTo(left + tailTopBase, top); // bord supérieur jusqu'à la base de la queue

  // Queue WhatsApp : pointe vers le haut-gauche puis retour courbé sur le bord gauche.
  shape.lineTo(left - tailOut, top + tailUp); // diagonale vers la pointe
  shape.quadraticCurveTo(left, top, left, top - tailSideBase); // retour courbé vers le bord gauche

  shape.lineTo(left, bottom + r); // bord gauche

  // Coin bas-gauche
  shape.absarc(left + r, bottom + r, r, Math.PI, 1.5 * Math.PI, false);

  // Trou traversant pour l'anneau (sens horaire = opposé au contour).
  const holeCx = right - holeMarginRight;
  const holeCy = top - holeMarginTop;
  const hole = new THREE.Path();
  hole.absarc(holeCx, holeCy, holeRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: baseThickness,
    bevelEnabled: false,
    curveSegments: 24,
  });
  // ExtrudeGeometry extrude vers +Z à partir de z=0 ; on conserve cette
  // orientation (face inférieure sur le plateau, z=0 → baseThickness).

  return {
    geometry,
    shape,
    bounds: { left, right, bottom, top, W, H },
  };
}
