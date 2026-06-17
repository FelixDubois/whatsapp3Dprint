import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildBubble } from './bubble.js';
import { buildProfile } from './profile.js';
import { buildTexts, buildInitials } from './text.js';
import { buildImageRelief } from '../export/image-relief.js';
import { THEMES } from '../theme.js';

// Normalise une géométrie à position + normal uniquement, afin que toutes les
// géométries d'un même groupe couleur puissent être fusionnées sans conflit
// d'attributs (TextGeometry/ExtrudeGeometry ont des uv, le relief non).
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
//   materials   : { base, profile, text } pour la mise à jour du thème
//   exportParts : { base, photo, texte } géométries fusionnées par couleur
export function buildModel(params, fonts) {
  const theme = THEMES[params.theme] || THEMES.light;

  // --- Géométries ---
  const { geometry: bubbleGeo, bounds } = buildBubble();
  const { geometry: discGeo, cx, cy, radius } = buildProfile(bounds);
  const textGeoms = buildTexts(fonts.regular, fonts.bold, bounds, params);

  let reliefGeo = null;
  let initialsGeo = null;
  if (params.image) {
    reliefGeo = buildImageRelief(params.image, cx, cy, radius);
  } else {
    initialsGeo = buildInitials(fonts.bold, cx, cy, radius, params.initials);
  }

  // --- Regroupement par couleur d'impression ---
  const baseGeo = mergeOrNull([bubbleGeo]);
  const photoGeo = mergeOrNull([discGeo, reliefGeo]);
  const texteGeo = mergeOrNull([...textGeoms, initialsGeo]);

  // --- Matériaux ---
  const mat = (hex) =>
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(hex),
      roughness: 0.75,
      metalness: 0.0,
    });
  const materials = {
    base: mat(theme.bubble),
    profile: mat(theme.profile),
    text: mat(theme.text),
  };

  // --- Assemblage ---
  const group = new THREE.Group();
  if (baseGeo) group.add(new THREE.Mesh(baseGeo, materials.base));
  if (photoGeo) group.add(new THREE.Mesh(photoGeo, materials.profile));
  if (texteGeo) group.add(new THREE.Mesh(texteGeo, materials.text));

  // Centre le modèle sur l'origine (axe X) pour un cadrage agréable, et le pose
  // à plat : on translate pour que le centre géométrique soit en (0,0).
  group.userData.bounds = bounds;

  return {
    group,
    materials,
    exportParts: { base: baseGeo, photo: photoGeo, texte: texteGeo },
  };
}

// Applique un thème aux matériaux existants sans reconstruire la géométrie.
export function applyModelTheme(materials, themeName) {
  const theme = THEMES[themeName] || THEMES.light;
  materials.base.color.set(theme.bubble);
  materials.profile.color.set(theme.profile);
  materials.text.color.set(theme.text);
}
