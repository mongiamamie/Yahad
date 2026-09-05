# Affiches לעילוי נשמת

Écran mémorial pour salle communautaire : affiches de yahrzeit, horaires
halachiques, et mise en avant des défunts de la semaine.

Publié par GitHub Pages, mis en réserve hors ligne par un Service Worker.

---

## Les fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | L'écran. C'est la page à afficher. |
| `saisie.html` | Le formulaire de saisie de la liste. |
| `defunts.xlsx` | La liste. **C'est le seul fichier à remplacer d'ordinaire.** |
| `sw.js` | Le cache hors ligne. N'y touchez pas. |

---

## Mise en service, une fois pour toutes

### 1. Publier le dépôt

1. Sur **github.com**, **New repository**. Un nom quelconque — `affiches` —
   laissé en **public**, puis **Create**.
2. **Add file**, **Upload files**, déposez les quatre fichiers ci-dessus,
   **Commit changes**.
3. Onglet **Settings**, rubrique **Pages**. Sous *Source*, choisissez
   **Deploy from a branch**, branche `main`, dossier `/ (root)`, **Save**.
4. Patientez une minute. L'adresse s'affiche en haut de la page :

```
https://VOTRECOMPTE.github.io/affiches/
```

Ouvrez-la dans un navigateur : l'écran doit s'afficher avec votre liste.

### 2. Régler le boîtier Android

Installez **Fully Kiosk Browser & Lockdown** depuis le Play Store, puis :

| Rubrique | Réglage | Valeur |
|---|---|---|
| Web Content | Start URL | `https://VOTRECOMPTE.github.io/affiches/` |
| Web Content | Enable Service Workers | activé |
| Device Management | Keep Screen On | activé |
| Device Management | Launch on Boot | activé |
| Device Management | Screensaver Timer | désactivé |
| Kiosk Mode | Enable Kiosk Mode | activé |
| Kiosk Mode | Kiosk PIN | choisissez-en un, et notez-le |

**Le premier démarrage exige internet.** L'application se met alors en réserve
et fonctionne ensuite sans réseau.

---

## Mettre la liste à jour

1. Ouvrez `https://VOTRECOMPTE.github.io/affiches/saisie.html` — depuis
   n'importe quel appareil, votre téléphone compris.
2. **Actions**, **Importer un Excel**, prenez votre `defunts.xlsx`.
3. Corrigez. La colonne Contrôle signale les erreurs et les doublons ; les deux
   dates sont liées, modifier l'une remplit l'autre.
4. **Actions**, **Enregistrer l'Excel**.
5. Sur GitHub, ouvrez `defunts.xlsx`, bouton **Upload files**, déposez le
   nouveau fichier avec le même nom, **Commit changes**.

L'écran le reprend au démarrage suivant, ou dès que le réseau revient. Rien à
recopier, rien à rebrancher.

> GitHub sert ses fichiers par un réseau de cache : comptez jusqu'à cinq
> minutes entre votre envoi et sa prise en compte.

---

## Comment le hors ligne fonctionne

Deux stratégies opposées, parce que les besoins le sont :

**L'application** est servie par le cache d'abord, et mise à jour en arrière-plan.
L'écran démarre instantanément, même sans réseau, et prend la nouvelle version au
chargement suivant.

**La liste** est cherchée sur le réseau d'abord, avec un repli sur la dernière
copie connue. Une liste fraîche prime toujours. Le réseau ne se voit accorder
que trois secondes quand une copie existe : un réseau en panne ne refuse pas
toujours la connexion, il fait attendre, et l'écran ne doit pas rester vide
après une coupure de courant.

---

## Réglages du contenu

Les valeurs qui ne se règlent pas depuis l'interface sont dans le bloc `CONFIG`,
en tête de `index.html` :

```js
lieu: {nom:'Garges-lès-Gonesse', lat:48.9728, lon:2.4008, alt:57,
       tz:'Europe/Paris', pays:'FR'},
altitude:      false,   // tenir compte des 57 m dans le coucher du soleil
israel:        false,   // un seul jour de fête
allumageMin:   18,      // minutes avant le coucher pour l'allumage
tzeitDeg:      8.5,     // degrés sous l'horizon pour la sortie des étoiles
havdalaPlus:   9,       // minutes ajoutées à la sortie des étoiles
bascule:       'tzeit', // la journée tourne à la nuit, non à minuit
synchro: {url:'defunts.xlsx'},
```

> Les horaires sont calculés avec l'algorithme NOAA, celui qu'utilise Hebcal.
> Des écarts d'une à deux minutes avec le luach de la communauté sont normaux.
> Confrontez-les avant la mise en service : c'est le luach qui fait référence.

Après modification, **changez aussi le numéro de version** en tête de `sw.js`
(`affiches-v1` → `affiches-v2`), sans quoi les écrans déjà installés
continueront de servir l'ancienne copie mise en réserve.

---

## Réglages d'affichage

Icône en haut à gauche de l'écran, ou touche **R** : cadre, nombre d'affiches,
défilement, hauteur du bandeau, horaires, flamme animée. Une ligne indique
l'état de la dernière synchronisation, avec un bouton pour en forcer une.

Raccourcis : **R** réglages, **F** plein écran, **Espace** pause,
**←** **→** pages.
