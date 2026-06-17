import * as THREE from 'three';
import { DIMS } from '../geometry/constants.js';

const RINGS = 56; // résolution radiale
const SEGMENTS = 72; // résolution angulaire
const RELIEF_MAX = 1.2; // hauteur maxi du relief (mm)

// Transforme une image en relief circulaire (heightmap) posé sur la pastille
// photo. L'image est recadrée en carré (cover), échantillonnée en niveaux de
// gris, et la hauteur de chaque point est proportionnelle à la luminance.
//
// Le maillage est un solide fermé (surface supérieure bombée + paroi + fond plat
// au niveau du dessus de la pastille), ce qui le fait fusionner avec le disque.
export function buildImageRelief(image, cx, cy, radius) {
  // Échantillonnage de l'image dans un canvas carré.
  const S = 256;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  // Recadrage "cover" pour conserver les proportions.
  const ar = image.width / image.height;
  let sx = 0, sy = 0, sw = image.width, sh = image.height;
  if (ar > 1) {
    sw = image.height;
    sx = (image.width - sw) / 2;
  } else if (ar < 1) {
    sh = image.width;
    sy = (image.height - sh) / 2;
  }
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, S, S);
  const data = ctx.getImageData(0, 0, S, S).data;

  const luminanceAt = (u, v) => {
    // u,v dans [0,1] ; v=0 en haut.
    const px = Math.min(S - 1, Math.max(0, Math.round(u * (S - 1))));
    const py = Math.min(S - 1, Math.max(0, Math.round(v * (S - 1))));
    const i = (py * S + px) * 4;
    return (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
  };

  const baseZ = DIMS.baseThickness;
  const positions = [];
  const indices = [];

  // --- Sommets de la surface supérieure ---
  // 0 = centre
  const cl = luminanceAt(0.5, 0.5);
  positions.push(cx, cy, baseZ + cl * RELIEF_MAX);

  const topIdx = (i, j) => 1 + (i - 1) * SEGMENTS + (j % SEGMENTS);
  for (let i = 1; i <= RINGS; i++) {
    const rr = (radius * i) / RINGS;
    for (let j = 0; j < SEGMENTS; j++) {
      const a = (j / SEGMENTS) * Math.PI * 2;
      const x = cx + rr * Math.cos(a);
      const y = cy + rr * Math.sin(a);
      const u = (x - (cx - radius)) / (2 * radius);
      const v = 1 - (y - (cy - radius)) / (2 * radius);
      const h = i === RINGS ? 0 : luminanceAt(u, v) * RELIEF_MAX; // bord plat
      positions.push(x, y, baseZ + h);
    }
  }

  // --- Sommets du fond et de la paroi ---
  const bottomCenter = 1 + RINGS * SEGMENTS;
  positions.push(cx, cy, baseZ);
  const bottomRing = bottomCenter + 1; // S sommets, ring extérieur au niveau baseZ
  for (let j = 0; j < SEGMENTS; j++) {
    const a = (j / SEGMENTS) * Math.PI * 2;
    positions.push(cx + radius * Math.cos(a), cy + radius * Math.sin(a), baseZ);
  }

  // --- Faces de la surface supérieure ---
  for (let j = 0; j < SEGMENTS; j++) {
    indices.push(0, topIdx(1, j), topIdx(1, j + 1));
  }
  for (let i = 1; i < RINGS; i++) {
    for (let j = 0; j < SEGMENTS; j++) {
      const a = topIdx(i, j);
      const b = topIdx(i + 1, j);
      const c = topIdx(i + 1, j + 1);
      const d = topIdx(i, j + 1);
      indices.push(a, b, c);
      indices.push(a, c, d);
    }
  }

  // --- Paroi extérieure (du bord supérieur vers le fond) ---
  for (let j = 0; j < SEGMENTS; j++) {
    const tA = topIdx(RINGS, j);
    const tB = topIdx(RINGS, j + 1);
    const bA = bottomRing + (j % SEGMENTS);
    const bB = bottomRing + ((j + 1) % SEGMENTS);
    indices.push(tA, bB, bA);
    indices.push(tA, tB, bB);
  }

  // --- Fond plat ---
  for (let j = 0; j < SEGMENTS; j++) {
    const bA = bottomRing + (j % SEGMENTS);
    const bB = bottomRing + ((j + 1) % SEGMENTS);
    indices.push(bottomCenter, bA, bB);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// Charge un fichier image et renvoie une Promise<HTMLImageElement>.
export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
