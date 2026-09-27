const CACHE_NAME='tdc-cnc-v1.6-20260927';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if(event.request.method!=='GET') return;
  const req=event.request;
  const url=new URL(req.url);

  // Always try the network first for the app page.
  // This prevents an old index.html from remaining permanently cached.
  if(req.mode==='navigate' || url.pathname.endsWith('/index.html')){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(req,{cache:'no-store'});
        const cache=await caches.open(CACHE_NAME);
        cache.put('./index.html',fresh.clone());
        return fresh;
      }catch(e){
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Other local assets remain available offline.
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp=>{
      if(resp && resp.ok && url.origin===self.location.origin){
        caches.open(CACHE_NAME).then(c=>c.put(req,resp.clone()));
      }
      return resp;
    }))
  );
});
