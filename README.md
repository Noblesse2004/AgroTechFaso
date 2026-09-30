# AgroTech Faso — site vitrine

Page unique, statique, en français. Présente le capteur d'humidité du sol aux
producteurs et le projet aux investisseurs, sur une seule adresse.

Aucun serveur, aucun outil de construction, aucune dépendance. Ouvrir
`index.html` dans un navigateur suffit pour voir le site tel qu'il sera en ligne.

## Mise en ligne

Déposer le contenu de ce dossier à la racine du domaine, en veillant à ce que
`index.html` soit servi à la racine. Aucun build, aucune configuration.

C'est un site volontairement sans outillage : pas de `package.json`, pas de
bundler. Le HTML fait 74 Ko, le CSS 53 Ko, le JS 15 Ko. Ajouter une chaîne de
construction pour cela coûterait plus qu'elle ne Rapporterait.

## Avant la mise en ligne

Chercher `PLACEHOLDER` dans `index.html` : six marqueurs, un par sujet.

| Sujet | Valeur actuelle | Où |
|---|---|---|
| Téléphone | `+226 52 61 68 67` | 4 liens `tel:`, 2 liens `wa.me`, 4 affichages, JSON-LD |
| Adresse | Avenue de la Nation, Bobo-Dioulasso | section contact |
| Réseaux | `facebook.com/agrotechfaso`, `instagram.com/agrotechfaso` | section contact |
| Vidéo | `data-video=""` | bouton `#video-cadre` |
| Équipe | 3 monogrammes, noms, fonctions, parcours | section équipe |
| Chiffres | prix, ROI, levée, volumes, répartition des fonds | section investisseurs |

Le numéro se termine par quatre zéros : il n'appartient à personne, il ne sonne
chez personne. Les liens WhatsPoint et téléphone sont de vrais liens, mais
inoffensifs tant qu'ils ne sont pas remplacés.

Les chiffres sont des hypothèses de travail. La section qui les présente le dit
explicitement au visiteur, mais ce sont des engagements financiers : ils
doivent être validés par l'équipe avant diffusion, pas seulement avant qu'ils
plaisent.

## Structure

```
index.html              la page entière
favicon.svg             icône de onglet
assets/css/main.css     une feuille, 20 sections numérotées
assets/js/main.js       7 comportements, sans dépendance
assets/fonts/           Fraunces (titres) et Archivo (texte), sous-ensemble latin
assets/img/             logos, aperçu social
```

`assets/img/` contient des variantes qui ne sont pas toutes référencées par la
page : `logo-dark.svg`, `logo-mark-dark.svg` et `logo-source.svg` servent aux
fonds sombres et à l'impression, `apercu-partage.svg` est la version vectorielle
de l'aperçu social. À garder pour la coherence de la marque.

## Couleurs

Tout part de ces jetons, en tête de `main.css`.

| Rôle | Jeton | Valeur |
|---|---|---|
| Vert principal | `--vert` | `#2e6b3a` |
| Vert clair | `--vert-clair` | `#74b37f` |
| Vert foncé, fond de section | `--vert-fonce` | `#122e1a` |
| Vert nuit, pied de page | `--vert-nuit` | `#0c2113` |
| Terracotta | `--terracotta` | `#b5542c` |
| Terracotta claire, sur fond sombre | `--terracotta-clair` | `#d9773f` |
| Terracotta encre, surtitre sur fond clair | `--terracotta-encre` | `#9c4522` |
| Crème, section alternée | `--creme` | `#f4ecdd` |
| Papier, fond de page | `--papier` | `#fbf8f2` |
| Encre | `--encre` | `#263238` |
| Texte secondaire | `--encre-douce` | `#55605f` |

Trois terracottas, pas un : `#d9773f` n'atteint que 2,97:1 sur fond clair, assez
peu pour du texte. Elle est réservée aux fonds sombres. Sur fond clair, les
surtitres prennent `#9c4522` (5,44:1). C'est ce que mesure le contrôle de
contraste.

## Ce que la page refuse de faire

Ces règles viennent de la charte, pas d'un goût personnel. Les scripts de
vérification les contrôlent à chaque passage.

- aucun dégradé, aucun flou, aucun effet de verre
- aucune ombre portée multiple, aucune lueur
- pas de bordure gauche colorée
- pas d'emoji, pas de Lorem ipsum
- pas de style en ligne
- pas de police distante : les deux polices sont dans `assets/fonts/`
- pas d'animation imposée : le mouvement est une préférence, pas un décor

