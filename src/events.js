import firebaseConfig from '../config.js';

function parseDate(value) {
  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (match) {
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.getFullYear() === Number(match[1]) &&
      date.getMonth() === Number(match[2]) - 1 &&
      date.getDate() === Number(match[3])
      ? date
      : null;
  }

  match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value || '');
  if (!match) return null;
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
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

export function eventPhotoSource(photo) {
  if (!photo) return '';
  return /^(https?:|data:|\/)/.test(photo) ? photo : `/images/evenements/${photo}`;
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
    events = rows
      .filter((row) => row.document)
      .map((row) => ({
        id: row.document.name,
        ...Object.fromEntries(
          Object.entries(row.document.fields || {}).map(([key, value]) => [key, value.stringValue || ''])
        )
      }));
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
