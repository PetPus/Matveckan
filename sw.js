/* Matveckan – gör appen körbar utan internet.
   Första besöket med täckning lägger appen i telefonens cache.
   Därefter startar den även i flygplansläge. */
var CACHE="matveckan-4";
var FILES=['./','./index.html'];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES)})
    .then(function(){return self.skipWaiting()}));
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){if(k!==CACHE)return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});

self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  e.respondWith(
    caches.match(e.request,{ignoreSearch:true}).then(function(hit){
      if(hit)return hit;
      return fetch(e.request).then(function(res){
        var copy=res.clone();
        caches.open(CACHE).then(function(c){c.put(e.request,copy)});
        return res;
      }).catch(function(){return caches.match('./index.html')});
    })
  );
});
