// Sauvegarde, export et import — dépasse la limite "stockage local JSON seule".
import { readFile, writeFile, readdir, stat, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const DOSSIER_SAUVEGARDES = 'sauvegardes';

// Exporte le registre vers un fichier JSON horodaté dans le dossier sauvegardes/.
export async function exporterJson(operations, dossier = DOSSIER_SAUVEGARDES) {
  const maintenant = new Date();
  const horodatage = maintenant.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const nomFichier = `operations-${horodatage}.json`;
  const chemin = join(dossier, nomFichier);

  await mkdir(dossier, { recursive: true });

  const donnees = JSON.stringify(operations, null, 2);
  await writeFile(chemin, donnees, 'utf-8');
  return chemin;
}

// Importe un registre depuis un fichier JSON. Renvoie le tableau d'opérations.
export async function importerJson(chemin) {
  const texte = await readFile(chemin, 'utf-8');
  const donnees = JSON.parse(texte);
  if (!Array.isArray(donnees)) {
    throw new Error('Le fichier importé ne contient pas un tableau d\'opérations.');
  }
  return donnees;
}

// Exporte le registre vers un fichier CSV (compatible Excel/Calc).
export async function exporterCsv(operations, chemin = 'operations-export.csv') {
  const lignes = ['id,date,parcelle,culture,operation,coutFCFA,recettesFCFA'];
  for (const op of operations) {
    lignes.push([
      op.id,
      op.date,
      op.parcelle,
      op.culture,
      op.operation,
      op.coutFCFA,
      op.recettesFCFA || 0,
    ].join(','));
  }
  await writeFile(chemin, lignes.join('\n'), 'utf-8');
  return chemin;
}

// Liste les fichiers de sauvegarde disponibles (plus récents d'abord).
export async function listerSauvegardes(dossier = DOSSIER_SAUVEGARDES) {
  try {
    const fichiers = await readdir(dossier);
    return fichiers
      .filter((f) => f.endsWith('.json'))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

// Restaure une sauvegarde : lit le fichier et renvoie les données.
export async function restaurerSauvegarde(nomFichier, dossier = DOSSIER_SAUVEGARDES) {
  const chemin = join(dossier, nomFichier);
  return await importerJson(chemin);
}
