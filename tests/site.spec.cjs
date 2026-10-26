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
test("private dashboard fails closed with no independent database",async({page})=>{
 await page.goto("/admin.html");await expect(page.locator("#admin-login")).toBeVisible();
 await expect(page.locator("#admin-panel")).toBeHidden();
 await expect(page.locator("#login-feedback")).toContainText("não foi configurado");
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
 await expect(page.locator("#login-form button[type=submit]")).toBeDisabled();
});
test("the marquee advances, has identical adjacent tracks, and supports reduced motion",async({page})=>{
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
 await expect(track).toHaveCSS("animation-name","none");
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

test("visitor can enable animation even with reduced motion active and it persists",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto("/");
 const ticker=page.locator(".marquee-track"),button=page.locator("#marquee-motion-toggle");
 await expect(ticker).toHaveCSS("animation-name","none");
 await expect(button).toHaveAttribute("aria-pressed","false");
 await expect(button).toHaveAttribute("aria-label","Ativar movimento da faixa");
 await button.click();
 await expect(ticker).toHaveCSS("animation-name","santomen-marquee");
 await expect(button).toHaveAttribute("aria-pressed","true");
 const before=await ticker.evaluate(el=>getComputedStyle(el).transform);
 await page.waitForTimeout(350);
 const after=await ticker.evaluate(el=>getComputedStyle(el).transform);
 expect(before).not.toBe(after);
 await page.reload();
 await expect(button).toHaveAttribute("aria-pressed","true");
 await expect(ticker).toHaveCSS("animation-name","santomen-marquee");
 await button.click();
 await expect(ticker).toHaveCSS("animation-name","none");
 await expect(button).toHaveAttribute("aria-pressed","false");
});
test("normal-motion banner moves, can be paused and does not restart on language switch",async({page})=>{
 await page.emulateMedia({reducedMotion:"no-preference"});
 await page.goto("/");
 const ticker=page.locator(".marquee-track"),button=page.locator("#marquee-motion-toggle");
 await expect(ticker).toHaveCSS("animation-name","santomen-marquee");
 await expect(button).toHaveAttribute("aria-pressed","true");
 const before=await ticker.evaluate(el=>getComputedStyle(el).transform);
 await page.waitForTimeout(300);
 const after=await ticker.evaluate(el=>getComputedStyle(el).transform);
 expect(before).not.toBe(after);
 await page.locator("#language-trigger").click();
 await page.locator('[data-language="en"]').click();
 await expect(button).toHaveAttribute("aria-label","Pause the moving banner");
 await expect(ticker).toHaveCSS("animation-name","santomen-marquee");
 await button.click();
 await expect(ticker).toHaveCSS("animation-name","none");
 await expect(button).toHaveAttribute("aria-label","Play the moving banner");
});
