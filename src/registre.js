// Ajouter et lister les opérations.
// Fiche : fiches/3-ajouter-lister.md · Vérifier : npm run test:registre
import { estDateValide, versNombre } from './outils.js';
import { PARCELLES_REFERENCE } from './config.js';
import { syntheseParParcelleDetaillee } from './synthese.js';

// Liste fermée des opérations culturales acceptées, fournie par le coach agronomie.
export const OPERATIONS = ['semis', 'arrosage', 'désherbage', 'repiquage', 'récolte'];

// Format d'identifiant attendu : une lettre O suivie d'un ou plusieurs chiffres (ex. O01, O11).
export const ID_FORMAT = /^O\d+$/;

// Renvoie une ligne de texte qui décrit l'opération.
// Exemple : 'O03 | 2026-10-21 | P1 | tomate | arrosage | 2000 FCFA'
export function formaterOperation(operation) {
  const recettes = operation.recettesFCFA ? ` | recettes: ${operation.recettesFCFA} FCFA` : '';
  return `${operation.id} | ${operation.date} | ${operation.parcelle} | ${operation.culture} | ${operation.operation} | ${operation.coutFCFA} FCFA${recettes}`;
}

// Renvoie un texte avec une opération par ligne (lignes séparées par '\n'),
// ou 'Aucune opération enregistrée.' si la liste est vide.
export function listerOperations(operations) {
  if (operations.length === 0) {
    return 'Aucune opération enregistrée.';
  }
  return operations.map(formaterOperation).join('\n');
}

// Renvoie l'opération qui a cet identifiant, ou undefined si elle n'existe pas.
export function trouverParId(operations, id) {
  return operations.find((op) => op.id === id);
}

// Contrôle une saisie AVANT de l'ajouter. Tous les champs arrivent sous forme de TEXTE :
// { id: 'O11', date: '2026-10-27', parcelle: 'P1', culture: 'tomate', operation: 'récolte', coutFCFA: '2500', recettesFCFA: '3000' }
// Renvoie un tableau de messages d'erreur, un message par règle non respectée ;
// un tableau vide signifie « saisie valide ».
// Règles : id obligatoire, unique et au format O suivi de chiffres · date réelle au format AAAA-MM-JJ ·
// parcelle et culture obligatoires (n'importe quel texte non vide) · operation présente dans OPERATIONS ·
// coutFCFA nombre positif ou nul · recettesFCFA nombre positif ou nul (optionnel) ·
// cohérence parcelle/culture selon la référence.
export function verifierOperation(saisie, operations) {
  const erreurs = [];

  if (!saisie.id) {
    erreurs.push('Veuillez saisir un identifiant non vide.');
  } else if (!ID_FORMAT.test(saisie.id)) {
    erreurs.push(`Identifiant invalide : format attendu O suivi de chiffres (ex. O01), trouvé "${saisie.id}".`);
  } else if (operations.some((op) => op.id === saisie.id)) {
    erreurs.push('Cet identifiant est déjà utilisé.');
  }

  if (!estDateValide(saisie.date)) {
    erreurs.push('Date invalide : format AAAA-MM-JJ attendu.');
  }

  if (!saisie.parcelle || !saisie.parcelle.trim()) {
    erreurs.push('Veuillez renseigner la parcelle.');
  }
  if (!saisie.culture || !saisie.culture.trim()) {
    erreurs.push('Veuillez renseigner la culture.');
  }

  if (!OPERATIONS.includes(saisie.operation)) {
    erreurs.push('Opération invalide. Entrez une opération de la liste fermée : semis, arrosage, désherbage, repiquage, récolte');
  }

  const cout = versNombre(saisie.coutFCFA);
  if (Number.isNaN(cout) || cout < 0) {
    erreurs.push('Le coût doit être un nombre positif ou nul en FCFA.');
  }

  const recettes = saisie.recettesFCFA === undefined || saisie.recettesFCFA === '' ? 0 : versNombre(saisie.recettesFCFA);
  if (saisie.recettesFCFA !== undefined && saisie.recettesFCFA !== '' && (Number.isNaN(recettes) || recettes < 0)) {
    erreurs.push('Les recettes doivent être un nombre positif ou nul en FCFA.');
  }

  // Cohérence parcelle / culture selon la référence
  const parcelle = (saisie.parcelle || '').trim().toUpperCase();
  const culture = (saisie.culture || '').trim().toLowerCase();
  if (parcelle && culture && PARCELLES_REFERENCE[parcelle]) {
    const autorisees = PARCELLES_REFERENCE[parcelle].map((c) => c.toLowerCase());
    if (!autorisees.includes(culture)) {
      erreurs.push(`La culture "${culture}" n'est pas autorisée sur la parcelle ${parcelle}. Cultures autorisées : ${PARCELLES_REFERENCE[parcelle].join(', ')}.`);
    }
  }

  return erreurs;
}

// Fabrique l'opération à enregistrer à partir d'une saisie VALIDE : coutFCFA et recettesFCFA deviennent des nombres.
export function creerOperation(saisie) {
  const operation = {
    id: saisie.id,
    date: saisie.date,
    parcelle: saisie.parcelle,
    culture: saisie.culture,
    operation: saisie.operation,
    coutFCFA: versNombre(saisie.coutFCFA),
  };
  const recettes = saisie.recettesFCFA === undefined || saisie.recettesFCFA === '' ? 0 : versNombre(saisie.recettesFCFA);
  if (recettes > 0) {
    operation.recettesFCFA = recettes;
  }
  return operation;
}

// Ajoute la saisie au registre si elle est valide (verifierOperation, puis creerOperation).
// Renvoie les erreurs : [] si l'opération a été ajoutée ; sinon les messages, et rien n'est ajouté.
export function ajouterOperation(operations, saisie) {
  const erreurs = verifierOperation(saisie, operations);
  if (erreurs.length > 0) {
    return erreurs;
  }
  operations.push(creerOperation(saisie));
  return [];
}

// Calcule le bénéfice total (recettes - coûts) d'un registre.
export function beneficeTotal(operations) {
  const recettes = operations.reduce((total, op) => total + (op.recettesFCFA || 0), 0);
  const couts = operations.reduce((total, op) => total + op.coutFCFA, 0);
  return recettes - couts;
}

// Calcule le bénéfice par parcelle : { parcelle: { recettes, couts, benefice } }.
export function beneficeParParcelle(operations) {
  const detaillee = syntheseParParcelleDetaillee(operations);
  const resultat = {};
  for (const [parcelle, info] of Object.entries(detaillee)) {
    resultat[parcelle] = { recettes: info.recettes, couts: info.couts, benefice: info.benefice };
  }
  return resultat;
}
