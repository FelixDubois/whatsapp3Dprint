import * as THREE from 'three';
import { DIMS } from './constants.js';

const CURVE_DIVISIONS = 10; // finesse de tessellation des courbes des glyphes

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

// Test d'appartenance d'un point à un contour (règle pair/impair).
function contains(poly, pt) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > pt.y !== b.y > pt.y && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

// Reconstruit les Shapes d'un texte en regroupant CORRECTEMENT les contours en
// pleins / trous par imbrication (règle pair/impair). Indispensable car la
// police (issue d'un OTF/CFF) a une orientation de contours qui trompe le
// regroupement automatique de FontLoader (les intérieurs de o, e, p, 0, 8…
// n'étaient pas évidés). On force aussi le sens : pleins en CCW, trous en CW.
function glyphShapes(font, text, size) {
  const raw = font.generateShapes(text, size);
  const contours = [];
  for (const s of raw) {
    const ep = s.extractPoints(CURVE_DIVISIONS);
    contours.push(ep.shape);
    for (const h of ep.holes) contours.push(h);
  }

  const { isClockWise, area } = THREE.ShapeUtils;
  const reverse = (p) => p.slice().reverse();

  const items = contours
    .filter((c) => c.length >= 3)
    .map((pts) => ({ pts, depth: 0, a: Math.abs(area(pts)) }));
  // profondeur d'imbrication de chaque contour
  for (const it of items) {
    for (const other of items) {
      if (other !== it && contains(other.pts, it.pts[0])) it.depth++;
    }
  }
  const solids = items.filter((it) => it.depth % 2 === 0);
  const holes = items.filter((it) => it.depth % 2 === 1);

  return solids.map((sol) => {
    const outer = isClockWise(sol.pts) ? reverse(sol.pts) : sol.pts; // CCW
    const shape = new THREE.Shape();
    shape.setFromPoints(outer);
    for (const hole of holes) {
      // rattache le trou au plus petit plein qui le contient (parent direct)
      const parents = solids.filter((s2) => contains(s2.pts, hole.pts[0]));
      parents.sort((x, y) => x.a - y.a);
      if (parents[0] === sol) {
        const hp = isClockWise(hole.pts) ? hole.pts : reverse(hole.pts); // CW
        const path = new THREE.Path();
        path.setFromPoints(hp);
        shape.holes.push(path);
      }
    }
    return shape;
  });
}

// Crée la géométrie 3D extrudée d'une chaîne. La base du texte est légèrement
// enfoncée dans la plaque (embossSink) pour garantir la fusion, et culmine à
// baseThickness + embossHeight.
function createTextGeometry(font, text, size) {
  const shapes = glyphShapes(font, text, size);
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: DIMS.embossHeight + DIMS.embossSink,
    curveSegments: 1, // les shapes sont déjà tessellées en segments
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
