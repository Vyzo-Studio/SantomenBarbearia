const {test,expect}=require("@playwright/test");
test("home renders official identity without browser errors",async({page})=>{
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto("/");await expect(page).toHaveTitle(/Santomen/);
 await expect(page.getByRole("heading",{level:1})).toContainText("SANTOMEN");
 await expect(page.locator(".hero-mark img")).toBeVisible();
 await expect(page.locator("a[href^='https://wa.me/5561992232839']").first()).toBeVisible();
 expect(errors).toEqual([]);
});
test("mobile navigation and booking form remain usable",async({page})=>{
 await page.setViewportSize({width:320,height:720});await page.goto("/");
 await expect(page.locator("#menu-toggle")).toBeVisible();
 await page.locator("#menu-toggle").click();
 await expect(page.locator("#nav-menu")).toHaveClass(/open/);
 await page.locator("#nav-menu a[href='#servicos']").click();
 await expect(page.locator("#nav-menu")).not.toHaveClass(/open/);
 await expect(page.locator("#service option")).toHaveCount(4);
 await expect(page.locator("#booking-time")).toHaveValue("a_combinar");
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 expect(overflow).toBe(false);
});
test("Santomen admin login is available but management stays unauthorized without login",async({page})=>{
 await page.goto("/admin.html");await expect(page.locator("#admin-login")).toBeVisible();
 await expect(page.locator("#admin-panel")).toBeHidden();
 await expect(page.locator("#login-form button[type='submit']")).toBeDisabled();
});
test("legal pages load and preserve navigation",async({page})=>{
 for(const name of ["privacidade.html","termos.html"]){
   await page.goto("/"+name);
   await expect(page.locator("main h1")).toBeVisible();
   await expect(page.locator("a.legal-back")).toHaveAttribute("href","index.html");
 }
});
test("desktop and tablet layouts avoid horizontal clipping",async({page})=>{
 for(const width of [375,390,430,768,1024,1366,1920]){
   await page.setViewportSize({width,height:900});await page.goto("/");
   const dimensions=await page.evaluate(()=>({body:document.body.scrollWidth,viewport:window.innerWidth}));
   expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport+1);
 }
});

test("location map opens the exact Santomen directions",async({page})=>{
 await page.goto("/#localizacao");
 const map=page.locator(".santomen-map-card");
 await expect(map).toBeVisible();
 await expect(map.locator("iframe")).toHaveAttribute("src",/google\.com\/maps\?q=Barbearia%20Santomen/);
 const links=page.locator("[data-santomen-map-link]");
 await expect(links).toHaveCount(2);
 for(const link of await links.all()){
   await expect(link).toHaveAttribute("href",/0x935bcd6138a62181:0xd1f884d82245867d/);
   await expect(link).toHaveAttribute("target","_blank");
 }
 await expect(page.locator(".location-address")).toContainText("Loja 02");
});

test("real shop photos load in landscape format on desktop and mobile",async({page})=>{
 for(const width of [390,1366]){
  await page.setViewportSize({width,height:900});
  await page.goto("/#espaco");
  const gallery=page.locator("#espaco .shop-space-photo");
  await expect(gallery).toHaveCount(3);
  for(const link of await gallery.all()){
   await expect(link).toBeVisible();
   await expect(link).toHaveAttribute("target","_blank");
   const img=link.locator("img");
   await expect(img).toHaveJSProperty("complete",true);
   const ok=await img.evaluate(i=>i.naturalWidth>0&&i.naturalHeight>0&&Math.abs(i.naturalWidth/i.naturalHeight-16/9)<0.03);
   expect(ok).toBe(true);
  }
 }
});

