import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { DIMS } from './constants.js';

// Mesure la largeur d'une chaîne pour une police/taille données, sans extrusion
// (via les shapes 2D), ce qui est suffisant et léger pour le word-wrap.
function measureWidth(font, text, size) {
  if (!text) return 0;
  const shapes = font.generateShapes(text, size);
  const geo = new THREE.ShapeGeometry(shapes);
  geo.computeBoundingBox();
  const w = geo.boundingBox.max.x - geo.boundingBox.min.x;
  geo.dispose();
  return w;
}

// Crée la géométrie 3D extrudée d'une chaîne. La base du texte est légèrement
// enfoncée dans la plaque (embossSink) pour garantir la fusion, et culmine à
// baseThickness + embossHeight.
function createTextGeometry(font, text, size) {
  const geo = new TextGeometry(text, {
    font,
    size,
    height: DIMS.embossHeight + DIMS.embossSink,
    curveSegments: 6,
    bevelEnabled: false,
  });
  geo.computeBoundingBox();
  return geo;
}

// Découpe un texte en lignes qui tiennent dans maxWidth pour une taille donnée.
function wrapText(font, text, size, maxWidth, maxLines) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? current + ' ' + word : word;
    if (measureWidth(font, candidate, size) <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

// Construit l'ensemble des géométries de texte (nom, message, heure) positionnées
// dans le repère de la bulle. Retourne un tableau de BufferGeometry prêtes à être
// fusionnées/affichées (toutes à la même hauteur Z).
export function buildTexts(fontRegular, fontBold, bounds, params) {
  const { left, right, top, bottom } = bounds;
  const { padTop, padRight, padBottom, padLeftFromProfile } = DIMS;

  const interiorLeft = left + padLeftFromProfile + 2;
  const interiorRight = right - padRight;
  const interiorTop = top - padTop;
  const interiorBottom = bottom + padBottom;
  const interiorWidth = interiorRight - interiorLeft;

  const zOffset = DIMS.baseThickness - DIMS.embossSink;
  const geometries = [];

  // Place une géométrie via sa bounding box, en alignant un coin de référence.
  const place = (geo, { x, y, align = 'tl' }) => {
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    let tx = x - bb.min.x;
    let ty = y - bb.max.y; // par défaut on aligne le haut
    if (align === 'tr') tx = x - bb.max.x;
    if (align === 'bl') ty = y - bb.min.y;
    if (align === 'br') {
      tx = x - bb.max.x;
      ty = y - bb.min.y;
    }
    geo.translate(tx, ty, zOffset);
    geometries.push(geo);
  };

  // --- Nom (gras) ---
  if (params.name) {
    let nameSize = 5;
    let nameGeo = createTextGeometry(fontBold, params.name, nameSize);
    let w = nameGeo.boundingBox.max.x - nameGeo.boundingBox.min.x;
    if (w > interiorWidth) {
      const s = interiorWidth / w;
      nameGeo.scale(s, s, 1);
      nameSize *= s;
    }
    place(nameGeo, { x: interiorLeft, y: interiorTop, align: 'tl' });
  }

  // --- Heure (bas-droite) ---
  let timeBottomGap = 0;
  if (params.time) {
    const timeSize = 3;
    const timeGeo = createTextGeometry(fontRegular, params.time, timeSize);
    place(timeGeo, { x: interiorRight, y: interiorBottom, align: 'br' });
    timeBottomGap = timeSize + 1.5;
  }

  // --- Message (multi-lignes, word-wrap) ---
  if (params.message) {
    const nameBlock = params.name ? 5 + 2.5 : 0; // hauteur nom + marge
    const msgTop = interiorTop - nameBlock;
    const msgBottom = interiorBottom + timeBottomGap;
    const available = msgTop - msgBottom;

    // On réduit la taille jusqu'à ce que les lignes tiennent verticalement.
    let size = 3.6;
    const minSize = 2.2;
    let lines = [];
    let lineHeight = 0;
    while (size >= minSize) {
      lineHeight = size * 1.35;
      const maxLines = Math.max(1, Math.floor(available / lineHeight));
      lines = wrapText(fontRegular, params.message, size, interiorWidth, maxLines);
      if (lines.length * lineHeight <= available) break;
      size -= 0.2;
    }

    let y = msgTop;
    for (const line of lines) {
      const geo = createTextGeometry(fontRegular, line, size);
      place(geo, { x: interiorLeft, y, align: 'tl' });
      y -= lineHeight;
    }
  }

  return geometries;
}

// Crée les initiales centrées dans la pastille photo.
export function buildInitials(fontBold, cx, cy, radius, initials) {
  if (!initials) return null;
  const text = initials.slice(0, 2).toUpperCase();
  let size = radius * 0.9;
  let geo = createTextGeometry(fontBold, text, size);
  geo.computeBoundingBox();
  const w = geo.boundingBox.max.x - geo.boundingBox.min.x;
  const maxW = radius * 1.3;
  if (w > maxW) {
    const s = maxW / w;
    geo.scale(s, s, 1);
    geo.computeBoundingBox();
  }
  const bb = geo.boundingBox;
  const tx = cx - (bb.min.x + bb.max.x) / 2;
  const ty = cy - (bb.min.y + bb.max.y) / 2;
  geo.translate(tx, ty, DIMS.baseThickness - DIMS.embossSink);
  return geo;
}
