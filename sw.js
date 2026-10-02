/* Matveckan – cachen först, uppdatering på begäran. */
var CACHE='matveckan-18';
var FILES=['./','./index.html','./delad.html'];

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(FILES.map(function(f){
        return c.add(f).catch(function(){});
      }));
    }).then(function(){return self.skipWaiting()})
  );
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){if(k!==CACHE)return caches.delete(k)}));
    }).then(function(){return self.clients.claim()})
  );
});

self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var url=new URL(e.request.url);
  if(url.origin!==self.location.origin)return;        /* Supabase går alltid till nätet */
  if(url.pathname.indexOf('sw.js')>-1)return;         /* aldrig cachad */

  e.respondWith(
    caches.match(e.request,{ignoreSearch:true}).then(function(hit){
      if(hit)return hit;
      return fetch(e.request).then(function(res){
        var copy=res.clone();
        caches.open(CACHE).then(function(c){c.put(e.request,copy)});
        return res;
      }).catch(function(){
        return caches.match('./index.html');
      });
    })
  );
});
