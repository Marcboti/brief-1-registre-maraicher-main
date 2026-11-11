const API = '';

// État
let operations = [];
let parcelles = new Set();
let cultures = new Set();

// Éléments DOM
const els = {
  nombre: document.getElementById('stat-nombre'),
  couts: document.getElementById('stat-couts'),
  recettes: document.getElementById('stat-recettes'),
  benefice: document.getElementById('stat-benefice'),
  form: document.getElementById('form-ajouter'),
  formMessage: document.getElementById('form-message'),
  liste: document.getElementById('liste-operations'),
  listeVide: document.getElementById('liste-vide'),
  recherche: document.getElementById('input-recherche'),
  filterParcelle: document.getElementById('filter-parcelle'),
  filterCulture: document.getElementById('filter-culture'),
  sortTri: document.getElementById('sort-tri'),
  btnSauvegarder: document.getElementById('btn-sauvegarder'),
  btnExporterCsv: document.getElementById('btn-exporter-csv'),
  btnListerSauvegardes: document.getElementById('btn-lister-sauvegardes'),
  btnRefresh: document.getElementById('btn-refresh'),
  inputId: document.getElementById('input-id'),
  inputDate: document.getElementById('input-date'),
  inputParcelle: document.getElementById('input-parcelle'),
  inputCulture: document.getElementById('input-culture'),
  inputOperation: document.getElementById('input-operation'),
  inputCout: document.getElementById('input-cout'),
  inputRecettes: document.getElementById('input-recettes'),
  btnAjouter: document.getElementById('btn-ajouter'),
  syntheseParcelle: document.getElementById('synthese-parcelle'),
  syntheseDetails: document.getElementById('synthese-details'),
  importSection: document.getElementById('import-export-section'),
  btnImporter: document.getElementById('btn-importer'),
  inputImportChemin: document.getElementById('input-import-chemin'),
  sauvegardesListe: document.getElementById('sauvegardes-liste'),
};

// Initialisation
async function init() {
  await chargerDonnees();
  afficherSynthese();
  await chargerFiltres();

  els.form.addEventListener('submit', handleAjouter);
  els.recherche.addEventListener('input', renderListe);
  els.filterParcelle.addEventListener('change', renderListe);
  els.filterCulture.addEventListener('change', renderListe);
  els.sortTri.addEventListener('change', renderListe);
  els.btnSauvegarder.addEventListener('click', handleSauvegarder);
  els.btnExporterCsv.addEventListener('click', handleExporterCsv);
  els.btnListerSauvegardes.addEventListener('click', handleListerSauvegardes);
  els.btnImporter.addEventListener('click', handleImporter);
  els.btnRefresh.addEventListener('click', () => location.reload());

  // Date par défaut : aujourd'hui
  const today = new Date().toISOString().split('T')[0];
  els.inputDate.value = today;
}

async function chargerDonnees() {
  const res = await fetch(`${API}/api/operations`);
  operations = await res.json();
}

async function chargerFiltres() {
  parcelles = new Set(operations.map(o => o.parcelle));
  cultures = new Set(operations.map(o => o.culture));

  els.filterParcelle.innerHTML = '<option value="">Toutes parcelles</option>';
  [...parcelles].sort().forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    els.filterParcelle.appendChild(opt);
  });

  els.filterCulture.innerHTML = '<option value="">Toutes cultures</option>';
  [...cultures].sort().forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    els.filterCulture.appendChild(opt);
  });
}

function getOperationsFiltrees() {
  let resultat = [...operations];

  const recherche = els.recherche.value.toLowerCase();
  if (recherche) {
    resultat = resultat.filter(o =>
      o.id.toLowerCase().includes(recherche) ||
      o.parcelle.toLowerCase().includes(recherche) ||
      o.culture.toLowerCase().includes(recherche) ||
      o.operation.toLowerCase().includes(recherche)
    );
  }

  const parcelle = els.filterParcelle.value;
  if (parcelle) resultat = resultat.filter(o => o.parcelle === parcelle);

  const culture = els.filterCulture.value;
  if (culture) resultat = resultat.filter(o => o.culture === culture);

  const tri = els.sortTri.value;
  if (tri === 'cout') resultat.sort((a, b) => a.coutFCFA - b.coutFCFA);
  else if (tri === 'cout-desc') resultat.sort((a, b) => b.coutFCFA - a.coutFCFA);
  else if (tri === 'date') resultat.sort((a, b) => a.date.localeCompare(b.date));

  return resultat;
}

