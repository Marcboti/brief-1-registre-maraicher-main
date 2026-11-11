// Synthèse des dépenses et recettes enregistrées.
// Fiche : fiches/5-synthese.md · Vérifier : npm run test:synthese

// Renvoie la somme des coûts, en FCFA. Liste vide : 0.
export function totalCouts(operations) {
  return operations.reduce((total, op) => total + op.coutFCFA, 0);
}

// Renvoie la somme des recettes, en FCFA. Liste vide : 0.
export function totalRecettes(operations) {
  return operations.reduce((total, op) => total + (op.recettesFCFA || 0), 0);
}

// Renvoie le bénéfice total (recettes - coûts), en FCFA. Liste vide : 0.
export function beneficeTotal(operations) {
  return totalRecettes(operations) - totalCouts(operations);
}

// Renvoie un objet : pour chaque parcelle, le nombre d'opérations et le total des coûts.
// Format rétrocompatible : { P1: { nombre: 4, total: 15500 } }.
// Liste vide : {} (un objet vide).
export function syntheseParParcelle(operations) {
  const objet = {};
  for (const operation of operations) {
    if (objet[operation.parcelle] === undefined) {
      objet[operation.parcelle] = { nombre: 0, total: 0 };
    }
    objet[operation.parcelle].nombre += 1;
    objet[operation.parcelle].total += operation.coutFCFA;
  }
  return objet;
}

// Renvoie un objet détaillé par parcelle : { nombre, couts, recettes, benefice }.
// Exemple : { P1: { nombre: 4, couts: 15500, recettes: 20000, benefice: 4500 } }.
// Liste vide : {} (un objet vide).
export function syntheseParParcelleDetaillee(operations) {
  const objet = {};
  for (const operation of operations) {
    if (objet[operation.parcelle] === undefined) {
      objet[operation.parcelle] = { nombre: 0, couts: 0, recettes: 0 };
    }
    objet[operation.parcelle].nombre += 1;
    objet[operation.parcelle].couts += operation.coutFCFA;
    objet[operation.parcelle].recettes += operation.recettesFCFA || 0;
  }
  for (const parcelle of Object.keys(objet)) {
    objet[parcelle].benefice = objet[parcelle].recettes - objet[parcelle].couts;
  }
  return objet;
}

// Renvoie { min, max } des coûts, ou null si la liste est vide.
// Exemple : { min: 1500, max: 8000 }
export function coutMinMax(operations) {
  if (operations.length === 0) {
    return null;
  }
  const couts = operations.map((op) => op.coutFCFA);
  return {
    min: Math.min(...couts),
    max: Math.max(...couts),
  };
}

// Renvoie { min, max } des recettes, ou null si la liste est vide.
export function recettesMinMax(operations) {
  if (operations.length === 0) {
    return null;
  }
  const recettes = operations.map((op) => op.recettesFCFA || 0);
  return {
    min: Math.min(...recettes),
    max: Math.max(...recettes),
  };
}

// Renvoie le taux de rentabilité global (bénéfice / recettes * 100), ou null si pas de recettes.
export function tauxRentabilite(operations) {
  const recettes = totalRecettes(operations);
  if (recettes === 0) {
    return null;
  }
  return ((beneficeTotal(operations) / recettes) * 100);
}

// Renvoie la parcelle la plus rentable : { parcelle, benefice, recettes, couts },
// ou null si le registre est vide. En cas d'égalité : la première rencontrée.
export function parcelleLaPlusRentable(operations) {
  if (operations.length === 0) {
    return null;
  }
  const synthese = syntheseParParcelleDetaillee(operations);
  let meilleure = null;
  let maxBenefice = -Infinity;
  for (const [parcelle, info] of Object.entries(synthese)) {
    if (info.benefice > maxBenefice) {
      maxBenefice = info.benefice;
      meilleure = { parcelle, benefice: info.benefice, recettes: info.recettes, couts: info.couts };
    }
  }
  return meilleure;
}

// Renvoie la parcelle dont le total des coûts est le plus élevé : { parcelle, total },
// ou null si le registre est vide. En cas d'égalité : la première parcelle rencontrée.
export function parcelleLaPlusCouteuse(operations) {
  if (operations.length === 0) {
    return null;
  }
  const synthese = syntheseParParcelle(operations);
  let couteuse = null;
  let maxTotal = -1;
  for (const [parcelle, info] of Object.entries(synthese)) {
    if (info.total > maxTotal) {
      maxTotal = info.total;
      couteuse = parcelle;
    }
  }
  return { parcelle: couteuse, total: maxTotal };
}
