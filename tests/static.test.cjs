const {test}=require("node:test");const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");const read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("frontend JavaScript parses",()=>{
 for(const file of ["config.js","i18n.js","app.js","admin.js"])assert.doesNotThrow(()=>new vm.Script(read(file),{filename:file}));
});
test("essential static assets exist and local document links resolve",()=>{
 const html=read("index.html");assert.match(html,/<html lang="pt-BR">/);
 assert.match(html,/id="booking-form"/);
 assert.match(html,/assets\/logo-santomen-hero\.webp/);
 assert.match(read("style.css"),/\.hero-mark img\{[^}]*height:auto;aspect-ratio:1 \/ 1;object-fit:contain/);assert.match(html,/id="media-lightbox"/);
 for(const p of ["assets/logo-santomen.webp","assets/logo-santomen-hero.webp","style.css","app.js","config.js","i18n.js","admin.css","admin.js","privacidade.html","termos.html"])assert.ok(fs.existsSync(path.join(root,p)),p);
 assert.match(read("admin.html"),/id="admin-login"/);assert.match(read("admin.html"),/id="admin-panel"/);
});
test("contact and client data boundaries",()=>{
 const config=read("config.js"), app=read("app.js"),admin=read("admin.js");
 assert.match(config,/5561992232839/);assert.match(config,/supabaseUrl: ""/);
 assert.doesNotMatch(config,/^\s*(?:service_role|secretKey|password)\s*[:=]/im);
 assert.match(app,/state\.livePhone/);assert.match(app,/a combinar pelo WhatsApp/i);
 assert.match(admin,/santomen_admins/);assert.match(admin,/signInWithPassword/);
 assert.match(read("style.css"),/\[hidden\]\{display:none!important\}/);
});
test("database migration includes isolation, row security and atomic money rules",()=>{
 const sql=read("supabase/migrations/20261024_santomen_initial.sql");
 assert.match(sql,/create schema if not exists santomen_private/i);
 for(const table of ["admins","settings","services","barbers","blocks","bookings","cash_sessions","payments","payment_allocations","refunds","media"])assert.match(sql,new RegExp("alter table public\\.santomen_"+table+" enable row level security","i"));
 assert.match(sql,/pg_advisory_xact_lock/);assert.match(sql,/for update/);
 assert.match(sql,/santomen_admin_record_payment/);assert.match(sql,/santomen_admin_refund/);
 assert.doesNotMatch(sql,/ueqfokfnjsjgocotvdae|pmhpgrdeknzbvegkrnxi/);
});

test("Santomen map anchors and verified address remain present",()=>{
 const html=read("index.html"),cfg=read("config.js");
 assert.match(html,/class="santomen-map-iframe"/);
 assert.match(html,/class="santomen-map-cover"/);
 assert.match(html,/0x935bcd6138a62181:0xd1f884d82245867d/);
 assert.match(html,/St\. M QNM 20, Loja 02/);
 assert.match(cfg,/St\. M QNM 20, Loja 02/);
});

test("storefront and two interiors are listed as a complete horizontal gallery",()=>{
 const html=read("index.html");
 for(const name of ["fachada","interior-1","interior-2"]){
   const p="assets/espaco-santomen-"+name+".avif";
   assert.ok(fs.existsSync(path.join(root,p)),"Missing media file "+p);
   assert.ok(fs.statSync(path.join(root,p)).size > 250000, "Photo file is excessively compressed: "+p);
   assert.match(html,new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
 }
 assert.match(html,/id="espaco"/);
 assert.match(html,/shop-space-photo--exterior/);
 assert.match(read("style.css"),/\.shop-space-photo\{[^}]*aspect-ratio:16\/9/);
 assert.match(read(".github/workflows/santomen-pages.yml"),/cp -R assets\/\. _site\/assets\//);
});
