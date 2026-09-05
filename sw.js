/* =========================================================================
   Cache hors ligne de l'écran des affiches.

   Deux stratégies, parce que les deux besoins sont opposés :

   — le classeur des défunts : le réseau d'abord. Une liste fraîche prime
     toujours ; à défaut, on ressort la dernière connue. C'est ce qui permet à
     l'écran de repartir sur la bonne liste après une coupure de courant, même
     si le Wi-Fi n'est pas encore revenu.

   — l'application elle-même : le cache d'abord, mise à jour en arrière-plan.
     L'affichage démarre instantanément et sans réseau, et prend la nouvelle
     version au chargement suivant.
   ========================================================================= */
const VERSION = 'affiches-v1';
const ESSENTIELS = ['./', './index.html', './defunts.xlsx'];

self.addEventListener('install', evt => {
  evt.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // On tolère l'absence d'un fichier : un dépôt sans classeur doit pouvoir
    // s'installer quand même.
    await Promise.allSettled(
      ESSENTIELS.map(u => cache.add(new Request(u, {cache: 'reload'}))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', evt => {
  evt.waitUntil((async () => {
    for (const cle of await caches.keys())
      if (cle !== VERSION) await caches.delete(cle);
    await self.clients.claim();
  })());
});

/** Clé de cache sans la chaîne de requête : l'écran ajoute un horodatage à ses
    demandes pour contourner les caches, il ne faut pas empiler une entrée par
    tentative. */
function cleDeCache(requete){
  const u = new URL(requete.url);
  u.search = '';
  return u.toString();
}

self.addEventListener('fetch', evt => {
  const requete = evt.request;
  if (requete.method !== 'GET') return;
  const url = new URL(requete.url);
  if (url.origin !== location.origin) return;     // l'extérieur passe librement

  const estClasseur = /\.(xlsx|xls|csv)$/i.test(url.pathname);

  evt.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cle = cleDeCache(requete);

    if (estClasseur){
      const garde = await cache.match(cle);
      /* Course contre la montre : un reseau mort ne refuse pas toujours la
         connexion, il fait attendre. On ne laisse au reseau que trois secondes
         quand une copie existe, sinon l'ecran resterait vide de longues
         secondes apres une coupure de courant. */
      const reseau = (async () => {
        const reponse = await fetch(requete, {cache: 'no-store'});
        if (!reponse.ok) throw new Error('reponse ' + reponse.status);
        await cache.put(cle, reponse.clone());
        return reponse;
      })();
      if (!garde){
        try { return await reseau; }
        catch (e){ return new Response('', {status: 504, statusText: 'Hors ligne'}); }
      }
      const patience = new Promise(r => setTimeout(() => r(null), 3000));
      const gagnant = await Promise.race([reseau.catch(() => null), patience]);
      if (gagnant) return gagnant;
      reseau.catch(() => {});          // la mise a jour peut aboutir plus tard
      return garde;
    }

    const enCache = await cache.match(cle);
    const rafraichir = fetch(requete)
      .then(async reponse => {
        if (reponse.ok) await cache.put(cle, reponse.clone());
        return reponse;
      })
      .catch(() => null);

    if (enCache){ rafraichir; return enCache; }    // mise à jour sans attendre
    return (await rafraichir)
        || new Response('', {status: 504, statusText: 'Hors ligne'});
  })());
});
