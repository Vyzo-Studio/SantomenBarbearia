const {test}=require("node:test");const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");const read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("frontend JavaScript parses",()=>{
 for(const file of ["config.js","i18n.js","app.js","admin.js"])assert.doesNotThrow(()=>new vm.Script(read(file),{filename:file}));
});
test("essential static assets exist and local document links resolve",()=>{
 const html=read("index.html");assert.match(html,/<html lang="pt-BR">/);
 assert.match(html,/id="booking-form"/);assert.match(html,/id="media-lightbox"/);
 for(const p of ["assets/logo-santomen.webp","style.css","app.js","config.js","i18n.js","admin.css","admin.js","privacidade.html","termos.html"])assert.ok(fs.existsSync(path.join(root,p)),p);
 assert.match(read("admin.html"),/id="admin-login"/);assert.match(read("admin.html"),/id="admin-panel"/);
});
test("contact and client data boundaries",()=>{
 const config=read("config.js"), app=read("app.js"),admin=read("admin.js");
 assert.match(config,/5561992232839/);assert.match(config,/supabaseUrl: ""/);
 assert.doesNotMatch(config,/service_role|secretKey|password\s*:/i);
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