## Choix techniques

**La vidéo ne charge rien avant le clic.** Le bouton `#video-cadre` porte un
`data-video` vide. Au clic, le script insère un `iframe` vers
`youtube-nocookie.com`. Tant que l'identifiant est vide, un clic affiche un
message de repli. Aucune requête ne part vers un tiers tant que le visiteur
n'a pas demandé la vidéo.

**Le formulaire n'envoie rien nulle part.** Il vérifie les champs dans le
navigateur, affiche un récapitulatif, puis construit un lien `mailto:` que le
visiteur envoie lui-même. Pour enregistrer vraiment les demandes, brancher un
service de formulaire côté serveur et remplacer `construireLienMessagerie()`
dans `main.js` par l'appel à ce service.

**Le contenu reste visible sans JavaScript.** Le script ajoute la classe `js`
sur la racine avant le chargement de la feuille ; le CSS n'y cache les blocs
d'apparition que si cette classe est présente *et* si le visiteur accepte le
mouvement. Script bloqué, page complète. Mouvement refusé, page complète aussi.

**L'accordéon FAQ reste natif.** Le balisage utilise `<details>`. Le script
ajoute seulement l'exclusivité : ouvrir une question referme les autres.

## Mouvement

Les illustrations du capteur bougent. Le principe : montrer que la mesure est
vivante. Une zone qui balaie, une courbe qui se trace, une impulsion qui descend
la tige, de l'eau qui circule dans le canal. Rien de décoratif — chaque
animation décrit un geste que le capteur fait réellement.

| Où | Ce qui se passe | Durée |
|---|---|---|
| Hero | les trois arcs partent l'un après l'autre, l'eau du canal défile | 3,4 s en boucle |
| Étape 1 | la zone de mesure balaie, une impulsion part de la pointe | 18 s / 4,2 s |
| Étape 2 | la courbe se trace, puis l'écran s'allume, la notification SMS descend, le téléphone vibre | ~2,6 s, une fois |
| Étape 3 | l'eau descend à la zone, les racines courent la rejoindre | ~1,6 s, une fois |
| Schéma | l'impulsion parcourt la tige vers la zone de mesure | 2,6 s en boucle |
| Vidéo | le bouton de lecture respire, les arcs émettent au survol | 4,2 s / 1,5 s |
| Investisseurs | les barres de répartition se remplissent à l'échelle | ~1,3 s, une fois |

Au survol, chaque figure répond : la zone accélère, la courbe se rejoue, les
arcs s'épaississent. Survoler la maquette de téléphone rejoue l'arrivée de
l'alerte, vibration comprise. Rien ne clignote, rien ne saute.

**Rien ne tourne si le visiteur ne le veut pas.** Toutes les animations sont
dans un bloc `prefers-reduced-motion: no-preference`. Avec le mouvement réduit,
la page affiche les mêmes dessins, complets et immobiles.

**Sans JavaScript, la page est complète.** L'état de repos est écrit dans les
règles de base, jamais dans une image clé. Le masquage du reveal exige trois
choses réunies — script actif, mouvement accepté, bloc visible — dans le même
bloc CSS, pour que la règle qui masque ne puisse pas l'emporter sur celle qui
défait le masque.

Deux détails de fabrication qui méritent d'être notés :

- Les arcs et les courbes portent `pathLength="1"`. La longueur du tracé est
  alors normalisée à 1, et l'animation va de 1 à 0 sans qu'il faille mesurer
  une courbe à la main.
- Un `<rect opacity="0">` dormait dans le schéma du capteur sans jamais rien
  faire. Il sert maintenant de tête de lecture pour l'impulsion qui descend la
  tige.

## L'alerte SMS

L'étape 2 montre un seul téléphone, et non deux objets côte à côte. La coque,
l'encoche, la barre d'état et la barre d'accueil sont dessinées en CSS ; le
texte de la notification est du vrai texte HTML, lisible par un lecteur d'écran
et traduisible.

Un seul appareil rend compte de ce que dit la page : l'application montre la
courbe et la décision, la notification montre le canal principal. Les deux se
superposent sur le même écran, dans l'ordre où elles arrivent.

