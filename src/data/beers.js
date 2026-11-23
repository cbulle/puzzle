// Les bières de la brasserie.
// - portrait : personnage découpé dans l'étiquette (public/images/bieres/<slug>.jpg)
// - etiquette : étiquette complète (public/images/etiquettes/<slug>.jpg)
// Mettre `portrait: false` tant que l'étiquette n'existe pas : la pièce s'affiche « bientôt ».
export const beers = [
  {
    slug: 'antoinette',
    name: 'Antoinette',
    style: 'Blonde IPA DDH',
    degree: '5 %',
    color: '#343a6b',
    ink: '#f3ecdc',
    portrait: true
  },
  {
    slug: 'jeannine',
    name: 'Jeannine',
    style: 'Bière blonde',
    degree: '5 %',
    color: '#8dbd52',
    ink: '#1f2427',
    portrait: true
  },
  {
    slug: 'valentin',
    name: 'Valentin',
    style: 'Blanche IPA',
    degree: '4,5 %',
    color: '#e2d29b',
    ink: '#1f2427',
    portrait: false
  },
  {
    slug: 'cornelius',
    name: 'Cornelius',
    style: 'Ambrée IPA DDH',
    degree: '5 %',
    color: '#2c3134',
    ink: '#f3ecdc',
    portrait: true
  }
];
