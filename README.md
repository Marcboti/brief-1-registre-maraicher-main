
```md
# Registre des opérations maraîchères

> Projet individuel du SAS DFS, brief 1 (sujet : [SUJET.md](SUJET.md)).
```
## Contexte

Cet outil s'adresse à une maraîchère qui souhaite suivre ses opérations culturales (semis, arrosage, désherbage, repiquage, récolte) sur plusieurs parcelles. Elle saisit l'identifiant, la date, la parcelle, la culture, l'opération et le coût. Le programme enregistre ces données dans un fichier JSON, les liste, les recherche et les trie, puis calcule des synthèses (total, par parcelle, min/max). L'outil ne calcule pas la rentabilité : il enregistre des dépenses, pas des revenus.

## Prérequis et lancement

```bash
git clone https://github.com/Marcboti/brief-1-registre-maraicher.git
cd brief-1-registre-maraicher
node app.js
npm test
```

Sous PowerShell, si `npm` est bloqué : `npm.cmd test`.

## Structure du registre

```
app.js (menu)
├── saisie.js      → entrée utilisateur
├── stockage.js    → chargerJson / enregistrerJson
├── registre.js    → ajouter, lister, trouver, vérifier, créer
├── recherche.js   → filtrer, trier
├── synthese.js    → total, par parcelle, min/max
└── bonus.js       → supprimer, modifier, trier décroissant, parcelle la plus coûteuse
    └── stockage.js → donnees/operations.json
```

## Fonctionnalités

| | Fonctionnalité | Description |
|---|---|---|
| ✅ | **Ajouter** | Saisie normalisée, validation avant enregistrement, sauvegarde JSON |
| ✅ | **Lister** | Une opération par ligne, message si registre vide |
| ✅ | **Rechercher** | Par identifiant, par parcelle, filtrer par culture |
| ✅ | **Trier** | Par coût croissant, décroissant, par date |
| ✅ | **Synthèse** | Total, nombre et total par parcelle, min/max, parcelle la plus coûteuse |
| ✅ | **Bonus** | Supprimer, modifier, tri décroissant, parcelle la plus coûteuse |
| ✅ | **Persistance** | Enregistrer JSON après chaque ajout/suppression/modification |

## Données

Fichier : `donnees/operations.json`

| Champ | Signification | Exemple |
|---|---|---|
| `id` | Identifiant unique | `O03` |
| `date` | Date (AAAA-MM-JJ) | `2026-10-21` |
| `parcelle` | Parcelle concernée | `P1` |
| `culture` | Culture de la parcelle | `tomate` |
| `operation` | Type d'opération | `arrosage` |
| `coutFCFA` | Dépense en FCFA | `2000` |

## Limites

| | Limite | Explication |
|---|---|---|
| ⚠️ | Dépenses uniquement | Le registre ne mesure pas la rentabilité (pas de revenus) |
| ⚠️ | Pas de cohérence parcelle/culture | Le registre ne vérifie pas que la culture correspond à la parcelle |
| ⚠️ | Pas de format d'id | N'importe quel texte non vide est accepté (ex. "KOFFI") |
| ⚠️ | Stockage local | Données dans un fichier JSON, pas de cloud ni de sauvegarde automatique |

## Documents

[Dictionnaire des données](docs/dictionnaire-donnees.md) · [Tâches](docs/taches.md) · [Relevé des tests](docs/releve-tests.md) · [Journal de recherche](docs/journal-recherche.md) · [Fiche agronomique](docs/fiche-agronomique.md) · [Fiche individuelle](docs/fiche-individuelle.md) · [Présentation](presentation.html) [Presentation (presentation.html)]
## Auteur

Prénom et nom : Bi Boti Jules Marc ZAMBLE | Compte GitHub : https://github.com/Marcboti.
```
Entraide : Cheick Tidiane SOUMAHORO | Objet : Explication des fonctions tableaux (find, filter), fonctions asynchrone (async, await) et opérateur ternaire (condition ? expressionSiVrai : expressionSiFaux) | compte GitHub : https://github.com/Chiki86
