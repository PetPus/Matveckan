/* Matveckan – offline utan att fastna i gammal version.
   Sidan hämtas från nätet när det finns, annars ur cachen.
   sw.js cachas aldrig, så nya versioner upptäcks alltid. */
var CACHE="matveckan-10";

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){return c.addAll(['./','./index.html'])})
      .then(function(){return self.skipWaiting()})
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
  var url=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(url.pathname.indexOf('sw.js')>-1)return;          /* aldrig cachad */
  if(url.origin!==self.location.origin)return;

  var isPage = e.request.mode==='navigate' ||
               (e.request.headers.get('accept')||'').indexOf('text/html')>-1;

  if(isPage){
    /* nätet först: alltid färsk sida när täckning finns */
    e.respondWith(
      fetch(e.request).then(function(res){
        var copy=res.clone();
        caches.open(CACHE).then(function(c){c.put('./index.html',copy)});
        return res;
      }).catch(function(){
        return caches.match('./index.html').then(function(r){return r||caches.match('./')});
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request,{ignoreSearch:true}).then(function(hit){
      return hit||fetch(e.request).then(function(res){
        var copy=res.clone();
        caches.open(CACHE).then(function(c){c.put(e.request,copy)});
        return res;
      });
    })
  );
});
