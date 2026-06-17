# Porte-clé WhatsApp 3D

Générateur web qui transforme un message WhatsApp en porte-clé imprimable en 3D.
On personnalise le **nom**, le **message**, l'**heure** et la **photo de profil**
(initiales ou image), on prévisualise le modèle en direct (thème **clair** ou
**sombre** aux couleurs de WhatsApp), puis on télécharge le fichier **STL**.

Le modèle reprend la forme d'une bulle de message : coins arrondis, petite
**queue** WhatsApp, **pastille photo** à gauche et **trou** en haut à droite pour
y accrocher un anneau.

## Lancer en local

```bash
npm install
npm run dev      # serveur de développement (http://localhost:5173)
npm run build    # build statique dans dist/
npm run preview  # prévisualise le build
```

Le site est 100 % statique (aucun backend) : le dossier `dist/` peut être
hébergé tel quel sur GitHub Pages, Netlify, Vercel, etc.

## Export pour l'impression 3D

- **Télécharger STL** : un seul fichier, toutes les pièces fusionnées. Idéal pour
  une impression monochrome, ou pour des couleurs via un changement de filament
  par hauteur (le texte et la photo sont en saillie au-dessus de la plaque).
- **Télécharger STL par couleur** : trois fichiers (`base`, `photo`, `texte`)
  pour les imprimantes multi-matériaux (AMS/MMU), à assigner chacun à une couleur.

Le modèle est conçu pour l'impression FDM (1 unité = 1 mm) : trou réellement
traversant, texte et photo soudés à la plaque, parois ≥ 2 mm.

## Architecture

```
index.html              Page unique (aperçu + panneau de personnalisation)
src/
  main.js               Scène Three.js, chargement des polices, boucle de rendu, câblage UI
  ui.js                 Formulaire, régénération debouncée, gestion image/thème
  theme.js              Palettes de couleurs WhatsApp (clair/sombre)
  style.css             Styles de l'interface
  geometry/
    constants.js        Dimensions (mm)
    bubble.js           Bulle : coins arrondis + queue + trou (ExtrudeGeometry)
    profile.js          Pastille photo (disque débordant)
    text.js             Nom / message (word-wrap) / heure / initiales (TextGeometry)
    assemble.js         Assemblage en groupes de couleur + matériaux
  export/
    stl.js              Export STL binaire (unique + par couleur)
    image-relief.js     Image téléversée -> relief (heightmap) dans la pastille
public/fonts/           Polices Droid Sans (couverture des accents français)
```

Construit avec [Three.js](https://threejs.org/) et [Vite](https://vitejs.dev/).
