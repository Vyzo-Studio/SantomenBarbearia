/* Santomen public app — never represents WhatsApp requests as confirmed reservations. */
(() => {
  "use strict";
  const cfg=window.SANTOMEN_CONFIG||{};
  const $=(q,root=document)=>root.querySelector(q);
  const $$=(q,root=document)=>[...root.querySelectorAll(q)];
  const backend=Boolean(cfg.enableOnlineBooking===true && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(cfg.supabaseUrl||"") && /^sb_publishable_/.test(cfg.supabasePublishableKey||""));
  const copy=()=>window.SANTOMEN_I18N;
  const memoryKey="santomen:booking-contact:v1";
  const state={services:[...(window.SANTOMEN_DEFAULT_SERVICES||[])],barbers:[],media:[],livePhone:null,requestId:0};
  const phoneDigits=value=>String(value||"").replace(/\D/g,"");
  const validPhone=value=>{const s=phoneDigits(value);return /^([1-9]\d)(9\d{8}|[2-8]\d{7})$/.test(s)};
  const money=cents=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);
  const dateLocal=()=>{
    const p=new Intl.DateTimeFormat("en-CA",{timeZone:cfg.timezone||"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
    const f=Object.fromEntries(p.map(x=>[x.type,x.value]));return f.year+"-"+f.month+"-"+f.day;
  };
  function message(text,kind="info"){const el=$("#booking-feedback");if(el){el.textContent=text;el.className="booking-message "+kind}}
  function whatsappLink(text){return "https://wa.me/"+(state.livePhone||cfg.phone)+"?text="+encodeURIComponent(text)}
  function safeDate(val){if(!/^\d{4}-\d{2}-\d{2}$/.test(val))return false;const d=new Date(val+"T12:00:00");return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===val}
  async function rpc(name,params){
    if(!backend)throw Error("Agenda não configurada");
    const abort=new AbortController();const timeout=setTimeout(()=>abort.abort(),12000);
    try{
      const response=await fetch(cfg.supabaseUrl.replace(/\/$/,"")+"/rest/v1/rpc/"+name,{
        method:"POST",headers:{"apikey":cfg.supabasePublishableKey,"Content-Type":"application/json"},
        body:JSON.stringify(params||{}),signal:abort.signal,cache:"no-store"
      });
      const raw=await response.text();let result=null;try{result=raw?JSON.parse(raw):null}catch{result=raw}
      if(!response.ok)throw Error((result&&result.message)||"Servidor indisponível");
      return result;
    }finally{clearTimeout(timeout)}
  }
  function make(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=String(text);return el}
  function renderServices(){
    const root=$("#service-list"),select=$("#service");if(!root||!select)return;
    root.replaceChildren();select.replaceChildren(new Option("Selecione seu serviço",""));
    for(const [i,s] of state.services.filter(s=>s.active!==false).entries()){
      const article=make("article","service-card");article.append(make("div","service-symbol",["✂","◈","★","✳"][i%4]),make("h3","",s.name),make("p","",s.description||"Atendimento Santomen"));
      const footer=make("div","service-footer"),price=make("span","",Number.isInteger(s.price_cents)?money(s.price_cents):"Consulte o valor");
      const a=make("a","","↗");a.href="#agendar";a.setAttribute("aria-label","Consultar "+s.name);a.addEventListener("click",()=>{select.value=String(s.id);updateAvailability()});
      footer.append(price,a);article.append(footer);root.append(article);
      select.append(new Option(s.name+(Number.isInteger(s.price_cents)?" — "+money(s.price_cents):""),String(s.id)));
    }
    if(!state.services.length){root.append(make("p","muted","Serviços temporariamente indisponíveis. Consulte diretamente a equipe."));}
  }
  function renderBarbers(){
    const select=$("#barber");if(!select)return;select.replaceChildren(new Option("Equipe Santomen",""));
    for(const b of state.barbers.filter(b=>b.active!==false))select.append(new Option(b.name,String(b.id)));
    const msg=$("#team-message");if(msg && state.barbers.length){msg.textContent=state.barbers.map(b=>b.name).join(" • ")+". Consulte a disponibilidade de cada profissional na agenda."}
  }
  function renderGallery(){
    const lightbox=$("#media-lightbox");
    if(lightbox&&!lightbox.dataset.santomenCloseReady){
      lightbox.dataset.santomenCloseReady="true";
      $("#close-lightbox")?.addEventListener("click",()=>lightbox.close());
      lightbox.addEventListener("click",e=>{if(e.target===lightbox)lightbox.close()});
    }
    if(!state.media.length)return;
    const root=$("#gallery"),filters=$("#gallery-filters"),dialog=$("#media-lightbox"),image=$("#lightbox-image"),caption=$("#lightbox-caption");
    if(!root||!filters||!dialog)return;
    root.replaceChildren();root.classList.add("has-gallery-media");
    const all=state.media.filter(m=>{try{const url=new URL(m.image_url);return url.protocol==="https:"}catch{return false}});
    if(!all.length)return;
    const categories=["Todos",...new Set(all.map(m=>m.category||"Outros"))];
    const buttons=categories.map(c=>{const btn=make("button","filter-chip",c);btn.type="button";btn.dataset.filter=c;return btn});
    filters.replaceChildren(...buttons);filters.hidden=false;
    const draw=category=>{
      buttons.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.filter===category)));
      root.replaceChildren();
      all.filter(m=>category==="Todos"||m.category===category).forEach((m,i)=>{
        const btn=make("button","media-card");btn.type="button";btn.setAttribute("aria-label","Ampliar fotografia: "+m.title);
        const img=make("img");img.src=m.image_url;img.alt=m.title;img.loading=i<2?"eager":"lazy";img.referrerPolicy="no-referrer";
        const text=make("span","media-caption",m.title+" ↗");btn.append(img,text);
        btn.addEventListener("click",()=>{image.src=m.image_url;image.alt=m.title;caption.textContent=m.title;dialog.showModal()});
        root.append(btn);
      });
    };
    buttons.forEach(btn=>btn.addEventListener("click",()=>draw(btn.dataset.filter)));

    dialog.addEventListener("close",()=>image.removeAttribute("src"));
    draw("Todos");
    $("#gallery-note").textContent="Fotos divulgadas pela administração da Santomen Barbearia.";
  }
  function applyLiveSettings(settings){
    if(!settings)return;
    const phone=phoneDigits(settings.whatsapp||"");
    if(/^55[1-9]\d{9,10}$/.test(phone)){
      $('a[href^="https://wa.me/"]').forEach(a=>a.href="https://wa.me/"+phone);
      state.livePhone=phone;
    }
    if(settings.address){
      $(".location-address").textContent=settings.address;
      // Preserve the exact Google Maps business route for the current address.
      // If the owner changes the official address later, update both links and the preview.
      if(String(settings.address).trim() !== cfg.address){
        const destination="https://www.google.com/maps/dir/?api=1&destination="+encodeURIComponent(settings.address);
        document.querySelectorAll("[data-santomen-map-link]").forEach(a=>{a.href=destination});
        const frame=$(".santomen-map-iframe");
        if(frame)frame.src="https://www.google.com/maps?q="+encodeURIComponent(settings.address)+"&output=embed";
      }
      $(".location-section .muted").textContent="Consulte o mapa e confirme a localização antes da visita.";
    }
    const hours=String(settings.opening||"").slice(0,5)+" – "+String(settings.closing||"").slice(0,5);
    const hourLabel=$(".booking-meta>div:last-child strong");
    if(hourLabel && settings.opening && settings.closing)hourLabel.textContent="SEG–SÁB · "+hours;
  }
  async function loadCatalog(){
    if(!backend)return;
    try{
      const data=await rpc("santomen_public_catalog",{});
      if(!data||!Array.isArray(data.services)||!Array.isArray(data.barbers))throw Error("Resposta inválida");
      state.services=data.services;state.barbers=data.barbers;state.media=Array.isArray(data.media)?data.media:[];renderServices();renderBarbers();renderGallery();applyLiveSettings(data.settings);
      $("#services-note").textContent="Valores e durações exibidos conforme o cadastro atual da barbearia.";
      $("#booking-mode").textContent="AGENDA ONLINE";
      message("Escolha um serviço, uma data e um horário para solicitar seu agendamento.");
      await updateAvailability();
    }catch(error){
      state.services=[];state.barbers=[];renderServices();renderBarbers();
      $("#booking-mode").textContent="AGENDAMENTO INDISPONÍVEL";
      $("#booking-submit").disabled=true;
      message("Não foi possível carregar os dados da agenda. Fale pelo WhatsApp; nenhuma reserva foi criada.","error");
      console.error("Santomen catálogo:",error);
    }
  }
  async function updateAvailability(){
    const req=++state.requestId, date=$("#booking-date").value,service=$("#service").value,barber=$("#barber").value,select=$("#booking-time");
    select.replaceChildren();
    if(!backend){select.append(new Option("A combinar pelo WhatsApp","a_combinar"));return}
    if(!date||!service){select.append(new Option("Selecione serviço e data",""));select.disabled=true;return}
    select.disabled=true;select.append(new Option("Consultando disponibilidade...",""));
    try{
      const times=await rpc("santomen_available_slots",{p_date:date,p_service_id:service,p_barber_id:barber||null});
      if(req!==state.requestId)return;
      if(!Array.isArray(times))throw Error("Resposta inválida da agenda");
      select.replaceChildren(new Option(times.length?"Escolha um horário":"Nenhum horário disponível",""));
      times.forEach(t=>select.append(new Option(String(t).slice(0,5),String(t).slice(0,5))));
      select.disabled=!times.length;
      message(times.length?"Horários sujeitos à confirmação após o envio da solicitação.":"Sem horários nessa data. Tente outra data ou fale no WhatsApp.");
    }catch(err){
      if(req!==state.requestId)return;
      select.replaceChildren(new Option("Não foi possível consultar",""));select.disabled=true;
      message("Falha ao verificar horários. Não envie a solicitação sem confirmar disponibilidade.","error");
      console.error("Santomen disponibilidade:",err);
    }
  }
  function loadRemembered(){
    try{
      const obj=JSON.parse(localStorage.getItem(memoryKey)||"null");
      if(!obj||Date.now()>obj.until){localStorage.removeItem(memoryKey);return}
      $("#customer-name").value=obj.name||"";$("#customer-phone").value=obj.phone||"";$("#remember-me").checked=true;
    }catch{/* optional */}
  }
  function saveRemembered(){
    try{
      if($("#remember-me").checked)localStorage.setItem(memoryKey,JSON.stringify({name:$("#customer-name").value.trim(),phone:phoneDigits($("#customer-phone").value),until:Date.now()+90*86400000}));
      else localStorage.removeItem(memoryKey);
    }catch{/* optional */}
  }
  function setupForm(){
    const date=$("#booking-date"),time=$("#booking-time"),form=$("#booking-form");
    const today=dateLocal();date.min=today;date.max=(()=>{const d=new Date(today+"T12:00:00");d.setDate(d.getDate()+60);return d.toISOString().slice(0,10)})();
    if(!backend){time.replaceChildren(new Option("A combinar pelo WhatsApp","a_combinar"));$("#booking-mode").textContent="CONSULTA VIA WHATSAPP"}
    $("#service").addEventListener("change",updateAvailability);$("#barber").addEventListener("change",updateAvailability);date.addEventListener("change",updateAvailability);
    $("#forget-me").addEventListener("click",()=>{try{localStorage.removeItem(memoryKey)}catch{}$("#customer-name").value="";$("#customer-phone").value="";$("#remember-me").checked=false;message("Dados deste dispositivo apagados.");});
    loadRemembered();
    form.addEventListener("submit",async ev=>{
      ev.preventDefault();if(!form.reportValidity())return;
      const name=$("#customer-name").value.trim(),phone=phoneDigits($("#customer-phone").value),service=$("#service").value,barber=$("#barber").value,chosenDate=date.value,chosenTime=time.value;
      if(name.length<2||name.length>90){message("Informe seu nome completo ou como prefere ser chamado.","error");return}
      if(!validPhone(phone)){message("Informe um telefone brasileiro válido com DDD.","error");$("#customer-phone").focus();return}
      if(!safeDate(chosenDate)||chosenDate<dateLocal()){message("Selecione uma data válida, a partir de hoje.","error");return}
      if(!$("#privacy-ack").checked){message("Leia e aceite a informação de privacidade antes de continuar.","error");return}
      const serviceObj=state.services.find(s=>String(s.id)===service),barberObj=state.barbers.find(b=>String(b.id)===barber);
      if(!serviceObj){message("Selecione um serviço.","error");return}
      if(!backend){
        const formatted=chosenDate.split("-").reverse().join("/");
        const text="Olá! Gostaria de consultar um agendamento na Santomen Barbearia.\nNome: "+name+"\nTelefone: "+phone+"\nServiço: "+serviceObj.name+"\nData de preferência: "+formatted+"\nHorário: a combinar"+(barberObj?"\nProfissional: "+barberObj.name:"")+".\nPodem confirmar a disponibilidade?";
        saveRemembered();window.open(whatsappLink(text),"_blank","noopener,noreferrer");
        message("Mensagem preparada para o WhatsApp. O horário ainda não está reservado; aguarde confirmação da equipe.","success");
        return;
      }
      if(!/^\d{2}:\d{2}$/.test(chosenTime)||!barber){message("Escolha um profissional e um horário disponível.","error");return}
      const button=$("#booking-submit");button.disabled=true;const original=button.textContent;button.textContent="ENVIANDO SOLICITAÇÃO...";
      try{
        const result=await rpc("santomen_request_booking",{p_service_id:service,p_barber_id:barber,p_date:chosenDate,p_time:chosenTime,p_customer_name:name,p_phone:phone,p_privacy_accepted:true});
        if(!result||!result.booking_id||result.status!=="pending")throw Error("Resposta de reserva inválida");
        saveRemembered();message("Solicitação recebida! Aguarde a confirmação da equipe. Protocolo: "+String(result.booking_id).slice(0,8)+".","success");
        await updateAvailability();
      }catch(error){message("Não foi possível registrar sua solicitação: "+error.message+". Confira com a equipe pelo WhatsApp.","error");}
      finally{button.disabled=false;button.textContent=original}
    });
  }

  function setupMobileBottomNavigation(){
    const nav=$("#santomen-mobile-nav");
    if(!nav)return;
    const sectionIds=["servicos","agendar","localizacao"];
    const sections=sectionIds.map(id=>({id,element:document.getElementById(id),link:nav.querySelector('[data-mobile-target="'+id+'"]')}))
      .filter(item=>item.element&&item.link);
    const links=[...nav.querySelectorAll("a[data-mobile-target]")];
    const editable='input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]),textarea,select';
    let frame=0;
    function updateActive(){
      frame=0;
      const isMobile=window.matchMedia("(max-width: 767px)").matches;
      const y=Math.min(window.innerHeight*.35,window.innerHeight-45);
      const selected=isMobile?sections.find(({element})=>{
        const box=element.getBoundingClientRect();
        return box.top<=y&&box.bottom>=y;
      }):null;
      for(const {id,link} of sections){
        const active=Boolean(selected&&selected.id===id);
        link.classList.toggle("is-active",active);
        if(active)link.setAttribute("aria-current","location");
        else link.removeAttribute("aria-current");
      }
    }
    function schedule(){if(!frame)frame=requestAnimationFrame(updateActive)}
    links.forEach(link=>{
      link.addEventListener("click",event=>{
        const target=link.dataset.mobileTarget;
        if(!target)return;
        if(target==="agendar"&&window.matchMedia("(max-width: 767px)").matches){
          const card=$(".booking-card"),section=$("#agendar");
          if(!card||!section)return;
          event.preventDefault();
          if(location.hash!=="#agendar")history.pushState(null,"","#agendar");
          const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          card.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
        }
        // All local links retain their real section anchor and browser history.
        schedule();
      });
    });
    window.addEventListener("scroll",schedule,{passive:true});
    window.addEventListener("resize",schedule,{passive:true});
    window.addEventListener("hashchange",schedule);
    window.addEventListener("popstate",schedule);
    if("IntersectionObserver" in window){
      const observer=new IntersectionObserver(schedule,{rootMargin:"-15% 0px -55% 0px",threshold:0});
      sections.forEach(({element})=>observer.observe(element));
    }
    function editing(){
      const focused=document.activeElement;
      const hidden=Boolean(focused&&focused.closest("#booking-form")&&focused.matches(editable));
      document.body.classList.toggle("santomen-booking-input-active",hidden);
    }
    document.addEventListener("focusin",editing);
    document.addEventListener("focusout",()=>requestAnimationFrame(editing));
    schedule();
  }
  function setupNavigation(){
    $("#year").textContent=String(new Date().getFullYear());
    const toggle=$("#menu-toggle"), menu=$("#nav-menu");
    toggle.addEventListener("click",()=>{const open=menu.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));toggle.setAttribute("aria-label",open?"Fechar menu":"Abrir menu")});
    $$("#nav-menu a").forEach(a=>a.addEventListener("click",()=>{menu.classList.remove("open");toggle.setAttribute("aria-expanded","false")}));
    document.addEventListener("keydown",ev=>{if(ev.key==="Escape"){menu.classList.remove("open");toggle.setAttribute("aria-expanded","false")}});
  }
  function setup(){
    setupNavigation();setupMobileBottomNavigation();renderServices();renderBarbers();renderGallery();setupForm();loadCatalog();
    document.addEventListener("santomen:language",()=>{renderServices();renderBarbers()});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();
