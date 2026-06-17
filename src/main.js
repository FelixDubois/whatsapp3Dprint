import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { buildModel, applyModelTheme } from './geometry/assemble.js';
import { exportSingleStl, exportPerColorStl } from './export/stl.js';
import { THEMES } from './theme.js';
import { setupControls } from './ui.js';

const wrap = document.getElementById('canvas-wrap');

// --- Scène / rendu ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
wrap.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

// Éclairage : ambiance douce + deux directionnelles pour révéler le relief.
scene.add(new THREE.AmbientLight(0xffffff, 0.65));
const key = new THREE.DirectionalLight(0xffffff, 0.9);
key.position.set(0.4, 0.6, 1);
scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 0.35);
fill.position.set(-0.6, -0.3, 0.6);
scene.add(fill);

// --- État ---
let fonts = null;
let current = null; // { group, materials, exportParts }

function disposeCurrent() {
  if (!current) return;
  scene.remove(current.group);
  current.group.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
  current = null;
}

function frameModel(group) {
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y);
  const dist = (maxDim / 2 / Math.tan((camera.fov * Math.PI) / 360)) * 1.5;

  controls.target.copy(center);
  camera.position.set(center.x, center.y - size.y * 0.15, center.z + dist);
  // Plan rapproché volontairement petit + distance mini sur les contrôles : on
  // évite que le zoom ne « coupe » l'avant des lettres (faces qui disparaissent).
  camera.near = 0.5;
  camera.far = dist * 20;
  camera.updateProjectionMatrix();
  controls.minDistance = Math.max(size.x, size.y) * 0.35;
  controls.maxDistance = dist * 5;
  controls.update();
}

function regenerate(params, { reframe = false } = {}) {
  if (!fonts) return;
  disposeCurrent();
  current = buildModel(params, fonts);
  scene.add(current.group);
  if (reframe) frameModel(current.group);
}

// Le thème ne concerne QUE le modèle 3D : couleurs des matériaux + fond de la
// scène. Le style du site reste fixe.
function setSceneTheme(themeName) {
  scene.background = new THREE.Color(THEMES[themeName].sceneBackground);
  if (current) applyModelTheme(current.materials, themeName);
}

// --- Redimensionnement ---
function resize() {
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

// --- Boucle de rendu ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// --- Branchement de l'interface ---
const { readParams } = setupControls({
  onChange: (params) => regenerate(params),
  onThemeChange: (t) => setSceneTheme(t),
  onExport: () => current && exportSingleStl(current.exportParts),
  onExportColor: () => current && exportPerColorStl(current.exportParts),
});

// --- Chargement des polices puis premier rendu ---
const loader = new FontLoader();
function loadFont(url) {
  return new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
}

Promise.all([
  loadFont('./fonts/heros_regular.typeface.json'),
  loadFont('./fonts/heros_bold.typeface.json'),
])
  .then(([regular, bold]) => {
    fonts = { regular, bold };
    setSceneTheme('light');
    resize();
    regenerate(readParams(), { reframe: true });
    animate();
  })
  .catch((err) => {
    console.error('Échec du chargement des polices', err);
  });
