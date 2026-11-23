import firebaseConfig from '../firebase-config.js';

// Un événement : { date (début), fin (facultative), titre, heure, lieu, description, photo }
// Règle d'affichage : un événement reste visible jusqu'à la fin de son dernier jour
// (la date de fin, ou la date de début s'il ne dure qu'un jour).

const MAX_EVENTS = 50;

function parseDate(value) {
  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  let y, m, d;
  if (match) [, y, m, d] = match.map(Number);
  else {
    match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value || '');
    if (!match) return null;
    [, d, m, y] = match.map(Number);
  }
  const date = new Date(y, m - 1, d, 12);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

export function isoDay(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
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

async function fetchFromFirestore(today) {
  // On filtre sur la date de FIN (toujours renseignée par l'espace admin),
  // pour garder les événements du jour et ceux qui sont en cours.
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
              field: { fieldPath: 'fin' },
              op: 'GREATER_THAN_OR_EQUAL',
              value: { stringValue: today }
            }
          },
          orderBy: [{ field: { fieldPath: 'fin' }, direction: 'ASCENDING' }],
          limit: MAX_EVENTS
        }
      })
    }
  );
  if (!response.ok) throw new Error(`Impossible de charger les événements (${response.status}).`);
  const rows = await response.json();
  return rows.filter((row) => row.document).map((row) => decodeDocument(row.document));
}

async function fetchFromJson() {
  const response = await fetch('/evenements.json');
  if (!response.ok) throw new Error(`Impossible de charger les événements (${response.status}).`);
  const data = await response.json();
  return Array.isArray(data) ? data : data.evenements || [];
}

export async function loadUpcomingEvents() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const firebase = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
  const events = firebase ? await fetchFromFirestore(isoDay(today)) : await fetchFromJson();

  return events
    .map((event) => {
      const start = parseDate(event.date);
      let end = parseDate(event.fin) || start;
      if (start && end < start) end = start;
      return { ...event, start, end };
    })
    .filter((event) => event.start && event.titre && event.end >= today)
    .map((event) => ({
      ...event,
      today: event.start <= today && event.end >= today,
      multi: event.end > event.start
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end)
    .slice(0, MAX_EVENTS);
}

const fmt = (date, options) => date.toLocaleDateString('fr-FR', options);

function rangeText(start, end) {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const from = fmt(start, sameMonth ? { weekday: 'long', day: 'numeric' } : { weekday: 'long', day: 'numeric', month: 'long' });
  const to = fmt(end, { weekday: 'long', day: 'numeric', month: 'long' });
  return `Du ${from} au ${to}`;
}

function eventCard(event) {
  const card = document.createElement('li');
  card.className = event.today ? 'ev ev-now' : 'ev';

  // Bloc date : jour de la semaine / numéro / mois  (ou « du 12 au 14 déc. »)
  const date = document.createElement('time');
  date.className = 'ev-date';
  date.dateTime = isoDay(event.start);
  const top = document.createElement('span');
  top.className = 'ev-wd';
  const day = document.createElement('span');
  day.className = 'ev-day';
  const month = document.createElement('span');
  month.className = 'ev-month';
  if (event.multi) {
    top.textContent = 'du';
    day.textContent = String(event.start.getDate());
    month.textContent = `au ${event.end.getDate()} ${fmt(event.end, { month: 'short' })}`;
    date.classList.add('ev-date-multi');
  } else {
    top.textContent = fmt(event.start, { weekday: 'short' });
    day.textContent = String(event.start.getDate());
    month.textContent = fmt(event.start, { month: 'short' });
  }
  date.append(top, day, month);

  const body = document.createElement('div');
  body.className = 'ev-body';
  if (event.today) {
    const badge = document.createElement('p');
    badge.className = 'ev-badge';
    badge.textContent = event.multi ? 'En ce moment' : 'Aujourd’hui';
    body.append(badge);
  }
  const title = document.createElement('h3');
  title.textContent = event.titre;
  body.append(title);

  const lines = [
    ['ev-range', event.multi ? rangeText(event.start, event.end) : ''],
    ['ev-time', event.heure],
    ['ev-place', event.lieu]
  ];
  for (const [cls, text] of lines) {
    if (!text) continue;
    const line = document.createElement('p');
    line.className = `ev-meta ${cls}`;
    line.textContent = text;
    body.append(line);
  }
  if (event.description) {
    const description = document.createElement('p');
    description.textContent = event.description;
    body.append(description);
  }

  card.append(date, body);

  const photo = eventPhotoSource(event.photo);
  if (photo) {
    const image = document.createElement('img');
    image.className = 'ev-photo';
    image.src = photo;
    image.alt = '';
    image.loading = 'lazy';
    card.append(image);
  }
  return card;
}

document.querySelectorAll('[data-event-list]').forEach(async (root) => {
  const loading = root.querySelector('[data-events-loading]');
  try {
    const max = Number(root.getAttribute('data-max')) || MAX_EVENTS;
    const events = (await loadUpcomingEvents()).slice(0, max);
    if (loading) loading.hidden = true;
    if (!events.length) {
      root.querySelector('[data-events-empty]')?.removeAttribute('hidden');
      return;
    }
    const list = root.querySelector('[data-events-list]');
    events.forEach((event) => list?.append(eventCard(event)));
  } catch {
    if (loading) {
      loading.textContent = 'L’agenda n’est pas disponible pour le moment. Réessayez un peu plus tard.';
      loading.classList.add('event-error');
      loading.setAttribute('role', 'alert');
    }
  }
});
