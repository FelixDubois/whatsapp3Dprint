import * as THREE from 'three';
import { DIMS } from './constants.js';

// Construit la pastille ronde de la photo de profil. Elle est placée à gauche de
// la bulle, débordant vers l'extérieur, et chevauche le bord gauche de la bulle
// (profileOverlap) afin d'être soudée au reste du modèle après fusion.
//
// Retourne { geometry, cx, cy, radius } pour permettre le placement des
// initiales ou du relief photo par-dessus.
export function buildProfile(bounds) {
  const { left, top } = bounds;
  const { profileRadius: radius, profileOverlap, baseThickness } = DIMS;

  // Centre : le bord droit du disque rentre de `profileOverlap` dans la bulle.
  const cx = left + profileOverlap - radius;
  const cy = top - radius;

  const shape = new THREE.Shape();
  shape.absarc(cx, cy, radius, 0, Math.PI * 2, false);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: baseThickness,
    bevelEnabled: false,
    curveSegments: 48,
  });

  return { geometry, cx, cy, radius };
}
