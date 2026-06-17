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

// Tailles et espacements (mm) du contenu textuel — fixes : c'est la HAUTEUR de
// la bulle qui s'adapte au nombre de lignes, pas la taille du texte.
const NAME_SIZE = 5;
const MSG_SIZE = 3.4;
const MSG_LINE_HEIGHT = MSG_SIZE * 1.4;
const STAMP_SIZE = 3;
const GAP_AFTER_NAME = 2.5;
const GAP_BEFORE_STAMP = 2.5;

// PHASE 1 — Mesure du contenu : crée les géométries de texte (nom, lignes de
// message, date+heure) à taille fixe et calcule la hauteur totale nécessaire.
// La largeur étant fixe, le nom et l'horodatage sont mis à l'échelle s'ils
// débordent ; le message est découpé en autant de lignes que nécessaire.
// Retourne un objet `content` consommé par placeTexts(), plus `totalHeight`.
export function measureContent(fontRegular, fontBold, interiorWidth, params) {
  // Nom (gras)
  let nameGeo = null;
  if (params.name) {
    nameGeo = createTextGeometry(fontBold, params.name, NAME_SIZE);
    const w = nameGeo.boundingBox.max.x - nameGeo.boundingBox.min.x;
    if (w > interiorWidth) nameGeo.scale(interiorWidth / w, interiorWidth / w, 1);
  }

  // Message : on respecte d'abord les retours à la ligne manuels (\n), puis on
  // découpe chaque paragraphe en autant de lignes que nécessaire. Une ligne
  // vide (null) est conservée pour reproduire les sauts de ligne.
  let lineGeos = [];
  if (params.message) {
    const out = [];
    for (const para of params.message.split('\n')) {
      if (para.trim() === '') {
        out.push(null); // ligne vide
        continue;
      }
      for (const line of wrapText(fontRegular, para, MSG_SIZE, interiorWidth, 999)) {
        out.push(createTextGeometry(fontRegular, line, MSG_SIZE));
      }
    }
    lineGeos = out;
  }

  // Date + heure (une seule ligne)
  let stampGeo = null;
  const stampParts = [params.date, params.time].filter(Boolean);
  if (stampParts.length > 0) {
    stampGeo = createTextGeometry(fontRegular, stampParts.join('   '), STAMP_SIZE);
    const w = stampGeo.boundingBox.max.x - stampGeo.boundingBox.min.x;
    if (w > interiorWidth) stampGeo.scale(interiorWidth / w, interiorWidth / w, 1);
  }

  // Hauteur de contenu = somme des blocs présents + espacements
  let totalHeight = 0;
  if (nameGeo) totalHeight += NAME_SIZE;
  if (lineGeos.length) {
    totalHeight += (nameGeo ? GAP_AFTER_NAME : 0) + lineGeos.length * MSG_LINE_HEIGHT;
  }
  if (stampGeo) {
    totalHeight += (nameGeo || lineGeos.length ? GAP_BEFORE_STAMP : 0) + STAMP_SIZE;
  }

  return { nameGeo, lineGeos, stampGeo, totalHeight };
}

// PHASE 2 — Placement : positionne les géométries mesurées dans le repère de la
// bulle (dont la hauteur a été calculée à partir de content.totalHeight).
// Retourne { name, body } : le nom est séparé pour pouvoir recevoir sa propre
// couleur ; body regroupe le message et l'horodatage.
export function placeTexts(content, bounds) {
  const { left, right, top, bottom } = bounds;
  const { padTop, padRight, padBottom, padLeft } = DIMS;

  const interiorLeft = left + padLeft;
  const interiorRight = right - padRight;
  const interiorTop = top - padTop;
  const interiorBottom = bottom + padBottom;

  const zOffset = DIMS.baseThickness - DIMS.embossSink;

  // Translate une géométrie via sa bounding box, en alignant un coin de référence.
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
    return geo;
  };

  let name = null;
  const body = [];

  let y = interiorTop;
  if (content.nameGeo) {
    name = place(content.nameGeo, { x: interiorLeft, y, align: 'tl' });
    y -= NAME_SIZE + (content.lineGeos.length ? GAP_AFTER_NAME : 0);
  }
  for (const geo of content.lineGeos) {
    if (geo) body.push(place(geo, { x: interiorLeft, y, align: 'tl' }));
    y -= MSG_LINE_HEIGHT; // on avance même pour une ligne vide
  }
  if (content.stampGeo) {
    body.push(place(content.stampGeo, { x: interiorRight, y: interiorBottom, align: 'br' }));
  }

  return { name, body };
}
