/* =========================================================================
   Cache hors ligne de l'écran des affiches.

   Version 2. La première mettait l'application en réserve et la servait
   depuis le cache par défaut : rapide, mais une mise en ligne ne parvenait
   jamais aux écrans déjà installés sans changer ce numéro de version. Piège
   trop facile à oublier.

   Une seule règle désormais, pour tous les fichiers du site : on interroge le
   réseau, mais on ne lui laisse que trois secondes quand une copie existe.
   Passé ce délai, on sert la copie et l'on met le cache à jour en arrière-plan.
   L'écran démarre donc vite, fonctionne sans réseau, et prend toute mise en
   ligne dès qu'il en a le moyen.
   ========================================================================= */
const VERSION = 'affiches-v2';
const ESSENTIELS = ['./', './index.html', './defunts.xlsx'];
const PATIENCE = 3000;

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

  evt.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cle = cleDeCache(requete);
    const garde = await cache.match(cle);

    const reseau = (async () => {
      const reponse = await fetch(requete, {cache: 'no-store'});
      if (!reponse.ok) throw new Error('reponse ' + reponse.status);
      await cache.put(cle, reponse.clone());
      return reponse;
    })();

    // Rien en réserve : il faut bien attendre le réseau.
    if (!garde){
      try { return await reseau; }
      catch (e){ return new Response('', {status: 504, statusText: 'Hors ligne'}); }
    }

    /* Une copie existe. Un réseau en panne ne refuse pas toujours la
       connexion, il fait attendre : on ne lui accorde que trois secondes. */
    const patience = new Promise(r => setTimeout(() => r(null), PATIENCE));
    const gagnant = await Promise.race([reseau.catch(() => null), patience]);
    if (gagnant) return gagnant;

    reseau.catch(() => {});          // la mise à jour peut aboutir plus tard
    return garde;
  })());
});
