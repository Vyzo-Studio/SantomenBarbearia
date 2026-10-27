const {test}=require("node:test");const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");const read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("frontend JavaScript parses",()=>{
 for(const file of ["config.js","i18n.js","app.js","admin.js","admin-calendar.js"])assert.doesNotThrow(()=>new vm.Script(read(file),{filename:file}));
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
 assert.match(config,/5561992232839/);assert.match(config,/supabaseUrl: "https:\/\/[a-z0-9-]+\.supabase\.co"/);
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

test("public page has no decorative section numbers or administrative navigation",()=>{
 const html=read("index.html"),app=read("app.js");
 assert.doesNotMatch(html,/href="admin\.html"/i);
 assert.doesNotMatch(html,/ÁREA ADMINISTRATIVA/);
 const tags=[...html.matchAll(/<div class="section-tag">([\s\S]*?)<\/div>/g)].map(match=>match[1]);
 assert.equal(tags.length,7);
 for(const tag of tags)assert.doesNotMatch(tag,/0[1-9]\s*\/|✳\s*\//);
 assert.doesNotMatch(html,/class="art-index"|class="service-index"|01\s*\/\s*(?:ESTILO|EXTERIOR)/);
 assert.doesNotMatch(app,/make\("div","service-index"/);
 assert.match(html,/id="booking-form"/);
 assert.match(html,/href="privacidade\.html"/);
 assert.match(html,/href="termos\.html"/);
 assert.match(read("admin.html"),/id="admin-login"/);
});
test("language selector keeps five choices, user persistence and accessible menu wiring",()=>{
 const html=read("index.html"),css=read("style.css"),js=read("i18n.js");
 const expected=["pt","en","es","ja","de"];
 for(const language of expected)assert.match(html,new RegExp('data-language="'+language+'"'));
 assert.equal((html.match(/role="menuitemradio"/g)||[]).length,5);
 assert.match(html,/aria-haspopup="menu"/);
 assert.match(html,/id="language-menu" role="menu"/);
 assert.match(css,/\.language-option\[aria-checked="true"\]/);
 assert.match(css,/\.language-menu\[hidden\]/);
 assert.doesNotMatch(css,/\.language-switcher option\{color:#111\}/);
 assert.match(js,/localStorage\.setItem\(storageKey,active\)/);
 assert.match(js,/event\.key==="ArrowDown"/);
 assert.match(js,/event\.key==="Escape"/);
});
test("ticker has identical halves, seamless 50% shift and reduced motion support",()=>{
 const html=read("index.html"),css=read("style.css");
 const groups=[...html.matchAll(/<div class="marquee-group" aria-hidden="true">([\s\S]*?)<\/div>/g)];
 assert.equal(groups.length,2);
 assert.equal(groups[0][1],groups[1][1]);
 assert.equal((groups[0][1].match(/class="marquee-word"/g)||[]).length,10);
 assert.match(css,/animation:santomen-marquee 30s linear infinite/);
 assert.match(css,/translate3d\(-50%,0,0\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/\.marquee \.marquee-track\{animation:santomen-marquee 30s linear infinite!important/);
});
test("admin route is not security by obscurity; Supabase integration remains fail-closed",()=>{
 const config=read("config.js"),admin=read("admin.js"),adminHtml=read("admin.html");
 const sql=read("supabase/migrations/20261024_santomen_initial.sql");
 assert.match(adminHtml,/noindex,nofollow,noarchive/);
 assert.match(admin,/db\.auth\.getUser\(\)/);
 assert.match(admin,/\.from\("santomen_admins"\)/);
 assert.match(admin,/signInWithPassword/);
 assert.match(admin,/if\(!configured\)/);
 assert.match(sql,/santomen_private\.is_admin\(\)/);
 assert.match(sql,/enable row level security/i);
 assert.match(config,/supabaseUrl: "https:\/\/[a-z0-9-]+\.supabase\.co"/);
 assert.match(config,/supabasePublishableKey: "sb_publishable_[^"]+"/);
});


test("ticker stays animated without controls, regardless of motion preference",()=>{
 const html=read("index.html"),css=read("style.css"),app=read("app.js");
 assert.doesNotMatch(html,/marquee-motion-toggle|data-motion="auto"/);
 assert.doesNotMatch(css,/marquee-motion-toggle|\[data-motion=/);
 assert.doesNotMatch(app,/setupMarquee|santomen:marquee-motion/);
 assert.match(html,/style\.css\?v=mobile-bottom-nav-2/);
 assert.match(html,/app\.js\?v=santomen-exclusive-1/);
 assert.match(css,/\.marquee \.marquee-track\{animation:santomen-marquee 30s linear infinite!important/);
 assert.match(css,/animation-duration:30s!important;animation-play-state:running!important/);
 assert.doesNotMatch(css,/\.marquee-track\{animation:none/);
});


test("Santomen mobile navigation has four branded, functional and accessible actions",()=>{
 const html=read("index.html"),css=read("style.css"),app=read("app.js"),i18n=read("i18n.js");
 const block=html.match(/<nav class="santomen-mobile-nav"[\s\S]*?<\/nav>/);
 assert.ok(block,"mobile navigation present");
 const hrefs=[...block[0].matchAll(/<a[^>]*href="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(hrefs,["#servicos","#agendar","https://www.instagram.com/santomenbarbearia/","#localizacao"]);
 assert.equal((block[0].match(/class="santomen-mobile-icon"/g)||[]).length,4);
 assert.doesNotMatch(block[0],/admin\.html|planos|assinaturas|GNG/i);
 assert.match(block[0],/aria-label="Navegação rápida da Santomen"/);
 assert.match(block[0],/target="_blank" rel="noopener noreferrer"/);
 for(const id of ["servicos","agendar","localizacao"])assert.match(html,new RegExp('id="'+id+'"'));
 for(const key of ["mobileValues","mobileBook","mobileInstagram","mobileLocal"])assert.match(i18n,new RegExp(key+':'));
 assert.match(css,/@media\(max-width:767px\)/);
 assert.match(css,/env\(safe-area-inset-bottom,0px\)/);
 assert.match(css,/santomen-mobile-link--primary/);
 assert.match(css,/body\.santomen-booking-input-active/);
 assert.match(app,/function setupMobileBottomNavigation/);
 assert.match(app,/IntersectionObserver/);
 assert.match(app,/scrollIntoView\(/);
 assert.doesNotMatch(block[0],/https:\/\/www\.google\.com\/maps/);
});

test("Santomen uses exclusive Supabase while retaining WhatsApp public mode",()=>{
 const cfg=read("config.js"),app=read("app.js"),html=read("index.html"),admin=read("admin.html");
 assert.match(cfg,/enableOnlineBooking: false/);
 assert.match(app,/cfg\.enableOnlineBooking===true/);
 assert.match(html,/config\.js\?v=santomen-exclusive-1/);
 assert.match(admin,/config\.js\?v=santomen-exclusive-1/);
 assert.match(admin,/admin\.js\?v=santomen-gestao-2/);
 assert.match(read("supabase/migrations/20261026_santomen_public_booking_gate.sql"),/revoke execute on function public\.santomen_request_booking/);
 assert.doesNotMatch(cfg,/sb_secret_|service_role\s*:/);
});

test("Haus teardown migration is narrowly scoped to Santomen tables",()=>{
 const sql=read("supabase/migrations/20261026_santomen_remove_from_haus.sql");
 for(const name of ["admins","settings","services","barbers","blocks","bookings","cash_sessions","payments","payment_allocations","refunds","media"]){
   assert.match(sql,new RegExp("drop table if exists public\\.santomen_"+name+";","i"));
 }
 assert.match(sql,/drop schema if exists santomen_private restrict/);
 assert.doesNotMatch(sql,/drop table if exists public\\.(?:haus_|luence_|admin_users)|drop schema auth|^\\s*drop\\s+.+\\bcascade\\b/im);
 const cfg=read("config.js");
 assert.match(cfg,/supabaseUrl: "https:\/\/whsitzmpotmhbyqpeimh\.supabase\.co"/);
 assert.match(cfg,/supabasePublishableKey: "sb_publishable_[^"]+"/);
 assert.doesNotMatch(cfg,/pmhpgrdeknzbvegkrnxi/);
});

test("Santomen management has branded GNG-inspired organization without cross-brand database references",()=>{
 const html=read("admin.html"),style=read("admin-premium.css"),script=read("admin.js"),calendar=read("admin-calendar.js");
 assert.match(html,/SANTOMEN/);
 for(const id of ["santomen-inline-calendar","santomen-booking-filters","santomen-booking-search","santomen-booking-count","santomen-sync-label","santomen-finance-overview","santomen-export-csv","dashboard-stats","booking-table","payment-form","manual-form","service-form","barber-form","block-form","media-form","settings-form"])assert.match(html,new RegExp('id="'+id+'"'));
 for(const tab of ["dashboard","bookings","manual","blocks","finance","services","barbers","gallery","settings"])assert.match(html,new RegExp('data-tab="'+tab+'"'));
 assert.match(html,/admin-premium\.css\?v=2/);
 assert.match(html,/admin-calendar\.js\?v=2/);
 assert.match(style,/#f4d900/i);
 assert.match(script,/setInterval\(pollBookings,5000\)/);
 assert.match(script,/document\.hidden/);
 assert.match(script,/pollInFlight/);
 assert.match(script,/new CustomEvent\("santomen:bookings-updated"/);
 assert.match(script,/function renderFinancialOverview/);
 assert.match(script,/function exportFinanceCSV/);
 assert.match(calendar,/role|aria-label|aria-pressed/);
 assert.doesNotMatch(script,/gng_|haus_|ueqfokfnjsjgocotvdae|pmhpgrdeknzbvegkrnxi/i);
 assert.doesNotMatch(html,/GNG BARBEARIA|HAUS BARBER/i);
 const seed=read("supabase/migrations/20261027_santomen_gng_reference_catalog.sql");
 assert.match(seed,/false/);
 assert.match(seed,/Referência GNG/);
 assert.equal((seed.match(/^\s*\('/gm)||[]).length,13);
});