function renderListe() {
  const ops = getOperationsFiltrees();
  els.liste.innerHTML = '';

  if (ops.length === 0) {
    els.listeVide.style.display = 'block';
    return;
  }
  els.listeVide.style.display = 'none';

  for (const op of ops) {
    const item = document.createElement('div');
    item.className = 'operation-item';

    const benefice = (op.recettesFCFA || 0) - op.coutFCFA;
    const beneficeClass = benefice >= 0 ? 'benefice-positif' : 'benefice-negatif';

    item.innerHTML = `
      <div class="operation-info">
        <div class="operation-id">${op.id}</div>
        <div class="operation-meta">
          <span>${op.date}</span>
          <span>${op.parcelle}</span>
          <span>${op.culture}</span>
          <span>${op.operation}</span>
          <span>${op.coutFCFA} FCFA</span>
          ${op.recettesFCFA ? `<span>Recettes: ${op.recettesFCFA} FCFA</span>` : ''}
        </div>
      </div>
      <div class="operation-actions">
        <span class="${beneficeClass}" style="font-weight:600">${benefice >= 0 ? '+' : ''}${benefice} FCFA</span>
        <button class="btn-delete" onclick="supprimerOperation('${op.id}')" title="Supprimer">🗑️</button>
      </div>
    `;
    els.liste.appendChild(item);
  }
}

