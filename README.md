# Arbre généalogique

Site statique (HTML/CSS/JS, rien à installer) hébergeable gratuitement sur GitHub Pages.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html`, `style.css` | la page et son apparence |
| `script.js` | affichage, fiches, recherche et filtres, vues, mini-carte, thème, export PDF |
| `tree-layout.js` | calcul de la disposition (un seul arbre, ancêtres des conjoints compris) |
| `editor.js` | formulaire d'ajout / modification, publication des changements |
| `extras.js` | onglets, **carte de la famille** et **statistiques** |
| `data.js` | **les données** : personnes et familles |
| `photos/` | les photos (`photos/nom-1.jpg`…) |
| `tools/` | scripts pour reconstruire `data.js` depuis un export GEDCOM |

## Mettre en ligne

1. Dépose tout le contenu de ce dossier à la racine du dépôt GitHub (*Add file → Upload files*).
2. *Settings → Pages → Branch : main / (root) → Save*.
3. Le site apparaît en une minute à `https://TON-PSEUDO.github.io/NOM-DU-DEPOT/`.

## Ce que fait le site

- **Un seul arbre** : les ancêtres d'un conjoint (par exemple Zélie Dacher, mère de Louis Bacquet) sont placés **au-dessus** de lui, à la même hauteur que les parents de son conjoint. Quand tu ajouteras la famille de ta mère, ses parents et grands-parents s'insèrent tout seuls au-dessus de Marie-France Hannier, sans arbre séparé.
- **Onglets** : *Arbre*, *Carte de la famille*, *Statistiques* (adresses `#carte` et `#stats`). La recherche et les fiches marchent depuis tous les onglets.
- **Carte de la famille** : tous les lieux de naissance (vert) et de décès (gris) sur une seule carte ; un lieu qui a les deux est en doré, et la taille du cercle = nombre de personnes. Clic sur un cercle : la liste des personnes (cliquables). Les **flèches** relient le lieu de naissance d'un parent à celui de son enfant (les déplacements d'une génération à l'autre ; plus le trait est épais, plus il y a de naissances concernées). Options : lieux de naissance / de décès, migrations parents → enfants, trajet d'une vie (naissance → décès, en pointillés), et un filtre « personnes nées entre… et… » pour voir l'évolution d'une époque à l'autre. La liste à gauche permet de zoomer sur un lieu. Les lieux qui ressemblent à une erreur de saisie (une année, une adresse) sont ignorés et signalés.
- **Statistiques** : anniversaires du jour et des 60 prochains jours (naissances, décès, mariages), chiffres clés, âge moyen / médian au décès, plus longue vie, répartition des âges au décès, espérance de vie selon l'époque, enfants par union, âge au premier enfant et au mariage, métiers, prénoms et noms les plus fréquents, mois de naissance, lieux les plus fréquents. Un clic sur un métier, un prénom ou un lieu lance la recherche dans l'arbre. Tout est recalculé à chaque modification.
- **Replier / déplier les branches** : chaque carte qui a des parents porte un petit bouton **−** en haut (replie ses ancêtres), et chaque union avec enfants un bouton **−** en dessous (replie la descendance). Une branche repliée devient un bouton **+N** (N = nombre de personnes masquées) ; un clic la redéplie. Le bandeau « N branches repliées » a un bouton *Tout déplier*. Les cartes glissent en douceur vers leur nouvelle place et l'état des branches repliées est mémorisé dans ton navigateur. Une personne trouvée par la recherche dans une branche repliée déplie automatiquement ce qui la cache.
- **Carte du lieu de naissance** : dans la fiche, une petite carte OpenStreetMap (Leaflet) avec un marqueur sur le lieu de naissance. Le lieu est cherché automatiquement (service Nominatim d'OpenStreetMap, résultat mémorisé dans le navigateur). Si un lieu est introuvable ou ambigu (vieux noms, homonymes), donne ses coordonnées dans `PLACES` à la fin de `data.js` (`"Talnoe, Russie": [48.88, 30.69]`, latitude puis longitude ; clic droit sur un point de Google Maps ou d'OpenStreetMap pour les lire), ou sur une personne : `birthCoords: [lat, lon]`. Les coordonnées de Talnoé sont approximatives : à vérifier.
- **Frise chronologique** : dans chaque fiche, la vie en ordre chronologique : naissance → mariages → naissance des enfants → décès (ou « aujourd'hui »), avec l'âge à chaque étape quand les dates le permettent. Les conjoints et enfants sont cliquables.
- **Vues** (menu en haut à gauche) : *Tout l'arbre*, *Descendance de…*, *Ascendance de…* (les ancêtres d'une personne) ou *Ascendance et descendance*. Les boutons « Sa descendance » / « Ses ancêtres » d'une fiche font pareil. L'adresse contient `#vue=…`, on peut la partager. Pour un gros arbre, c'est la vue *Ascendance de…* qui donne un bel arbre « pedigree » lisible.
- **Cartes** : dates précises (`30/06/1900 – 12/03/1992`, `~` = vers, `<` avant, `>` après), pastilles : ● vivant(e) / † décédé(e), 📍 lieu de naissance, 💼 métier (le survol donne le texte complet). Le bouton *Cartes compactes* réduit les cartes (années seulement) pour gagner de la place.
- **Mini-carte** en bas à droite dès que l'arbre dépasse l'écran : clic ou glisser pour se déplacer, bouton *Mini-carte* pour la masquer.
- **Mode sombre / clair** : bouton lune/soleil ; le choix est mémorisé, et le PDF est toujours imprimé en clair.
- **Recherche** : la barre accepte plusieurs mots (`boulanger elbeuf 1926`) et cherche dans les prénoms, noms de naissance et d'usage (donc les noms de jeune fille), métiers, lieux de naissance / décès / mariage, années et notes. Le bouton **Filtres** ajoute : nom, métier, lieu, années de naissance et de décès (de… à…), vivant(e)/décédé(e), sexe. Les résultats sont **surlignés dans l'arbre** (les autres sont estompés) ; *Effacer la recherche* remet tout.
- **Zoom** : − / +, *Tout voir*, Ctrl + molette ; glisser pour se déplacer.
- **Photos** : sur les cartes détaillées et en grand dans la fiche ; galerie pour les autres images.
- **Export PDF** : bouton *Exporter en PDF* → A4 ou A3 → « Enregistrer au format PDF ». La vue affichée (tout l'arbre ou une vue par personne) est mise à l'échelle de la page ; pour un gros arbre, choisir une vue plus petite.
- **Ajouter / modifier sans toucher au code** : *Ajouter une personne* (enfant, conjoint(e) ou parent de quelqu'un, ou sans lien), *Modifier la fiche* dans chaque fiche. **Les dates se saisissent en jour / mois / année**, avec une précision (exacte, vers, avant, après) ; une date déjà écrite en texte libre reste modifiable telle quelle. Une fiche « Inconnu(e) » se complète avec *Modifier la fiche*.

### Publier les modifications faites avec le formulaire

GitHub Pages ne peut pas écrire dans le dépôt : les modifications restent **dans ton navigateur** (bandeau jaune) tant qu'elles ne sont pas publiées.

1. *Publier mes modifications* → télécharge `data.js` (ou le `.zip` s'il y a de nouvelles photos).
2. Sur GitHub : *Add file → Upload files*, dépose `data.js` (et le dossier `photos` dézippé), *Commit changes*.
3. Une fois le site à jour, *Effacer le brouillon* (ou recharge : le brouillon identique à `data.js` disparaît seul).

## Reconstruire l'arbre depuis MyHeritage (GEDCOM)

MyHeritage → *Arbre → Exporter en GEDCOM*, puis, dans ce dossier :

```
python3 tools/gedcom_vers_data.py MON_ARBRE.ged
python3 tools/telecharger_photos.py
```

- `data.js` est régénéré (**écrase les modifications faites à la main** : à faire avant de modifier, ou refaire l'export).
- `tools/rapport_verification.txt` liste les incohérences repérées (année dans un champ lieu, parent plus jeune que son enfant…).
- **Les liens de photos MyHeritage expirent au bout d'environ une semaine.** Sans Python : ouvre `tools/photos_a_telecharger.html`, clic droit → « Enregistrer l'image sous… » dans `photos/` avec le nom indiqué.
- Le 1er fichier de chaque personne est son portrait recadré ; pour changer la photo principale, échange l'ordre dans le champ `photos` de `data.js`.

## Services externes utilisés par les fiches

Les cartes (fiche et carte de la famille) chargent **Leaflet** (cdnjs.cloudflare.com), les **tuiles OpenStreetMap** et interroge **Nominatim** ; elles ne s'activent qu'à l'ouverture d'une fiche qui a un lieu de naissance ou de l'onglet *Carte*. Les noms de lieux sont alors envoyés à OpenStreetMap (une requête par seconde au plus, résultats mémorisés). Hors connexion, la fiche s'affiche sans carte.

## Vie privée et dates des personnes vivantes

Le dépôt GitHub étant public, `data.js` l'est aussi. Par défaut (`hideLiving: true`), pour les personnes **vivantes** (sans date de décès et nées il y a moins de 105 ans) seule l'**année de naissance** est publiée, et le formulaire applique la même règle.

Pour publier **les dates complètes des vivants** (jour, mois, lieu de naissance) : remplace `data.js` par **`tools/data_avec_dates_vivants.js`** (renomme-le `data.js`). C'est ton choix : dans ce cas les dates de naissance de Georgette, Jean-Louis, Pierre, Marie-France, Mailyne et Timéo seront lisibles par tout le monde. Les adresses e-mail du GEDCOM ne sont jamais copiées.

Pour un arbre entièrement privé : dépôt privé (GitHub Pages privé : offre payante).

## Format de `data.js`

```js
PEOPLE   = { "louis_bacquet": { given, surname, marriedName, sex: "H"|"F"|"", birth, birthPlace, birthCoords: [lat, lon],
                                dead: true, death, deathPlace, deathCause, job, anecdote, note,
                                photo, photos: [...] }, ... }
PLACES   = { "Talnoe, Russie": [48.88, 30.69] }   // coordonnées des lieux, facultatif
FAMILIES = [ { id, husb, wife, children: ["id", ...], married: true, marriage: { date, place } }, ... ]
```

Une famille peut n'avoir qu'un seul parent. Une personne peut appartenir à plusieurs familles (remariages). Les dates sont du texte au format `"12 mars 1900"`, `"mars 1900"`, `"1900"`, `"vers 1840"` (préfixes `vers`, `avant`, `après`) ; d'autres formulations restent affichables mais ne sont pas triables.
