# Brasserie Puzzle

Site vitrine statique (Astro). L’agenda est géré par le brasseur depuis `/admin.html`, sans toucher au code.

## Développement

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # résultat dans dist/
```

## Ajouter / changer une bière

Tout est dans `src/data/beers.js` (nom, style, degré, couleur de la pièce).

Images d’une bière `<slug>` :
- `public/images/etiquettes/<slug>.jpg` : l’étiquette complète (page de la bière) ;
- `public/images/bieres/<slug>.jpg` : le personnage recadré en carré (pièce du puzzle sur l’accueil).

Tant que l’étiquette n’existe pas, laisser `portrait: false` : la pièce s’affiche « bientôt ». C’est le cas de Valentin.

Les fichiers d’origine (captures des étiquettes, logo) sont rangés dans `sources/`, hors du site publié.

## Agenda (Firebase)

Mise en place, une seule fois :

1. Créer un projet sur https://console.firebase.google.com (offre gratuite suffisante).
2. Activer **Authentication → E-mail / mot de passe**, puis créer le compte du brasseur.
3. Créer une base **Firestore** et y coller les règles du fichier `firestore.rules`.
4. Ajouter une application Web, copier sa configuration dans `.env` (voir `.env.example`), relancer le build.

Ensuite, le brasseur va sur `/admin.html`, se connecte et ajoute / modifie / supprime ses dates (photo facultative).

Règles de l’agenda :
- un événement a une date de début et, s’il dure plusieurs jours, une date de fin (champ `fin`, enregistré automatiquement égal au début pour un événement d’un jour) ;
- il reste affiché sur le site jusqu’au soir de son dernier jour, avec un badge « Aujourd’hui » / « En ce moment » ;
- ensuite il n’est plus affiché sur le site, mais reste enregistré et visible (grisé) dans l’espace admin ;
- l’accueil montre les 3 prochains, la page Agenda jusqu’à 50, pour ne pas tout charger.

Sans Firebase configuré, le site lit `public/evenements.json` (exemples à supprimer).

## Domaine

Une fois le nom de domaine choisi, définir `PUBLIC_SITE_URL=https://votre-domaine.fr` dans `.env` (ou chez l’hébergeur) puis relancer le build : les URL canoniques et le sitemap sont alors générés.
