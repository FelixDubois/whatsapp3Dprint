import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildBubble } from './bubble.js';
import { measureContent, placeTexts } from './text.js';
import { DIMS } from './constants.js';
import { THEMES, NAME_COLORS } from '../theme.js';

// Normalise une géométrie à position + normal uniquement, afin que toutes les
// géométries d'un même groupe couleur puissent être fusionnées sans conflit
// d'attributs.
function normalize(geo) {
  if (!geo.getAttribute('normal')) geo.computeVertexNormals();
  for (const name of Object.keys(geo.attributes)) {
    if (name !== 'position' && name !== 'normal') geo.deleteAttribute(name);
  }
  geo.clearGroups();
  return geo;
}

function mergeOrNull(geoms) {
  const list = geoms.filter(Boolean).map(normalize);
  if (list.length === 0) return null;
  return mergeGeometries(list, false);
}

// Construit le modèle complet à partir des paramètres et des polices chargées.
// Retourne :
//   group       : THREE.Group à afficher
//   materials   : { base, text, name } pour la mise à jour du thème
//   exportParts : { base, nom, texte } géométries fusionnées par couleur
export function buildModel(params, fonts) {
  const theme = THEMES[params.theme] || THEMES.light;
  const nameColor = params.nameColor || NAME_COLORS[0];

  // --- Géométries ---
  // 1) Mesurer le texte (largeur fixe) pour déduire la hauteur de la bulle.
  const interiorWidth = DIMS.bubbleWidth - DIMS.padLeft - DIMS.padRight;
  const content = measureContent(fonts.regular, fonts.bold, interiorWidth, params);
  const height = Math.min(
    DIMS.maxBubbleHeight,
    Math.max(DIMS.minBubbleHeight, content.totalHeight + DIMS.padTop + DIMS.padBottom)
  );
  // 2) Construire la bulle à cette hauteur, puis placer le texte.
  const { geometry: bubbleGeo, bounds } = buildBubble(height);
  const { name: nameGeo, body: bodyGeoms } = placeTexts(content, bounds);

  // --- Regroupement par couleur d'impression ---
  const baseGeo = mergeOrNull([bubbleGeo]);
  const nomGeo = mergeOrNull([nameGeo]);
  const texteGeo = mergeOrNull(bodyGeoms);

  // --- Matériaux ---
  const mat = (hex) =>
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(hex),
      roughness: 0.75,
      metalness: 0.0,
    });
  const materials = {
    base: mat(theme.bubble),
    text: mat(theme.text),
    name: mat(nameColor), // couleur choisie par l'utilisateur (indépendante du thème)
  };

  // --- Assemblage ---
  const group = new THREE.Group();
  if (baseGeo) group.add(new THREE.Mesh(baseGeo, materials.base));
  if (nomGeo) group.add(new THREE.Mesh(nomGeo, materials.name));
  if (texteGeo) group.add(new THREE.Mesh(texteGeo, materials.text));

  group.userData.bounds = bounds;

  return {
    group,
    materials,
    exportParts: { base: baseGeo, nom: nomGeo, texte: texteGeo },
  };
}

// Applique un thème aux matériaux existants sans reconstruire la géométrie.
// La couleur du nom n'est PAS touchée (elle est choisie par l'utilisateur).
export function applyModelTheme(materials, themeName) {
  const theme = THEMES[themeName] || THEMES.light;
  materials.base.color.set(theme.bubble);
  materials.text.color.set(theme.text);
}
