# Porte-clé WhatsApp 3D

Générateur web qui transforme un message WhatsApp en porte-clé imprimable en 3D.
On personnalise le **nom**, le **message**, l'**heure** et la **date**, on
prévisualise le modèle en direct, puis on télécharge le fichier **STL**.

Le modèle reprend la forme d'une bulle de message : coins arrondis, petite
**queue** WhatsApp et **trou** en haut à droite pour y accrocher un anneau. La
**hauteur de la bulle s'adapte automatiquement à la longueur du message**.

Le texte utilise **TeX Gyre Heros**, un clone libre de Helvetica (la police de
WhatsApp). Le bouton **Clair / Sombre** change uniquement les **couleurs du
modèle 3D** (bulle + texte + fond de l'aperçu), pas le style du site.

## Lancer en local

```bash
npm install
npm run dev      # serveur de développement (http://localhost:5173)
npm run build    # build statique dans dist/
npm run preview  # prévisualise le build
```

Le site est 100 % statique (aucun backend) : le dossier `dist/` peut être
hébergé tel quel sur GitHub Pages, Netlify, Vercel, etc.

## Déploiement avec Docker / Coolify

Le dépôt contient un `Dockerfile` multi-étapes (build Vite avec Node, puis service
des fichiers statiques via nginx) qui écoute sur le port **80**.

```bash
docker build -t porte-cle-whatsapp .
docker run -p 8080:80 porte-cle-whatsapp   # http://localhost:8080
```

### Sur Coolify

1. **New Resource → Application**, source : ce dépôt Git.
2. Build Pack : **Dockerfile** (Coolify détecte automatiquement le `Dockerfile`).
3. Port exposé : **80**.
4. Déployez : Coolify build l'image et publie le site derrière son reverse proxy
   (HTTPS/domaine gérés par Coolify).

## Export pour l'impression 3D

- **Télécharger STL** : un seul fichier, toutes les pièces fusionnées. Idéal pour
  une impression monochrome, ou pour des couleurs via un changement de filament
  par hauteur (le texte et la photo sont en saillie au-dessus de la plaque).
- **Télécharger STL par couleur** : trois fichiers (`base`, `photo`, `texte`)
  pour les imprimantes multi-matériaux (AMS/MMU), à assigner chacun à une couleur.

Le modèle est conçu pour l'impression FDM (1 unité = 1 mm) : trou réellement
traversant, texte soudé à la plaque, parois ≥ 2 mm.

## Architecture

```
index.html              Page unique (aperçu + panneau de personnalisation)
src/
  main.js               Scène Three.js, chargement des polices, boucle de rendu, câblage UI
  ui.js                 Formulaire, régénération debouncée, thème du modèle
  theme.js              Couleurs du modèle 3D (clair/sombre)
  style.css             Styles (fixes) de l'interface
  geometry/
    constants.js        Dimensions (mm) ; hauteur min/max de la bulle
    bubble.js           Bulle : coins arrondis + queue + trou, hauteur paramétrable
    text.js             Mesure du contenu (-> hauteur) + placement (nom / message / date+heure)
    assemble.js         Calcul de la hauteur, assemblage en groupes de couleur + matériaux
  export/
    stl.js              Export STL binaire (unique + par couleur)
public/fonts/           TeX Gyre Heros (clone Helvetica) en typeface.json
```

Construit avec [Three.js](https://threejs.org/) et [Vite](https://vitejs.dev/).
