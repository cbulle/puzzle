import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc
} from 'firebase/firestore';
import { db, firebaseConfigured } from '../firebase.js';

const $ = (id) => document.getElementById(id);
const login = $('login');
const panel = $('panel');
const loginForm = $('loginform');
const eventForm = $('event-form');
const message = $('msg');
const list = $('event-list');
const preview = $('preview');
const auth = db && firebaseConfigured ? getAuth() : null;
let currentUser = null;
let editId = null;
let photo = '';
let unsubscribeEvents;

const todayIso = () => {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
};
const frDate = (iso) => {
  const m = /^(d{4})-(d{2})-(d{2})$/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso || '';
};

const say = (text, isError = false) => {
  message.textContent = text;
  message.classList.toggle('event-error', isError);
};

if (!firebaseConfigured || !auth || !db) {
  say('Configuration Firebase manquante. Vérifiez les variables Firebase de votre fichier .env.', true);
} else {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    login.hidden = Boolean(user);
    panel.hidden = !user;
    unsubscribeEvents?.();
    unsubscribeEvents = undefined;
    if (user) subscribeToEvents();
  }, () => say('Impossible de vérifier la session administrateur.', true));
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  say('');
  const data = new FormData(loginForm);
  try {
    await signInWithEmailAndPassword(auth, data.get('email'), data.get('password'));
  } catch {
    say('E-mail ou mot de passe incorrect.', true);
  } finally {
    button.disabled = false;
  }
});

function subscribeToEvents() {
  const eventsQuery = query(collection(db, 'evenements'), orderBy('date', 'desc'), limit(50));
  unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
    renderEvents(snapshot.docs.map((event) => ({ id: event.id, ...event.data() })));
  }, () => say('Impossible de charger les événements. Vérifiez la connexion et les règles Firestore.', true));
}

function renderEvents(events) {
  list.replaceChildren();
  if (!events.length) {
    const empty = document.createElement('p');
    empty.textContent = 'Aucun événement enregistré.';
    list.append(empty);
    return;
  }

  events.forEach((event) => {
    const row = document.createElement('article');
    row.className = 'ev admin-event';
    const title = document.createElement('p');
    const range = event.fin && event.fin !== event.date ? `${frDate(event.date)} → ${frDate(event.fin)}` : frDate(event.date);
    title.textContent = `${range} – ${event.titre || ''}`;
    if ((event.fin || event.date || '') < todayIso()) row.classList.add('admin-past');

    const edit = document.createElement('button');
    edit.className = 'btn';
    edit.type = 'button';
    edit.textContent = 'Modifier';
    edit.addEventListener('click', () => editEvent(event));

    const remove = document.createElement('button');
    remove.className = 'btn';
    remove.type = 'button';
    remove.textContent = 'Supprimer';
    remove.addEventListener('click', () => removeEvent(event));
    row.append(title, edit, document.createTextNode(' '), remove);
    list.append(row);
  });
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

function updatePreview() {
  preview.hidden = !photo;
  if (photo) preview.src = photo;
  else preview.removeAttribute('src');
}

$('photo').addEventListener('change', async (event) => {
  const file = event.currentTarget.files?.[0];
  if (!file) return;
  say('Préparation de la photo…');
  try {
    photo = await compressPhoto(file);
    updatePreview();
    say('');
  } catch {
    say('Photo illisible, essaie une autre image.', true);
  }
});

function resetForm() {
  editId = null;
  photo = '';
  eventForm.reset();
  updatePreview();
  $('form-title').textContent = 'Nouvel événement';
  $('publish').textContent = 'Publier';
  $('cancel').hidden = true;
}

function editEvent(event) {
  editId = event.id;
  photo = event.photo || '';
  for (const field of ['date', 'titre', 'lieu', 'heure', 'description']) {
    eventForm.elements.namedItem(field).value = event[field] || '';
  }
  eventForm.elements.namedItem('fin').value = event.fin && event.fin !== event.date ? event.fin : '';
  updatePreview();
  $('form-title').textContent = 'Modifier l’événement';
  $('publish').textContent = 'Enregistrer';
  $('cancel').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$('date').addEventListener('change', (e) => { $('fin').min = e.currentTarget.value; });

$('cancel').addEventListener('click', () => {
  resetForm();
  say('');
});

eventForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = $('publish');
  button.disabled = true;
  say('Publication…');
  const formData = new FormData(eventForm);
  const start = String(formData.get('date'));
  const end = String(formData.get('fin') || '') || start;
  if (end < start) {
    say('La date de fin est avant la date de début.', true);
    button.disabled = false;
    return;
  }
  const eventData = {
    date: start,
    fin: end,
    titre: String(formData.get('titre')).trim(),
    lieu: String(formData.get('lieu')).trim(),
    heure: String(formData.get('heure')).trim(),
    description: String(formData.get('description')).trim(),
    photo
  };
  try {
    if (editId) await setDoc(doc(db, 'evenements', editId), eventData);
    else await addDoc(collection(db, 'evenements'), eventData);
    resetForm();
    say('Événement publié.');
  } catch {
    say('Échec de la publication. Vérifie ta connexion et réessaie.', true);
  } finally {
    button.disabled = false;
  }
});

async function removeEvent(event) {
  if (!window.confirm('Supprimer cet événement ?')) return;
  try {
    await deleteDoc(doc(db, 'evenements', event.id));
    say('Événement supprimé.');
  } catch {
    say('Échec de la suppression. Vérifie ta connexion et réessaie.', true);
  }
}

$('logout').addEventListener('click', async () => {
  try {
    await signOut(auth);
  } catch {
    say('Impossible de fermer la session.', true);
  }
});

window.addEventListener('pagehide', () => unsubscribeEvents?.(), { once: true });
