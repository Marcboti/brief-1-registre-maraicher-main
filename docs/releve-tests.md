# Relevé des tests

| Action | Attendu | Obtenu | Testeur |
| --- | --- | --- | --- |
| Ajout valide O11 | Opération ajoutée, registre = 11 | OK | Moi |
| Ajout coût négatif | Coût invalide | OK | Moi |
| Recherche O99 | Opération O99 introuvable | OK | Moi |
| Tri par coût croissant | O05 (1500) en premier | OK | Moi |
| Synthèse | Total 40000, P1 4 opérations, parcelle la plus coûteuse P1 | OK | Moi |
| Choix inconnu (9) | Choix inconnu : retour au menu | OK | Moi |
| Supprimer O03 puis synthèse | O03 supprimée, registre = 9, P1 total mis à jour | OK | Moi |
| Ajout KOFFI (op. invalide) | Opération refusée : opération invalide | OK | Moi |
| Ajout DO12 (tout valide) | Opération ajoutée, registre = 12 | OK | Moi |
| Ajout 0001 (date 0, coût -2000) | 2 erreurs : date invalide, coût invalide | OK | Moi |
| Recherche culture gombo | 4 opérations (O02, O05, O08, O011) | OK | Moi |
| Synthèse après ajout | P1 4 opérations, P11 1, P3 la plus coûteuse | OK | Moi |
| Modifier O011 culture → gombo | Opération modifiée avec succès | OK | Moi |
| Tri par coût décroissant | O06 (8000) en premier | OK | Moi |
| Quitter (0) | Fermeture du registre, retour au prompt | OK | Moi |
| Modifier O11 culture → sorgho | Opération modifiée avec succès | OK | Tidiane Cheick SOUMAHORO (preuve dans fork sur GitHub)| |
| Lister (12 opérations) | O01…O11 + DO12 affichés | OK | Tidiane Cheick SOUMAHORO (preuve dans fork sur GitHub)||
| Recherche culture tomate | 3 opérations (O01,O06,O09) | OK | SENE Rodrigue (preuve dans fork sur GitHub)|