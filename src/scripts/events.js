import firebaseConfig from '../../config.js';

function parseDate(value) {
  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (match) {
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
    if (
      date.getFullYear() === Number(match[1]) &&
      date.getMonth() === Number(match[2]) - 1 &&
      date.getDate() === Number(match[3])
    ) return date;
    return null;
  }

  match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value || '');
  if (!match) return null;
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 12);
  return date.getFullYear() === Number(match[3]) &&
    date.getMonth() === Number(match[2]) - 1 &&
    date.getDate() === Number(match[1])
    ? date
    : null;
}

export function formatEventDate(date) {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function eventDetails(event) {
  return [event.heure, event.lieu].filter(Boolean).join(' – ');
}

function eventPhotoSource(photo) {
  if (!photo) return '';
  return /^(https?:|data:|\/)/.test(photo) ? photo : `/images/evenements/${photo}`;
}

function decodeDocument(document) {
  const fields = Object.fromEntries(
    Object.entries(document.fields || {}).map(([key, value]) => {
      const field = value.stringValue ?? value.integerValue ?? value.doubleValue ?? '';
      return [key, String(field)];
    })
  );
  return { id: document.name, ...fields };
}

export async function loadUpcomingEvents() {
  let events;

  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    const today = new Date();
    const date = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ].join('-');
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents:runQuery?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'evenements' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'date' },
                op: 'GREATER_THAN',
                value: { stringValue: date }
              }
            },
            orderBy: [{ field: { fieldPath: 'date' }, direction: 'ASCENDING' }],
            limit: 50
          }
        })
      }
    );
    if (!response.ok) throw new Error(`Impossible de charger les événements (${response.status}).`);
    const rows = await response.json();
    events = rows.filter((row) => row.document).map((row) => decodeDocument(row.document));
  } else {
    const response = await fetch('/evenements.json');
    if (!response.ok) throw new Error(`Impossible de charger les événements (${response.status}).`);
    const data = await response.json();
    events = Array.isArray(data) ? data : data.evenements || [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return events
    .map((event) => ({ ...event, parsedDate: parseDate(event.date) }))
    .filter((event) => event.parsedDate && event.parsedDate > today && event.titre)
    .sort((a, b) => a.parsedDate - b.parsedDate)
    .slice(0, 50);
}

function eventCard(event, className = 'ev') {
  const card = document.createElement('article');
  card.className = className;

  const photo = eventPhotoSource(event.photo);
  if (photo) {
    const image = document.createElement('img');
    image.className = 'ph';
    image.src = photo;
    image.alt = event.titre;
    image.loading = 'lazy';
    card.append(image);
  }

  const date = document.createElement('p');
  date.className = 'sd';
  date.textContent = formatEventDate(event.parsedDate);
  const title = document.createElement('h3');
  title.textContent = event.titre;
  card.append(date, title);

  const details = eventDetails(event);
  if (details) {
    const detailParagraph = document.createElement('p');
    detailParagraph.textContent = details;
    card.append(detailParagraph);
  }

  if (event.description) {
    const description = document.createElement('p');
    description.textContent = event.description;
    card.append(description);
  }
  return card;
}

function setupCarousel(root, events) {
  const slides = root.querySelector('[data-slides]');
  const previous = root.querySelector('[data-previous]');
  const next = root.querySelector('[data-next]');
  const counter = root.querySelector('[data-counter]');
  if (!(slides instanceof HTMLElement) || !(counter instanceof HTMLElement)) return;

  events.forEach((event) => slides.append(eventCard(event, 'slide')));
  root.hidden = false;
  slides.hidden = false;

  if (events.length < 2) return;
  previous.hidden = false;
  next.hidden = false;
  counter.hidden = false;
  counter.textContent = `1 / ${events.length}`;
  let current = 0;
  const updateCounter = () => {
    const containerCenter = slides.getBoundingClientRect().left + slides.clientWidth / 2;
    let distance = Number.POSITIVE_INFINITY;
    Array.from(slides.children).forEach((slide, index) => {
      const bounds = slide.getBoundingClientRect();
      const nextDistance = Math.abs(containerCenter - (bounds.left + bounds.width / 2));
      if (nextDistance < distance) {
        distance = nextDistance;
        current = index;
      }
    });
    counter.textContent = `${current + 1} / ${events.length}`;
  };
  const goTo = (index) => {
    current = (index + events.length) % events.length;
    slides.children[current].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    counter.textContent = `${current + 1} / ${events.length}`;
  };

  slides.addEventListener('scroll', updateCounter, { passive: true });
  previous.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  let timer = window.setInterval(() => goTo(current + 1), 6000);
  const stop = () => {
    window.clearInterval(timer);
    timer = 0;
  };
  root.addEventListener('pointerdown', stop, { once: true });
  root.addEventListener('focusin', stop, { once: true });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) stop();
}

function setupEventList(root, events) {
  const loading = root.querySelector('[data-events-loading]');
  const empty = root.querySelector('[data-events-empty]');
  const list = root.querySelector('[data-events-list]');
  if (loading) loading.hidden = true;
  if (!events.length) {
    if (empty) empty.hidden = false;
    return;
  }
  if (list) events.forEach((event) => list.append(eventCard(event)));
}

document.querySelectorAll('[data-event-carousel], [data-event-list]').forEach(async (root) => {
  try {
    const events = await loadUpcomingEvents();
    if (root.hasAttribute('data-event-carousel')) setupCarousel(root, events);
    else setupEventList(root, events);
  } catch {
    const loading = root.querySelector('[data-events-loading]');
    if (loading) {
      loading.textContent = 'Les événements ne sont pas disponibles pour le moment. Réessayez un peu plus tard.';
      loading.classList.add('event-error');
      loading.setAttribute('role', 'alert');
    }
    if (root.hasAttribute('data-event-carousel')) {
      root.hidden = false;
      const error = root.querySelector('[data-carousel-error]');
      if (error) {
        error.hidden = false;
        error.textContent = 'Les événements ne sont pas disponibles pour le moment.';
      }
    }
  }
});
