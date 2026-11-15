# Brasserie Puzzle

Site vitrine pré-rendu avec Astro. Les pages et leurs métadonnées sont présentes dans le HTML livré, sans dépendre de JavaScript pour le contenu principal.

## Développement

```sh
npm install
npm run dev
npm run build
npm run preview
```

Le résultat de production est généré dans `dist/`.

## Référencement et domaine

Tant que le nom de domaine n’est pas choisi, le site n’invente pas d’URL canonique et ne publie pas de sitemap avec un faux domaine. Les métadonnées descriptives, Open Graph, les données structurées et les URL propres des pages sont déjà préparées.

Une fois le domaine définitif choisi :

1. Copier `.env.example` vers `.env`.
2. Définir `PUBLIC_SITE_URL=https://votre-domaine.fr` dans `.env` ou dans l’environnement de build de l’hébergeur.
3. Relancer `npm run build`.

Astro ajoutera alors les URL canoniques absolues et produira automatiquement le sitemap. `robots.txt` indiquera son emplacement. Ne renseigner que le domaine canonique final (HTTPS, sans chemin ni barre oblique finale).

## Pages

Les anciennes URL sont conservées : `/`, `/biere-valentin.html`, `/biere-jeannine.html`, `/biere-antoinette.html`, `/biere-cornelius.html`, `/brasserie.html`, `/contact.html`, `/evenements.html` et `/mentions.html`. Les anciennes adresses d’administration redirigent vers `/admin.html`.

L’espace brasseur reste exclu des moteurs de recherche et n’est pas ajouté au sitemap. Les listes et le diaporama chargent uniquement les événements strictement à venir et en affichent au maximum 50.

## Images

Les images à ajouter au site vont dans `public/images/`. Le logo se trouve directement dans ce dossier. Les photos des bières doivent être nommées d’après leur URL (par exemple `valentin.png`) et placées dans `public/images/bieres/`.
