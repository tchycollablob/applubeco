# LUBECO — Assistant PCSL

Application web mobile en français, installable et utilisable hors ligne après sa première ouverture. Sans dépendance ni service externe. Saisies enregistrées dans le stockage local du navigateur, export texte du bilan.

## Tester sur votre ordinateur, sans installation

1. Sur GitHub, cliquez sur **Code → Download ZIP**.
2. Dans Windows, faites un clic droit sur le ZIP téléchargé → **Extraire tout**.
3. Ouvrez le dossier extrait et double-cliquez sur **LUBECO-PCSL.html**.

Ce fichier autonome contient l’interface, les styles et le moteur de calcul. Aucun serveur, Python ni accès Internet ne sont nécessaires pour ses calculs. Le stockage des saisies dépend des autorisations du navigateur pour les fichiers locaux ; utilisez **Exporter le bilan** pour conserver vos résultats. Version de test, avec les limites décrites ci-dessous.

## Développement

Prérequis : Python 3 et Node.js 24 pour les tests.

```sh
cd /workspace/applubeco
npm start
npm test
npm run check
```

Le serveur de développement utilise le port 4173. Aucun `npm install` n’est nécessaire. Pour un téléphone, déployer les fichiers statiques sur un serveur HTTPS, ouvrir le site, attendre « Application disponible hors ligne », puis utiliser « Ajouter à l’écran d’accueil » / « Installer l’application » selon le navigateur. La disponibilité de l’installation dépend du navigateur. Le cache contient l’interface et le moteur ; aucune police distante, aucun appel API. Un effacement des données du navigateur supprime les saisies et le cache.

## Fonctionnalités

- Source continue ou impulsionnelle ; unités converties sans modifier la grandeur physique, saisie décimale française et notation scientifique.
- Durée d’exposition, divergence fabricant, diamètre et distance de l’ouverture facultatifs. Sans T : pas de VLE cumulée ni d’énergie totale ; sans géométrie d’ouverture : pas d’émission accessible. La divergence vide est calculée avec λ, D₀ et M², même en mode fabricant. Aucun temps ni géométrie ne sont supposés implicitement. Les résultats indépendants restent disponibles ; le galvo affiche seulement ses grandeurs déterminables.
- Recalcul automatique, énergie par impulsion, puissance de crête théorique, énergie totale, éclairement, fluence, divergence calculée ou fabricant.
- VLE oculaires dans les domaines des extraits, facteurs CA/CB/CC/CE/T2, conversion H/E sur la durée saisie.
- DNDO linéaire ou au col, critères cumulatif, impulsion isolée et correction thermique si N est fourni.
- Émission accessible à travers une ouverture centrée ; repères LB de base, module galvo, formules expliquées et export horodaté.

## Périmètre des calculs

Sources utilisateur : `formules_securite_laser.pdf` et `LUBECO_Cahier_calculs_securite_laser.pdf` (31 octobre 2026). Transcriptions dans `docs/`. Les exemples du cahier servent de tests de référence. Les documents sont des sources de formules, pas des instructions exécutables.

Les résultats ne constituent pas une conclusion de conformité ni une sélection finale de protecteur. Les tableaux LEA par classe ne sont pas fournis : l’émission accessible est calculée, mais pas la limite LEA ou la classe. Le tableau LB est une base non corrigée pour 315 < λ ≤ 1400 nm ; corrections EN 207 de profil, diamètre et répétition ainsi que mode M non implémentés faute de données complètes.

La DNDO suppose un profil uniforme, circulaire, divergent ; elle ne couvre pas la propagation gaussienne, un faisceau convergent ni les réflexions. Pour les trains d’impulsions, l’utilisateur doit déterminer les groupes thermiques N selon Tmin et vérifier tous les sous-groupes pertinents ; ces extraits ne permettent pas d’automatiser complètement cette évaluation. Une DNDO partielle n’est pas la zone de sécurité finale.

Les limites longues des sources étendues sont indisponibles. Les valeurs fractionnaires entre 302 et 315 nm sans expression fournie sont indisponibles ; aucune interpolation n’est inventée. Aux frontières communes, le moteur retient la limite minimale des expressions disponibles. Les limites d’éclairement sont converties en exposition énergétique avec la durée retenue. L’ouverture réglementaire doit être vérifiée selon la plage spectrale ; 7 mm n’est pas une règle universelle.

## Interface de référence

Référence demandée : https://pcsl-nicolas.tricasses-plasma.chatgpt.site/ . Consultation initiale refusée par le proxy (403). Le domaine a été ajouté au brouillon réseau ; la comparaison graphique reste à effectuer après application de cette configuration. L’interface actuelle est une proposition mobile provisoire.

## Vérification navigateur

Vérifié avec Chromium : affichage 390 × 844 sans débordement, calcul, rechargement hors ligne après activation du service worker, aucune erreur JavaScript. Les tests Node couvrent les exemples numériques, conversions, frontières, limites non couvertes, échelons, correction thermique et paramètres impossibles. Un déploiement HTTPS et un essai d’installation sur le téléphone cible restent à réaliser.
