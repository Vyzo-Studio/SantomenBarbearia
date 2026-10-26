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
