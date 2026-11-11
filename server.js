import express from 'express';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  chargerJson, enregistrerJson,
} from './src/stockage.js';
import {
  ajouterOperation, verifierOperation, trouverParId, listerOperations,
  beneficeTotal, beneficeParParcelle,
} from './src/registre.js';
import {
  filtrerParCulture, filtrerParParcelle, trierParCout, trierParDate,
} from './src/recherche.js';
import {
  modifierOperation, supprimerOperation, trierParCoutDecroissant,
} from './src/bonus.js';
import {
  totalCouts, totalRecettes, beneficeTotal as syntheseBenefice,
  tauxRentabilite, parcelleLaPlusRentable, parcelleLaPlusCouteuse,
  recettesMinMax, syntheseParParcelleDetaillee,
} from './src/synthese.js';
import {
  exporterJson, importerJson, exporterCsv, listerSauvegardes, restaurerSauvegarde,
} from './src/backup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const FICHIER_DONNEES = 'donnees/operations.json';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API: Liste des opérations (avec filtres optionnels) ---
app.get('/api/operations', async (_req, res) => {
  try {
    const operations = await chargerJson(FICHIER_DONNEES);
    const { parcelle, culture, tri } = _req.query;

    let resultat = [...operations];
    if (parcelle) resultat = filtrerParParcelle(resultat, parcelle);
    if (culture) resultat = filtrerParCulture(resultat, culture);
    if (tri === 'cout') resultat = trierParCout(resultat);
    else if (tri === 'cout-desc') resultat = trierParCoutDecroissant(resultat);
    else if (tri === 'date') resultat = trierParDate(resultat);

    res.json(resultat);
  } catch (e) {
    res.status(500).json({ erreur: e.message });
  }
});

// --- API: Ajouter une opération ---
app.post('/api/operations', async (req, res) => {
  try {
    const operations = await chargerJson(FICHIER_DONNEES);
    const erreurs = ajouterOperation(operations, req.body);
    if (erreurs.length > 0) {
      return res.status(400).json({ erreurs });
    }
    await enregistrerJson(FICHIER_DONNEES, operations);
    res.status(201).json({ message: 'Opération ajoutée', id: req.body.id });
  } catch (e) {
    res.status(500).json({ erreur: e.message });
  }
});

// --- API: Récupérer une opération par ID ---
app.get('/api/operations/:id', async (req, res) => {
  try {
    const operations = await chargerJson(FICHIER_DONNEES);
    const op = trouverParId(operations, req.params.id.toUpperCase());
    if (!op) return res.status(404).json({ erreur: 'Opération introuvable' });
    res.json(op);
  } catch (e) {
    res.status(500).json({ erreur: e.message });
  }
});

// --- API: Modifier une opération ---
app.put('/api/operations/:id', async (req, res) => {
  try {
    const operations = await chargerJson(FICHIER_DONNEES);
    const { champ, valeur } = req.body;
    const erreurs = modifierOperation(operations, req.params.id.toUpperCase(), champ, valeur);
    if (erreurs.length > 0) {
      return res.status(400).json({ erreurs });
    }
    await enregistrerJson(FICHIER_DONNEES, operations);
    res.json({ message: 'Opération modifiée' });
  } catch (e) {
    res.status(500).json({ erreur: e.message });
  }
});

// --- API: Supprimer une opération ---
app.delete('/api/operations/:id', async (req, res) => {
  try {
    const operations = await chargerJson(FICHIER_DONNEES);
    const supprimee = supprimerOperation(operations, req.params.id.toUpperCase());
    if (!supprimee) return res.status(404).json({ erreur: 'Opération introuvable' });
    await enregistrerJson(FICHIER_DONNEES, operations);
    res.json({ message: 'Opération supprimée', id: supprimee.id });
  } catch (e) {
    res.status(500).json({ erreur: e.message });
  }
});

// --- API: Synthèse ---
app.get('/api/synthese', async (_req, res) => {
  try {
    const operations = await chargerJson(FICHIER_DONNEES);
    const synthese = {
      nombre: operations.length,
      totalCouts: totalCouts(operations),
      totalRecettes: totalRecettes(operations),
      benefice: syntheseBenefice(operations),
      tauxRentabilite: tauxRentabilite(operations),
      parParcelle: syntheseParParcelleDetaillee(operations),
      coutMinMax: totalCouts(operations) > 0 ? { min: Math.min(...operations.map(o => o.coutFCFA)), max: Math.max(...operations.map(o => o.coutFCFA)) } : null,
      recettesMinMax: totalRecettes(operations) > 0 ? { min: Math.min(...operations.map(o => o.recettesFCFA || 0)), max: Math.max(...operations.map(o => o.recettesFCFA || 0)) } : null,
      parcelleLaPlusCouteuse: parcelleLaPlusCouteuse(operations),
      parcelleLaPlusRentable: parcelleLaPlusRentable(operations),
    };
    res.json(synthese);
  } catch (e) {
    res.status(500).json({ erreur: e.message });
  }
});

// --- API: Sauvegarde ---
app.post('/api/backup', async (_req, res) => {
  try {
    const operations = await chargerJson(FICHIER_DONNEES);
    const chemin = await exporterJson(operations);
    res.json({ message: 'Sauvegarde créée', chemin });
  } catch (e) {
    res.status(500).json({ erreur: e.message });
  }
});

app.get('/api/backups', async (_req, res) => {
  try {
    const sauvegardes = await listerSauvegardes();
    res.json(sauvegardes);
  } catch (e) {
    res.status(500).json({ erreur: e.message });
  }
});

app.post('/api/restore', async (req, res) => {
  try {
    const { nomFichier } = req.body;
    const restaurees = await restaurerSauvegarde(nomFichier);
    const operations = await chargerJson(FICHIER_DONNEES);
    operations.length = 0;
    operations.push(...restaurees);
    await enregistrerJson(FICHIER_DONNEES, operations);
    res.json({ message: `${restaurees.length} opération(s) restaurée(s)` });
  } catch (e) {
    res.status(500).json({ erreur: e.message });
  }
});

// --- API: Export CSV ---
app.get('/api/export/csv', async (_req, res) => {
  try {
    const operations = await chargerJson(FICHIER_DONNEES);
    const chemin = await exporterCsv(operations);
    res.download(chemin);
  } catch (e) {
    res.status(500).json({ erreur: e.message });
  }
});

// --- API: Import JSON ---
app.post('/api/import', async (req, res) => {
  try {
    const { chemin } = req.body;
    const importees = await importerJson(chemin);
    const operations = await chargerJson(FICHIER_DONNEES);
    operations.length = 0;
    operations.push(...importees);
    await enregistrerJson(FICHIER_DONNEES, operations);
    res.json({ message: `${importees.length} opération(s) importée(s)` });
  } catch (e) {
    res.status(500).json({ erreur: e.message });
  }
});

// Route SPA fallback : toute route non-API renvoie index.html
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
