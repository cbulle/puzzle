import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Link,
  Route,
  Routes,
  useLocation,
  useParams
} from 'react-router-dom';
import firebaseConfig from '../config.js';
import {
  eventDetails,
  eventPhotoSource,
  formatEventDate,
  loadUpcomingEvents
} from './events.js';

const beers = [
  { slug: 'valentin', name: 'Valentin', style: 'Blanche IPA', degree: '4,5 %', color: '#d9c276', ink: '#16201a' },
  { slug: 'jeannine', name: 'Jeannine', style: 'Blonde Pale Ale IPA', degree: '5 %', color: '#86a83f', ink: '#16201a' },
  { slug: 'antoinette', name: 'Antoinette', style: 'Blonde IPA', degree: '5 %', color: '#9a78d4', ink: '#16201a' },
  { slug: 'cornelius', name: 'Cornelius', style: 'Ambrée IPA', degree: '5 %', color: '#34477f', ink: '#f2e9d4' }
];
const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

const pageDescriptions = {
  home: 'Bières artisanales brassées à Lent, dans la Dombes : Valentin, Jeannine, Antoinette et Cornelius.',
  brasserie: 'Une brasserie artisanale installée dans un ancien corps de ferme, à Lent, dans la Dombes.',
  contact: 'Contacter la Brasserie Puzzle à Lent (01240) : téléphone, adresse et horaires.',
  events: 'Les prochains événements de la Brasserie Puzzle.',
  mentions: 'Mentions légales du site de la Brasserie Puzzle.'
};

function PageMeta({ title, description }) {
  useEffect(() => {
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = description;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = title;
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.content = description;
  }, [description, title]);

  return null;
}

function ScrollToRoute() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash, pathname]);

  return null;
}

function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname, location.hash]);
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <header>
      <Link className="brand" to="/" aria-label="Brasserie Puzzle, accueil">
        <img src="/assets/logo.svg" alt="" width="34" height="39" />
        <span>Puzzle</span>
      </Link>
      <button
        id="burger"
        type="button"
        aria-expanded={open}
        aria-controls="nav"
        aria-label="Menu"
        onClick={() => setOpen((value) => !value)}
      >
        <i /><i /><i />
      </button>
      <nav id="nav" className={open ? 'open' : ''}>
        <Link to="/#bieres">Les bières</Link>
        <Link to="/brasserie.html">La brasserie</Link>
        <Link to="/evenements.html">Événements</Link>
        <Link to="/contact.html">Contact</Link>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <div className="fcols">
        <div>
          <img src="/assets/logo.svg" alt="" width="44" height="50" />
          <p className="fname">Brasserie Puzzle</p>
          <p>Bières artisanales brassées dans l’Ain, au cœur de la Dombes.</p>
        </div>
        <div>
          <h3>Nous trouver</h3>
          <p>341 route de Bresse<br />01240 Lent</p>
          <p><a href="tel:+33622942892">06 22 94 28 92</a></p>
          <p>Samedi de 9 h à 12 h.<br />Sur réservation le reste du temps.</p>
        </div>
        <div>
          <h3>Le site</h3>
          <p><Link to="/#bieres">Les bières</Link></p>
          <p><Link to="/evenements.html">Événements</Link></p>
          <p><Link to="/brasserie.html">La brasserie</Link></p>
          <p><Link to="/contact.html">Contact</Link></p>
          <p><a href="https://www.facebook.com/brasseriepuzzle" rel="noreferrer">Facebook</a></p>
        </div>
      </div>
      <p className="sante">L’abus d’alcool est dangereux pour la santé, à consommer avec modération.</p>
      <p className="legal">Site destiné aux personnes majeures. <Link to="/mentions.html">Mentions légales</Link></p>
    </footer>
  );
}

function Portrait({ beer, large = false }) {
  const [failed, setFailed] = useState(false);
  const classes = `perso${large ? ' big' : ''}`;

  if (failed) return <div className={classes} aria-hidden="true">{beer.name[0]}</div>;
  return (
    <img
      className={large ? 'pb' : 'pp'}
      src={`/assets/persos/${beer.slug}.png`}
      alt=""
      width={large ? 200 : 120}
      height={large ? 200 : 120}
      onError={() => setFailed(true)}
    />
  );
}

