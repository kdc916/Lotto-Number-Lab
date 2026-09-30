const SHELL_CACHE='lotto-number-lab-v061-shell';
const RUNTIME_CACHE='lotto-number-lab-v061-runtime';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(SHELL_CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('lotto-number-lab-')&&!['lotto-number-lab-v061-shell','lotto-number-lab-v061-runtime'].includes(k)).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      try{const fresh=await fetch(req);const cache=await caches.open(SHELL_CACHE);cache.put('./index.html',fresh.clone());return fresh}
      catch{return (await caches.match('./index.html'))||(await caches.match('./'))}
    })());
    return;
  }
  if(url.origin===self.location.origin){
    event.respondWith((async()=>{const cached=await caches.match(req);if(cached)return cached;const res=await fetch(req);if(res&&res.ok){const cache=await caches.open(RUNTIME_CACHE);cache.put(req,res.clone())}return res})());
    return;
  }
  if(url.hostname==='cdn.jsdelivr.net' || url.hostname.endsWith('.jsdelivr.net')){
    event.respondWith((async()=>{
      const cache=await caches.open(RUNTIME_CACHE);const cached=await cache.match(req);
      const network=fetch(req).then(res=>{if(res&&(res.ok||res.type==='opaque'))cache.put(req,res.clone());return res}).catch(()=>null);
      return cached||await network||Response.error();
    })());
  }
});
