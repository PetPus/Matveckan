/* Matveckan – cachen först, uppdatering på begäran. */
var CACHE='matveckan-23';
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
        /* varken cache eller nät: svara med något, annars försöker iOS om i oändlighet */
        return caches.match('./index.html').then(function(r){
          return r||new Response(
            '<!doctype html><meta charset="utf-8">'+
            '<meta name="viewport" content="width=device-width,initial-scale=1">'+
            '<style>body{font:16px -apple-system;padding:40px 24px;color:#2C2842}'+
            'a{color:#6E60BE}</style>'+
            '<h2>Ingen uppkoppling</h2>'+
            '<p>Appen kunde varken hämtas från nätet eller från telefonens kopia.</p>'+
            '<p>Anslut till nätet och <a href="./">försök igen</a>.</p>',
            {status:200,headers:{'Content-Type':'text/html; charset=utf-8'}});
        });
      });
    })
  );
});

/* ---- push-notiser ---- */
self.addEventListener('push',function(e){
  var d={};
  try{d=e.data?e.data.json():{}}catch(err){d={body:e.data?e.data.text():''}}
  e.waitUntil(self.registration.showNotification(d.title||'Matveckan',{
    body:d.body||'',
    tag:d.tag||'matveckan',
    data:{url:d.url||'./delad.html'}
  }));
});
self.addEventListener('notificationclick',function(e){
  e.notification.close();
  var url=(e.notification.data&&e.notification.data.url)||'./delad.html';
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(function(ws){
    for(var i=0;i<ws.length;i++)if(ws[i].url.indexOf(url)>-1&&'focus' in ws[i])return ws[i].focus();
    if(clients.openWindow)return clients.openWindow(url);
  }));
});
