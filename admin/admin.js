import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, collection, doc, addDoc, setDoc, deleteDoc, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const $ = (id) => document.getElementById(id);
const say = (t) => { $('msg').textContent = t; };

if (!window.FB || !window.FB.projectId) {
  say('Configuration Firebase manquante : remplis le fichier config.js.');
  throw new Error('config');
}

const app = initializeApp(window.FB);
const auth = getAuth(app);
const db = getFirestore(app);
let editId = null, photoData = '';

onAuthStateChanged(auth, (user) => {
  $('login').hidden = !!user;
  $('panel').hidden = !user;
  if (user) load();
});

$('loginform').addEventListener('submit', async (e) => {
  e.preventDefault();
  try { await signInWithEmailAndPassword(auth, $('email').value, $('pass').value); say(''); }
  catch (err) { say('E-mail ou mot de passe incorrect.'); }
});
$('logout').addEventListener('click', () => signOut(auth));

// Réduit la photo (1000 px max) pour qu'elle reste légère
async function compress(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const s = Math.min(1, 1000 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * s);
  c.height = Math.round(bmp.height * s);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  let q = 0.8, d = c.toDataURL('image/jpeg', q);
  while (d.length > 700000 && q > 0.4) { q -= 0.1; d = c.toDataURL('image/jpeg', q); }
  return d;
}

function showPreview() {
  $('preview').hidden = !photoData;
  if (photoData) $('preview').src = photoData;
}

$('photo').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  say('Préparation de la photo...');
  try { photoData = await compress(f); showPreview(); say(''); }
  catch (err) { say('Photo illisible, essaie une autre image.'); }
});

function reset() {
  editId = null; photoData = '';
  $('evform').reset(); showPreview();
  $('ftitle').textContent = 'Nouvel événement';
  $('cancel').hidden = true;
}
$('cancel').addEventListener('click', reset);

$('evform').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    date: $('date').value, titre: $('titre').value.trim(), lieu: $('lieu').value.trim(),
    heure: $('heure').value.trim(), description: $('description').value.trim(), photo: photoData
  };
  say('Publication...');
  try {
    if (editId) await setDoc(doc(db, 'evenements', editId), data);
    else await addDoc(collection(db, 'evenements'), data);
    reset(); await load(); say('Événement publié.');
  } catch (err) { say('Échec de la publication. Vérifie ta connexion et réessaie.'); }
});

async function load() {
  const snap = await getDocs(query(collection(db, 'evenements'), orderBy('date', 'desc')));
  const box = $('evlist');
  box.replaceChildren();
  snap.forEach((d) => {
    const v = d.data();
    const row = document.createElement('div');
    row.className = 'ev';
    const t = document.createElement('p');
    t.textContent = v.date + ' – ' + v.titre;
    const edit = document.createElement('button');
    edit.className = 'btn'; edit.type = 'button'; edit.textContent = 'Modifier';
    edit.addEventListener('click', () => {
      editId = d.id; photoData = v.photo || '';
      $('date').value = v.date; $('titre').value = v.titre; $('lieu').value = v.lieu || '';
      $('heure').value = v.heure || ''; $('description').value = v.description || '';
      showPreview();
      $('ftitle').textContent = 'Modifier l’événement';
      $('cancel').hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    const del = document.createElement('button');
    del.className = 'btn'; del.type = 'button'; del.textContent = 'Supprimer';
    del.addEventListener('click', async () => {
      if (!confirm('Supprimer cet événement ?')) return;
      await deleteDoc(doc(db, 'evenements', d.id));
      load();
    });
    row.append(t, edit, ' ', del);
    box.append(row);
  });
}