La notification entre par le haut de l'écran et s'y pose. Le dépassement de 8 %
à mi-parcours donne l'élasticité d'un système d'exploitation. La vibration dure 540 ms et trois oscillations : au-delà, elle agace. L'écran
s'allume 120 ms avant, pour que la notification arrive sur un écran déjà
allumé, comme sur un vrai téléphone.

Le débordement `hidden` sur l'écran est ce qui rend l'entrée possible : sans
lui, la notification se déplacerait dans le vide au-dessus de la coque au lieu
de glisser derrière le bord.

## Le pied de page

La grille déclarait trois colonnes alors qu'elle ne contenait que deux
enfants. Les trois listes s'empilaient donc dans la deuxième, et la troisième
restait vide.

La correction est une réorganisation, pas un réglage. L'identité et le contact
vont à gauche — le téléphone en gros, parce que c'est le seul contact du pied
de page qu'on utilise depuis le terrain. La navigation part à droite, sur deux
colonnes de quatre liens au lieu d'une liste de neuf. Elle se parcourt en
diagonale, et la ligne est occupée sur toute sa largeur.

## Vérifications passées

Ces contrôles tournent hors navigateur, à partir des fichiers. Ils vérifient ce
qui est vérifiable sans un écran ; la mise en page reste à confirmer à l'œil.

| Contrôle | Résultat |
|---|---|
| Contraste WCAG 2.2, 16 paires réellement employées | toutes conformes |
| Textes alternatifs, `aria-*`, `h1` unique, sauts de titre | aucun problème |
| Étiquettes de formulaire, `caption` et `scope` des tableaux | conformes |
| Cibles tactiles ≥ 44 px | aucune trop petite |
| Interdits de la charte (9 motifs) | aucun |
| Règles CSS orphelines, classes sans style | aucune |
| Débordement horizontal à 360, 768, 1440 px | aucun |
| Syntaxe JavaScript | valide |
| Animations réellement en cours | 12 cibles, horloge pilotée |
| Séquences au défilement | les 4 se déclenchent |
| Mouvement réduit | 0 animation, 0 bloc invisible, dessins complets |

Le test de débordement mérite une précision : injecter un débordement volontaire
de 500 px ne change pas la largeur d'une capture headless. Une capture ne prouve
donc rien sur ce point. La mesure retenue lit `scrollWidth` et `clientWidth`
depuis la page, et les compare.

Le test d'animation mérite la même prudence. En mode headless sans rendu,
l'horloge d'animation reste figée : lire une propriété à deux instants rendrait
la même valeur, que l'animation avance ou non. Les contrôles pilotent donc
l'horloge à la main avec `currentTime` et vérifient que la propriété change
vraiment entre le début et la fin.

## Limites de la vérification

**La mise en page n'a pas été vue.** Les captures ont été analysées par le code
— débordement, densité, niveaux de gris, positions — mais personne n'a regardé
l'image. L'espacement, la hiérarchie visuelle, l'équilibre des sections et le
rendu des animations en mouvement restent à confirmer. C'est la première chose
à faire.

**Le rendu n'a été testé que dans Chromium.** Safari et Firefox n'ont pas été
éprouvés. `IntersectionObserver`, `transform-box: fill-box`, `pathLength` et
`currentTime` sont largement pris en charge, mais `transform-box` sur un
élément SVG mérite d'un coup d'œil, et le pied de page et le menu sur un
téléphone réel.

**Les chiffres ne sont pas vérifiés.** Ils sont cohérents d'un bout à l'autre
de la page, ce qui n'est pas la même chose qu'être exacts.

## Corriger la feuille

Les scripts de vérification vivent dans un dossier temporaire, hors du site :
ils ne font pas partie de la livraison. Les refaire Demandera de les recréer.

Le fichier le plus fragile est `main.css`. La section 12 a longtemps porté un
jeu de règles concurrentes pour la frise, hérité d'un composant remplacé par
l'étape ; la section 18.4 porte la version vivante. Le code mort a été retiré,
et un contrôle compare désormais le CSS au balisage dans les deux sens.

Il faut faire attention à cet endroit précis : les noms `.frise` et `.phase`
désignent la répartition des fonds des investisseurs, et rien d'autre. Le
diagramme des trois étapes utilise `.etape`. Si un jour les deux existent à
nouveau, leur donner des noms distincts tout de suite — c'est exactement la
collision qui avait passé inaperçue ici.
