import * as THREE from 'three';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const exporter = new STLExporter();

function geometryToStl(geometry) {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  return exporter.parse(mesh, { binary: true });
}

function download(data, filename) {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Exporte le modèle complet en un seul fichier STL binaire (toutes les couleurs
// fusionnées). Idéal pour une impression monochrome ou un changement de
// filament par hauteur.
export function exportSingleStl(exportParts, filename = 'porte-cle-whatsapp.stl') {
  const parts = [exportParts.base, exportParts.photo, exportParts.texte].filter(Boolean);
  if (parts.length === 0) return;
  const merged = mergeGeometries(parts, false);
  download(geometryToStl(merged), filename);
  merged.dispose();
}

// Exporte un fichier STL par couleur (base / photo / texte) pour les imprimantes
// multi-matériaux (AMS/MMU).
export function exportPerColorStl(exportParts) {
  const map = {
    base: 'porte-cle-base.stl',
    photo: 'porte-cle-photo.stl',
    texte: 'porte-cle-texte.stl',
  };
  for (const [key, name] of Object.entries(map)) {
    const geo = exportParts[key];
    if (geo) download(geometryToStl(geo), name);
  }
}