test("language menu is readable and selectable by mouse and keyboard on mobile and desktop",async({page})=>{
 for(const width of [320,390,1366]){
  await page.setViewportSize({width,height:850});
  await page.goto("/");
  const trigger=page.locator("#language-trigger"),menu=page.locator("#language-menu");
  await trigger.click();await expect(menu).toBeVisible();
  await expect(menu.locator('[role="menuitemradio"]')).toHaveCount(5);
  const geometry=await menu.evaluate(el=>{
   const rect=el.getBoundingClientRect();
   const item=el.querySelector(".language-option");
   const style=getComputedStyle(item);
   return {left:rect.left,right:rect.right,width:innerWidth,color:style.color,bg:style.backgroundColor};
  });
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.width+1);
  expect(geometry.color).not.toBe(geometry.bg);
  await page.getByRole("menuitemradio",{name:/English/}).click();
  await expect(page.locator("html")).toHaveAttribute("lang","en");
  await expect(trigger).toContainText("EN");
  await expect(menu).toBeHidden();
  await page.reload();
  await expect(trigger).toContainText("EN");
  await trigger.focus();await page.keyboard.press("ArrowDown");
  await expect(menu).toBeVisible();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("lang","de");
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
 }
});
test("each of the five languages remains selectable",async({page})=>{
 await page.goto("/");
 const expected=[["pt","pt-BR","PT"],["en","en","EN"],["es","es","ES"],["ja","ja","JA"],["de","de","DE"]];
 for(const [code,locale,label] of expected){
   await page.locator("#language-trigger").click();
   await page.locator('[data-language="'+code+'"]').click();
   await expect(page.locator("html")).toHaveAttribute("lang",locale);
   await expect(page.locator("#language-trigger")).toContainText(label);
   await expect(page.locator('[data-language="'+code+'"]')).toHaveAttribute("aria-checked","true");
 }
});
test("numbered decoration and admin shortcut are absent while form remains functional",async({page})=>{
 await page.goto("/");
 expect(await page.locator(".section-tag").allTextContents()).toHaveLength(7);
 for(const value of await page.locator(".section-tag").allTextContents())expect(value).not.toMatch(/0[1-9]\s*\//);
 await expect(page.getByRole("link",{name:"ÁREA ADMINISTRATIVA"})).toHaveCount(0);
 await expect(page.locator('a[href="admin.html"]')).toHaveCount(0);
 await expect(page.locator("#service-list .service-index")).toHaveCount(0);
 await expect(page.locator("#booking-form")).toBeVisible();
 await expect(page.locator("#privacy-ack")).not.toBeChecked();
 await page.goto("/admin.html");
 await expect(page.locator("#admin-panel")).toBeHidden();
 await expect(page.locator("#login-form button[type=submit]")).toBeEnabled();
});
test("the marquee advances with identical tracks even under reduced-motion preference",async({page})=>{
 await page.emulateMedia({reducedMotion:"no-preference"});
 await page.setViewportSize({width:1366,height:900});
 await page.goto("/");
 await page.evaluate(()=>document.fonts.ready);
 const track=page.locator(".marquee-track"),groups=page.locator(".marquee-group");
 await expect(groups).toHaveCount(2);
 const initial=await track.evaluate(el=>getComputedStyle(el).transform);
 await page.waitForTimeout(500);
 const after=await track.evaluate(el=>getComputedStyle(el).transform);
 expect(initial).not.toBe(after);
 const seam=await page.evaluate(()=>{
  const first=document.querySelectorAll(".marquee-group");
  const a=first[0].getBoundingClientRect(),b=first[1].getBoundingClientRect();
  return {first:a.width,second:b.width,delta:b.left-a.right,document:document.documentElement.scrollWidth,viewport:innerWidth};
 });
 expect(Math.abs(seam.first-seam.second)).toBeLessThan(1);
 expect(Math.abs(seam.delta)).toBeLessThan(1);
 expect(seam.document).toBeLessThanOrEqual(seam.viewport+1);
 await page.emulateMedia({reducedMotion:"reduce"});
 await expect(track).toHaveCSS("animation-name","santomen-marquee");
 await expect(track).toHaveCSS("animation-play-state","running");
});
test("marquee and menu do not cause horizontal overflow",async({page})=>{
 await page.emulateMedia({reducedMotion:"no-preference"});
 for(const width of [320,375,390,430,768,1024,1366,1920,2560]){
  await page.setViewportSize({width,height:850});
  await page.goto("/");
  await page.locator("#language-trigger").click();
  const dims=await page.evaluate(()=>({body:document.body.scrollWidth,document:document.documentElement.scrollWidth,viewport:innerWidth}));
  expect(dims.body).toBeLessThanOrEqual(dims.viewport+1);
  expect(dims.document).toBeLessThanOrEqual(dims.viewport+1);
 }
});


test("marquee always moves without any pause button for both system motion settings",async({page})=>{
 for(const mode of ["no-preference","reduce"]){
  await page.emulateMedia({reducedMotion:mode});
  await page.goto("/");
  await expect(page.locator("#marquee-motion-toggle")).toHaveCount(0);
  const track=page.locator(".marquee-track");
  await expect(track).toHaveCSS("animation-name","santomen-marquee");
  await expect(track).toHaveCSS("animation-play-state","running");
  const before=await track.evaluate(el=>getComputedStyle(el).transform);
  await page.waitForTimeout(450);
  const after=await track.evaluate(el=>getComputedStyle(el).transform);
  expect(before).not.toBe(after);
 }
});
test("old saved pause setting is ignored and language changes do not stop ticker",async({page})=>{
 await page.addInitScript(()=>localStorage.setItem("santomen:marquee-motion","off"));
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto("/");
 const track=page.locator(".marquee-track");
 await expect(track).toHaveCSS("animation-name","santomen-marquee");
 await page.locator("#language-trigger").click();
 await page.locator('[data-language="en"]').click();
 await expect(track).toHaveCSS("animation-play-state","running");
 const before=await track.evaluate(el=>getComputedStyle(el).transform);
 await page.waitForTimeout(350);
 const after=await track.evaluate(el=>getComputedStyle(el).transform);
 expect(before).not.toBe(after);
 await expect(page.locator("#marquee-motion-toggle")).toHaveCount(0);
});


test("mobile bar has exact actions, accessible labels, no overflow and remains fixed",async({page})=>{
 for(const width of [320,360,375,390,430,767]){
  await page.setViewportSize({width,height:780});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
  const nav=page.getByRole("navigation",{name:"Navegação rápida da Santomen"});
  await expect(nav).toBeVisible();
  const anchors=nav.locator("a");
  await expect(anchors).toHaveCount(4);
  const hrefs=await anchors.evaluateAll(a=>a.map(x=>x.getAttribute("href")));
  expect(hrefs).toEqual(["#servicos","#agendar","https://www.instagram.com/santomenbarbearia/","#localizacao"]);
  await expect(nav.locator('[data-mobile-target="agendar"]')).toHaveCSS("background-color","rgb(244, 217, 0)");
  await expect(nav.locator('[href^="https://www.instagram.com/"]')).toHaveAttribute("target","_blank");
  await expect(nav.locator('[href^="https://www.instagram.com/"]')).toHaveAttribute("rel","noopener noreferrer");
  const metrics=await page.evaluate(()=>{
   const nav=document.getElementById("santomen-mobile-nav"),box=nav.getBoundingClientRect();
   return {position:getComputedStyle(nav).position,left:box.left,right:box.right,windowWidth:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth,touch:[...nav.querySelectorAll("a")].map(a=>a.getBoundingClientRect().height),barBottom:innerHeight-box.bottom};
  });
  expect(metrics.position).toBe("fixed");
  expect(metrics.left).toBeGreaterThanOrEqual(-1);
  expect(metrics.right).toBeLessThanOrEqual(width+1);
  expect(metrics.document).toBeLessThanOrEqual(width+1);
  expect(metrics.body).toBeLessThanOrEqual(width+1);
  for(const t of metrics.touch)expect(t).toBeGreaterThanOrEqual(44);
  await page.evaluate(()=>scrollTo({top:document.body.scrollHeight,behavior:"instant"}));
  await expect(nav).toBeVisible();
 }
});
test("Valores and Local scroll to existing headings and update active state",async({page})=>{
 await page.setViewportSize({width:390,height:800});
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto("/");
 const nav=page.locator("#santomen-mobile-nav");
 await nav.locator('[data-mobile-target="servicos"]').click();
 await expect(page).toHaveURL(/#servicos$/);
 await expect.poll(async()=>page.locator("#servicos").evaluate(el=>el.getBoundingClientRect().top)).toBeLessThan(130);
 await expect(nav.locator('[data-mobile-target="servicos"]')).toHaveAttribute("aria-current","location");
 await nav.locator('[data-mobile-target="localizacao"]').click();
 await expect(page).toHaveURL(/#localizacao$/);
 await expect.poll(async()=>page.locator("#localizacao").evaluate(el=>el.getBoundingClientRect().top)).toBeLessThan(130);
 await expect(nav.locator('[data-mobile-target="localizacao"]')).toHaveAttribute("aria-current","location");
 await expect(page.locator(".santomen-map-card")).toBeVisible();
});
test("Agendar takes visitors straight to existing form without erasing fields or submitting",async({page})=>{
 await page.setViewportSize({width:390,height:800});
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto("/");
 await page.locator("#customer-name").fill("Cliente Teste");
 await page.locator("#customer-name").blur();
 await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));
 await page.locator('#santomen-mobile-nav [data-mobile-target="agendar"]').click();
 await expect(page).toHaveURL(/#agendar$/);
 await expect.poll(async()=>page.locator(".booking-card").evaluate(el=>el.getBoundingClientRect().top)).toBeLessThan(160);
 await expect(page.locator("#customer-name")).toHaveValue("Cliente Teste");
 await expect(page.locator("#booking-mode")).toContainText("CONSULTA VIA WHATSAPP");
 await expect(page.locator("#booking-form")).toBeVisible();
 await expect(page.locator("#privacy-ack")).not.toBeChecked();
 await expect(page.locator('#santomen-mobile-nav [data-mobile-target="agendar"]')).toHaveAttribute("aria-current","location");
});
test("desktop retains header and does not display mobile bar",async({page})=>{
 for(const width of [768,1024,1366,1920]){
  await page.setViewportSize({width,height:900});
  await page.goto("/");
  await expect(page.locator("#santomen-mobile-nav")).toBeHidden();
  await expect(page.locator(".site-header")).toBeVisible();
 }
});
test("mobile navigation does not obscure booking editing or modal content",async({page})=>{
 await page.setViewportSize({width:360,height:640});
 await page.goto("/");
 const nav=page.locator("#santomen-mobile-nav");
 await page.locator("#customer-phone").focus();
 await expect(nav).toBeHidden();
 await page.locator("#customer-phone").blur();
 await expect(nav).toBeVisible();
 await page.evaluate(()=>document.querySelector("#media-lightbox").showModal());
 await expect(nav).toBeHidden();
 await expect(page.locator("#media-lightbox")).toBeVisible();
 await page.locator("#close-lightbox").click();
 // Browsers may restore focus to the preceding booking field after dialog closes.
 // The nav intentionally remains hidden while a booking field has focus.
 await page.evaluate(()=>document.activeElement?.blur());
 await expect(nav).toBeVisible();
 await page.evaluate(()=>window.scrollTo({top:document.body.scrollHeight,behavior:"instant"}));
 const box=await page.locator(".footer-bottom").evaluate(el=>({footer:el.getBoundingClientRect().bottom,nav:document.getElementById("santomen-mobile-nav").getBoundingClientRect().top}));
 expect(box.footer).toBeLessThan(box.nav);
});

test("online booking stays intentionally off until Santomen has authorized real catalog",async({page})=>{
 await page.goto("/");
 await expect(page.locator("#booking-mode")).toContainText("CONSULTA VIA WHATSAPP");
 await expect(page.locator("#service option")).toHaveCount(4);
 await expect(page.locator("#booking-time")).toHaveValue("a_combinar");
});