async function handleAjouter(e) {
  e.preventDefault();

  const saisie = {
    id: els.inputId.value.trim().toUpperCase(),
    date: els.inputDate.value,
    parcelle: els.inputParcelle.value.trim().toUpperCase(),
    culture: els.inputCulture.value.trim().toLowerCase(),
    operation: els.inputOperation.value,
    coutFCFA: els.inputCout.value.trim(),
  };

  const recettes = els.inputRecettes.value.trim();
  if (recettes) saisie.recettesFCFA = recettes;

  try {
    const res = await fetch(`${API}/api/operations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saisie),
    });

    const data = await res.json();

    if (!res.ok) {
      afficherMessage(data.erreurs || [data.erreur], 'error');
      return;
    }

    afficherMessage(['Opération ajoutée avec succès !'], 'success');
    els.form.reset();
    els.inputDate.value = new Date().toISOString().split('T')[0];
    await chargerDonnees();
    await chargerFiltres();
    renderListe();
    afficherSynthese();
  } catch (err) {
    afficherMessage([`Erreur: ${err.message}`], 'error');
  }
}

function afficherMessage(messages, type) {
  els.formMessage.innerHTML = '';
  els.formMessage.className = `form-message ${type}`;
  for (const m of messages) {
    const div = document.createElement('div');
    div.textContent = m;
    els.formMessage.appendChild(div);
  }
  setTimeout(() => { els.formMessage.innerHTML = ''; }, 5000);
}

async function supprimerOperation(id) {
  if (!confirm(`Supprimer l'opération ${id} ?`)) return;
  try {
    const res = await fetch(`${API}/api/operations/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('Erreur lors de la suppression');
      return;
    }
    await chargerDonnees();
    renderListe();
    afficherSynthese();
  } catch (err) {
    alert(`Erreur: ${err.message}`);
  }
}

async function afficherSynthese() {
  try {
    const res = await fetch(`${API}/api/synthese`);
    const s = await res.json();

    els.nombre.textContent = s.nombre;
    els.couts.textContent = s.totalCouts.toLocaleString('fr-FR');
    els.recettes.textContent = s.totalRecettes.toLocaleString('fr-FR');
    const beneficeEl = els.benefice;
    beneficeEl.textContent = s.benefice.toLocaleString('fr-FR');
    beneficeEl.className = 'stat-value ' + (s.benefice >= 0 ? 'benefice-positif' : 'benefice-negatif');

    // Par parcelle
    els.syntheseParcelle.innerHTML = '';
    for (const [p, info] of Object.entries(s.parParcelle)) {
      const row = document.createElement('div');
      row.className = 'synthese-row';
      row.innerHTML = `
        <span class="label">${p}</span>
        <span class="value">${info.nombre} op · ${info.couts.toLocaleString('fr-FR')} FCFA coûts · ${info.recettes.toLocaleString('fr-FR')} FCFA recettes · <span class="${info.benefice >= 0 ? 'benefice-positif' : 'benefice-negatif'}">${info.benefice.toLocaleString('fr-FR')} FCFA</span></span>
      `;
      els.syntheseParcelle.appendChild(row);
    }

    // Détails
    els.syntheseDetails.innerHTML = '';
    const details = [
      { label: 'Coût minimum', value: s.coutMinMax ? s.coutMinMax.min.toLocaleString('fr-FR') + ' FCFA' : '—' },
      { label: 'Coût maximum', value: s.coutMinMax ? s.coutMinMax.max.toLocaleString('fr-FR') + ' FCFA' : '—' },
      { label: 'Recettes minimum', value: s.recettesMinMax ? s.recettesMinMax.min.toLocaleString('fr-FR') + ' FCFA' : '—' },
      { label: 'Recettes maximum', value: s.recettesMinMax ? s.recettesMinMax.max.toLocaleString('fr-FR') + ' FCFA' : '—' },
      { label: 'Taux de rentabilité', value: s.tauxRentabilite !== null ? s.tauxRentabilite.toFixed(1) + '%' : '—' },
      { label: 'Parcelle la plus coûteuse', value: s.parcelleLaPlusCouteuse ? `${s.parcelleLaPlusCouteuse.parcelle} (${s.parcelleLaPlusCouteuse.total} FCFA)` : '—' },
      { label: 'Parcelle la plus rentable', value: s.parcelleLaPlusRentable ? `${s.parcelleLaPlusRentable.parcelle} (${s.parcelleLaPlusRentable.benefice} FCFA)` : '—' },
    ];
    for (const d of details) {
      const row = document.createElement('div');
      row.className = 'synthese-row';
      row.innerHTML = `<span class="label">${d.label}</span><span class="value">${d.value}</span>`;
      els.syntheseDetails.appendChild(row);
    }
  } catch (err) {
    console.error(err);
  }
}

async function handleSauvegarder() {
  try {
    const res = await fetch(`${API}/api/backup`, { method: 'POST' });
    const data = await res.json();
    alert(data.message || 'Sauvegarde créée');
  } catch (err) {
    alert(`Erreur: ${err.message}`);
  }
}

async function handleExporterCsv() {
  try {
    window.location.href = `${API}/api/export/csv`;
  } catch (err) {
    alert(`Erreur: ${err.message}`);
  }
}

async function handleListerSauvegardes() {
  els.importSection.style.display = els.importSection.style.display === 'none' ? 'block' : 'none';
  try {
    const res = await fetch(`${API}/api/backups`);
    const sauvegardes = await res.json();
    els.sauvegardesListe.innerHTML = '';
    if (sauvegardes.length === 0) {
      els.sauvegardesListe.innerHTML = '<p style="color:var(--text-muted)">Aucune sauvegarde disponible.</p>';
      return;
    }
    for (const nom of sauvegardes) {
      const item = document.createElement('div');
      item.className = 'sauvegarde-item';
      item.innerHTML = `
        <span>${nom}</span>
        <button class="btn-restore" onclick="restaurerSauvegarde('${nom}')">Restaurer</button>
      `;
      els.sauvegardesListe.appendChild(item);
    }
  } catch (err) {
    els.sauvegardesListe.innerHTML = `<p style="color:var(--danger)">Erreur: ${err.message}</p>`;
  }
}

async function handleImporter() {
  const chemin = els.inputImportChemin.value.trim();
  if (!chemin) {
    alert('Veuillez entrer un chemin de fichier');
    return;
  }
  try {
    const res = await fetch(`${API}/api/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chemin }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.erreur || 'Erreur import');
    alert(data.message);
    els.inputImportChemin.value = '';
    await chargerDonnees();
    await chargerFiltres();
    renderListe();
    afficherSynthese();
  } catch (err) {
    alert(`Erreur: ${err.message}`);
  }
}

window.restaurerSauvegarde = async function(nomFichier) {
  if (!confirm(`Restaurer la sauvegarde ${nomFichier} ? Les données actuelles seront remplacées.`)) return;
  try {
    const res = await fetch(`${API}/api/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nomFichier }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.erreur || 'Erreur restauration');
    alert(data.message);
    await chargerDonnees();
    await chargerFiltres();
    renderListe();
    afficherSynthese();
    handleListerSauvegardes();
  } catch (err) {
    alert(`Erreur: ${err.message}`);
  }
};

init();