function Intro() {
  const [visible, setVisible] = useState(() => {
    try {
      return sessionStorage.getItem('intro') !== '1';
    } catch {
      return false;
    }
  });
  const [closing, setClosing] = useState(false);
  const timeout = useRef();

  const close = useCallback(() => {
    setClosing(true);
    try {
      sessionStorage.setItem('intro', '1');
    } catch {
      // The animation can still be dismissed when storage is disabled.
    }
    timeout.current = window.setTimeout(() => setVisible(false), 800);
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    const timer = window.setTimeout(close, 4200);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(timeout.current);
    };
  }, [close, visible]);

  if (!visible) return null;
  return (
    <div id="intro" className={closing ? 'out' : ''}>
      <svg viewBox="0 0 200 230">
        <defs>
          <mask id="m">
            <rect width="200" height="230" fill="#fff" />
            <path transform="translate(100 128) rotate(45) scale(1.5)" d="M-30 -30H-9C-9 -42 9 -42 9 -30H30V-9C42 -9 42 9 30 9V30H9C9 18 -9 18 -9 30H-30V9C-18 9 -18 -9 -30 -9Z" />
          </mask>
        </defs>
        <g className="leaf">
          <path fill="#f2e9d4" mask="url(#m)" d="M100 10C112 30 118 40 130 50C148 62 150 80 156 100C172 108 176 130 168 150C160 178 130 200 102 204L104 226H98L98 204C70 200 40 178 32 150C24 130 28 108 44 100C50 80 52 62 70 50C82 40 88 30 100 10Z" />
        </g>
        <g transform="translate(100 128)">
          <g className="piece">
            <path fill="#a68bd6" transform="rotate(45) scale(1.5)" d="M-30 -30H-9C-9 -42 9 -42 9 -30H30V-9C42 -9 42 9 30 9V30H9C9 18 -9 18 -9 30H-30V9C-18 9 -18 -9 -30 -9Z" />
          </g>
        </g>
      </svg>
      <p className="ititle">Brasserie Puzzle</p>
      <button id="skip" type="button" aria-hidden="false" onClick={close}>Passer</button>
    </div>
  );
}

function useUpcomingEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    loadUpcomingEvents()
      .then((upcoming) => {
        if (active) setEvents(upcoming);
      })
      .catch(() => {
        if (active) setError('Les événements ne sont pas disponibles pour le moment.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { events, loading, error };
}

function EventContent({ event }) {
  const photo = eventPhotoSource(event.photo);
  return (
    <>
      {photo && <img className="ph" src={photo} alt={event.titre} loading="lazy" />}
      <p className="sd">{formatEventDate(event.parsedDate)}</p>
      <h3>{event.titre}</h3>
      <p>{eventDetails(event)}</p>
      {event.description && <p>{event.description}</p>}
    </>
  );
}

function EventCarousel({ events }) {
  const slides = useRef(null);
  const [current, setCurrent] = useState(0);

  const goTo = useCallback((index) => {
    const items = slides.current?.children;
    if (!items?.length) return;
    const next = (index + items.length) % items.length;
    setCurrent(next);
    items[next].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, []);

  useEffect(() => {
    const element = slides.current;
    if (!element) return undefined;
    const markCurrent = () => {
      const containerCenter = element.getBoundingClientRect().left + element.clientWidth / 2;
      let closest = 0;
      let distance = Number.POSITIVE_INFINITY;
      Array.from(element.children).forEach((slide, index) => {
        const bounds = slide.getBoundingClientRect();
        const slideCenter = bounds.left + bounds.width / 2;
        const nextDistance = Math.abs(containerCenter - slideCenter);
        if (nextDistance < distance) {
          closest = index;
          distance = nextDistance;
        }
      });
      setCurrent(closest);
    };
    element.addEventListener('scroll', markCurrent, { passive: true });
    return () => element.removeEventListener('scroll', markCurrent);
  }, [events.length]);

  useEffect(() => {
    if (events.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => goTo(current + 1), 6000);
    return () => window.clearInterval(timer);
  }, [current, events.length, goTo]);

  return (
    <div id="events">
      <h2>Prochains événements</h2>
      <div className="slides" id="slides" ref={slides}>
        {events.map((event) => (
          <article className="slide" key={event.id || `${event.date}-${event.titre}`}>
            <EventContent event={event} />
          </article>
        ))}
      </div>
      {events.length > 1 && (
        <div className="sl-nav">
          <button type="button" aria-label="Événement précédent" onClick={() => goTo(current - 1)}>&lt;</button>
          <div className="dots" id="dots" aria-live="polite">
            {current + 1} / {events.length}
          </div>
          <button type="button" aria-label="Événement suivant" onClick={() => goTo(current + 1)}>&gt;</button>
        </div>
      )}
      <Link className="btn" to="/evenements.html">Tous les événements</Link>
    </div>
  );
}

function BeerPiece({ beer, index, onVisible, visible }) {
  const card = useRef(null);

  useEffect(() => {
    if (!card.current) return undefined;
    if (!('IntersectionObserver' in window)) {
      onVisible(index);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      onVisible(index);
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(card.current);
    return () => observer.disconnect();
  }, [index, onVisible]);

  const paths = [
    'M0,0L100,0L100,40 C108,40 122,32 122,50 C122,68 108,60 100,60 L100,100L60,100 C60,108 68,122 50,122 C32,122 40,108 40,100 L0,100L0,0Z',
    'M0,0L100,0L100,100L60,100 C60,108 68,122 50,122 C32,122 40,108 40,100 L0,100L0,60 C8,60 22,68 22,50 C22,32 8,40 0,40 L0,0Z',
    'M0,0L40,0 C40,8 32,22 50,22 C68,22 60,8 60,0 L100,0L100,40 C108,40 122,32 122,50 C122,68 108,60 100,60 L100,100L0,100L0,0Z',
    'M0,0L40,0 C40,8 32,22 50,22 C68,22 60,8 60,0 L100,0L100,100L0,100L0,60 C8,60 22,68 22,50 C22,32 8,40 0,40 L0,0Z'
  ];

  return (
    <Link
      ref={card}
      className={`pc${visible ? ' in' : ''}`}
      to={`/biere-${beer.slug}.html`}
      style={{ '--c': beer.color, '--i': beer.ink, '--t': `${index % 2 ? 90 : -90}px,${index < 2 ? -70 : 70}px`, '--r': `${index % 2 ? 12 : -14}deg` }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d={paths[index]} fill={beer.color} stroke="#f6efdc" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="pt">
        <Portrait beer={beer} />
        <h3>{beer.name}</h3>
        <p>{beer.style}</p>
        <span className="more">Découvrir cette bière</span>
      </span>
    </Link>
  );
}

function HomePage() {
  const { events, error } = useUpcomingEvents();
  const [revealed, setRevealed] = useState(() => new Set());
  const markVisible = useCallback((index) => {
    setRevealed((previous) => new Set(previous).add(index));
  }, []);
  const homeTitle = 'Brasserie Puzzle – Bières artisanales de la Dombes, Lent (Ain)';

  return (
    <>
      <PageMeta title={homeTitle} description={pageDescriptions.home} />
      <Intro />
      <Header />
      <main>
        <section className="hero">
          <h1>Des bières de caractère, nées dans la Dombes</h1>
          <p>Brasserie Puzzle, à Lent dans l’Ain. Quatre bières, quatre personnages, un seul puzzle.</p>
        </section>
        {events.length > 0 && (
          <section aria-label="Événements à venir">
            <EventCarousel events={events} />
          </section>
        )}
        {error && <p className="event-error" role="status">{error}</p>}
        <section id="bieres">
          <h2>Les quatre pièces</h2>
          <div className="grid">
            {beers.map((beer, index) => (
              <BeerPiece
                key={beer.slug}
                beer={beer}
                index={index}
                onVisible={markVisible}
                visible={revealed.has(index)}
              />
            ))}
          </div>
          <p className={`done-msg${revealed.size === beers.length ? ' show' : ''}`}>Le puzzle est complet.</p>
        </section>
        <section className="tz">
          <h2>Une brasserie de ferme</h2>
          <p>La brasserie est installée dans un ancien corps de ferme, au pays des étangs. Le brasseur s’inspire de la nature autour de lui.</p>
          <Link className="btn" to="/brasserie.html">Découvrir la brasserie</Link>
        </section>
      </main>
      <Footer />
    </>
  );
}

function BeerPage({ beerSlug }) {
  const { slug: routeSlug } = useParams();
  const slug = beerSlug || routeSlug;
  const beer = beers.find((item) => item.slug === slug);
  if (!beer) return <NotFoundPage />;
  const description = `${beer.name}, bière ${beer.style.toLowerCase()} de la Brasserie Puzzle à Lent.`;
  const others = beers.filter((item) => item.slug !== beer.slug);

  return (
    <SiteLayout title={`${beer.name} – ${beer.style} | Brasserie Puzzle`} description={description}>
      <section className="bh" style={{ '--c': beer.color, '--i': beer.ink }}>
        <Portrait beer={beer} large />
        <h1>{beer.name}</h1>
        <p className="type">{beer.style}</p>
      </section>
      <section>
        <h2>Caractéristiques</h2>
        <ul className="car">
          <li><b>Type</b> {beer.style}</li>
          <li><b>Degré</b> {beer.degree}</li>
          <li><b>Formats</b> 33 cl et 75 cl</li>
        </ul>
      </section>
      <section>
        <h2>Les autres pièces</h2>
        <div className="autres">
          {others.map((other) => (
            <Link key={other.slug} to={`/biere-${other.slug}.html`} style={{ '--c': other.color }}>{other.name}</Link>
          ))}
        </div>
        <Link className="btn" to="/#bieres">Retour au puzzle</Link>
      </section>
    </SiteLayout>
  );
}

function SiteLayout({ children, title, description }) {
  return (
    <>
      <PageMeta title={title} description={description} />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}

function BreweryPage() {
  return (
    <SiteLayout title="La brasserie | Brasserie Puzzle" description={pageDescriptions.brasserie}>
      <section>
        <h1>La brasserie</h1>
        <p>Née dans la Dombes, pays des étangs, la Brasserie Puzzle aime le malt et le houblon. Elle est installée dans un ancien corps de ferme typique, et le brasseur puise son inspiration dans la nature environnante.</p>
        <p>Ses bières sont fortement houblonnées et brassées avec soin.</p>
        <h2>Sur place</h2>
        <p>Dégustation de produits, visites gratuites, vente à la propriété et sur les marchés.</p>
        <Link className="btn" to="/contact.html">Nous contacter</Link>
      </section>
    </SiteLayout>
  );
}

function ContactPage() {
  const [showMap, setShowMap] = useState(false);
  return (
    <SiteLayout title="Contact | Brasserie Puzzle" description={pageDescriptions.contact}>
      <section>
        <h1>Nous contacter</h1>
        <div className="cblocks">
          <div className="cbloc">
            <h2>Coordonnées</h2>
            <a className="tel" href="tel:+33622942892">06 22 94 28 92</a>
            <p>Par téléphone, pour toute question et pour réserver une visite.</p>
            <h3>Adresse</h3>
            <p>341 route de Bresse<br />01240 Lent</p>
            <h3>Horaires</h3>
            <p>Ouvert le samedi de 9 h à 12 h. En dehors de ce créneau, sur réservation.</p>
          </div>
          <div className="cbloc">
            <h2>Plan d’accès</h2>
            <div className="map">
              {showMap
                ? <iframe title="Plan d’accès à la Brasserie Puzzle" loading="lazy" src="https://www.google.com/maps?q=341+route+de+Bresse+01240+Lent&output=embed" />
                : <button className="btn" type="button" onClick={() => setShowMap(true)}>Afficher la carte</button>}
            </div>
            <a className="btn" href="https://www.google.com/maps/search/?api=1&query=341+route+de+Bresse+01240+Lent" target="_blank" rel="noreferrer">Ouvrir dans Google Maps</a>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function EventsPage() {
  const { events, loading, error } = useUpcomingEvents();
  return (
    <SiteLayout title="Événements | Brasserie Puzzle" description={pageDescriptions.events}>
      <section>
        <h1>Événements</h1>
        {loading && <p role="status">Chargement des événements…</p>}
        {error && <p className="event-error" role="alert">{error}</p>}
        {!loading && !error && events.length === 0 && <p>Aucun événement prévu pour le moment.</p>}
        <div id="list">
          {events.map((event) => (
            <article className="ev" key={event.id || `${event.date}-${event.titre}`}>
              <EventContent event={event} />
            </article>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}

function LegalPage() {
  return (
    <SiteLayout title="Mentions légales | Brasserie Puzzle" description={pageDescriptions.mentions}>
      <section>
        <h1>Mentions légales</h1>
        <p>Éditeur : Brasserie Puzzle, 341 route de Bresse, 01240 Lent. Téléphone : 06 22 94 28 92.</p>
        <p>Directeur de la publication : [à compléter].</p>
        <p>Hébergeur : Netlify, Inc., 512 2nd Street, Suite 200, San Francisco, CA 94107, États-Unis.</p>
        <p>Conception du site : [à compléter].</p>
      </section>
    </SiteLayout>
  );
}

async function compressPhoto(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Impossible de préparer cette image.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let quality = 0.8;
    let result = canvas.toDataURL('image/jpeg', quality);
    while (result.length > 700000 && quality > 0.4) {
      quality -= 0.1;
      result = canvas.toDataURL('image/jpeg', quality);
    }
    return result;
  } finally {
    bitmap.close();
  }
}

function AdminPage() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [firebaseServices, setFirebaseServices] = useState(null);
  const [events, setEvents] = useState([]);
  const [editId, setEditId] = useState(null);
  const [photo, setPhoto] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ date: '', titre: '', lieu: '', heure: '', description: '' });

  useEffect(() => {
    if (!firebaseConfigured) {
      setAuthReady(true);
      return undefined;
    }
    let active = true;
    let unsubscribe;
    Promise.all([
      import('./firebase.js'),
      import('firebase/auth'),
      import('firebase/firestore')
    ]).then(([firebase, authSdk, firestore]) => {
      if (!active) return;
      setFirebaseServices({ authSdk, firestore, ...firebase });
      if (!firebase.auth) {
        setAuthReady(true);
        return;
      }
      unsubscribe = authSdk.onAuthStateChanged(firebase.auth, (nextUser) => {
        setUser(nextUser);
        setAuthReady(true);
      }, () => {
        setMessage('Impossible de vérifier la session administrateur.');
        setAuthReady(true);
      });
    }).catch(() => {
      if (!active) return;
      setMessage('Impossible d’initialiser Firebase.');
      setAuthReady(true);
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const loadAdminEvents = useCallback(async () => {
    const { db: database, firestore } = firebaseServices || {};
    if (!database || !firestore) return;
    const { collection, getDocs, limit, orderBy, query } = firestore;
    const snapshot = await getDocs(query(
      collection(database, 'evenements'),
      orderBy('date', 'desc'),
      limit(50)
    ));
    setEvents(snapshot.docs.map((event) => ({ id: event.id, ...event.data() })));
  }, [firebaseServices]);

  useEffect(() => {
    const { db: database, firestore } = firebaseServices || {};
    if (!user || !database || !firestore) return undefined;
    const { collection, limit, onSnapshot, orderBy, query } = firestore;
    let active = true;
    const unsubscribe = onSnapshot(
      query(collection(database, 'evenements'), orderBy('date', 'desc'), limit(50)),
      (snapshot) => {
        if (active) setEvents(snapshot.docs.map((event) => ({ id: event.id, ...event.data() })));
      },
      () => {
        if (active) setMessage('Impossible de charger les événements. Vérifiez la connexion et les règles Firestore.');
      }
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [firebaseServices, user]);

  const changeField = (event) => {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };

  const resetForm = () => {
    setEditId(null);
    setPhoto('');
    setForm({ date: '', titre: '', lieu: '', heure: '', description: '' });
    setMessage('');
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const values = new FormData(event.currentTarget);
    try {
      await firebaseServices.authSdk.signInWithEmailAndPassword(
        firebaseServices.auth,
        values.get('email'),
        values.get('password')
      );
    } catch {
      setMessage('E-mail ou mot de passe incorrect.');
    } finally {
      setBusy(false);
    }
  };

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage('Préparation de la photo…');
    try {
      setPhoto(await compressPhoto(file));
      setMessage('');
    } catch {
      setMessage('Photo illisible, essaie une autre image.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { db: database, firestore } = firebaseServices || {};
    if (!database || !firestore) {
      setMessage('Configuration Firebase manquante.');
      return;
    }
    const { addDoc, collection, doc, setDoc } = firestore;
    const data = {
      ...form,
      date: form.date,
      titre: form.titre.trim(),
      lieu: form.lieu.trim(),
      heure: form.heure.trim(),
      description: form.description.trim(),
      photo
    };
    setBusy(true);
    setMessage('Publication…');
    try {
      if (editId) await setDoc(doc(database, 'evenements', editId), data);
      else await addDoc(collection(database, 'evenements'), data);
      resetForm();
      await loadAdminEvents();
      setMessage('Événement publié.');
    } catch {
      setMessage('Échec de la publication. Vérifie ta connexion et réessaie.');
    } finally {
      setBusy(false);
    }
  };

  const editEvent = (event) => {
    setEditId(event.id);
    setPhoto(event.photo || '');
    setForm({
      date: event.date || '',
      titre: event.titre || '',
      lieu: event.lieu || '',
      heure: event.heure || '',
      description: event.description || ''
    });
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeEvent = async (event) => {
    if (!window.confirm('Supprimer cet événement ?')) return;
    try {
      await firebaseServices.firestore.deleteDoc(
        firebaseServices.firestore.doc(firebaseServices.db, 'evenements', event.id)
      );
      setMessage('Événement supprimé.');
    } catch {
      setMessage('Échec de la suppression. Vérifie ta connexion et réessaie.');
    }
  };

  return (
    <>
      <PageMeta title="Gérer les événements | Brasserie Puzzle" description="Espace d’administration des événements." />
      <main className="adm">
        {!firebaseConfigured && <p role="alert">Configuration Firebase manquante : vérifiez le fichier config.js.</p>}
        {!authReady && <p role="status">Vérification de la session…</p>}
        {firebaseConfigured && authReady && !user && (
          <section id="login">
            <h1>Espace brasseur</h1>
            <form onSubmit={handleLogin}>
              <label htmlFor="email">E-mail</label>
              <input id="email" name="email" type="email" autoComplete="username" required />
              <label htmlFor="password">Mot de passe</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required />
              <button className="btn" type="submit" disabled={busy}>Se connecter</button>
            </form>
          </section>
        )}
        {user && (
          <section id="panel">
            <h1>{editId ? 'Modifier l’événement' : 'Nouvel événement'}</h1>
            <form onSubmit={handleSubmit}>
              <label htmlFor="date">Date</label>
              <input id="date" name="date" type="date" value={form.date} onChange={changeField} required />
              <label htmlFor="titre">Titre</label>
              <input id="titre" name="titre" type="text" value={form.titre} onChange={changeField} required />
              <label htmlFor="lieu">Lieu</label>
              <input id="lieu" name="lieu" type="text" value={form.lieu} onChange={changeField} />
              <label htmlFor="heure">Heure</label>
              <input id="heure" name="heure" type="text" placeholder="ex. 9h - 17h" value={form.heure} onChange={changeField} />
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" rows="3" value={form.description} onChange={changeField} />
              <label htmlFor="photo">Photo</label>
              <input id="photo" name="photo" type="file" accept="image/*" onChange={handlePhoto} />
              {photo && <img className="ph preview" src={photo} alt="Aperçu de la photo de l’événement" />}
              <button className="btn" type="submit" disabled={busy}>{busy ? 'Enregistrement…' : editId ? 'Enregistrer' : 'Publier'}</button>
              {editId && <button className="btn" type="button" onClick={resetForm}>Annuler la modification</button>}
            </form>
            <h2>Tous les événements</h2>
            {events.map((event) => (
              <div className="ev admin-event" key={event.id}>
                <p>{event.date} – {event.titre}</p>
                <button className="btn" type="button" onClick={() => editEvent(event)}>Modifier</button>
                {' '}
                <button className="btn" type="button" onClick={() => removeEvent(event)}>Supprimer</button>
              </div>
            ))}
            <button
              className="btn"
              type="button"
              onClick={() => firebaseServices.authSdk.signOut(firebaseServices.auth)
                .catch(() => setMessage('Impossible de fermer la session.'))}
            >
              Se déconnecter
            </button>
          </section>
        )}
        <p id="msg" role="status">{message}</p>
      </main>
    </>
  );
}

function NotFoundPage() {
  return (
    <SiteLayout title="Page introuvable | Brasserie Puzzle" description="Cette page n’existe pas.">
      <section>
        <h1>Page introuvable</h1>
        <p>La page demandée n’existe pas ou a été déplacée.</p>
        <Link className="btn" to="/">Retour à l’accueil</Link>
      </section>
    </SiteLayout>
  );
}

export default function App() {
  return (
    <>
      <ScrollToRoute />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/index.html" element={<HomePage />} />
        {beers.map((beer) => (
          <Route
            key={beer.slug}
            path={`/biere-${beer.slug}.html`}
            element={<BeerPage beerSlug={beer.slug} />}
          />
        ))}
        <Route path="/brasserie.html" element={<BreweryPage />} />
        <Route path="/contact.html" element={<ContactPage />} />
        <Route path="/evenements.html" element={<EventsPage />} />
        <Route path="/mentions.html" element={<LegalPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/" element={<AdminPage />} />
        <Route path="/admin/index.html" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
