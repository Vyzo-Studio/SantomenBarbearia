(function(){
"use strict";
const pt={mobileValues:"VALORES",mobileBook:"AGENDAR",mobileInstagram:"INSTAGRAM",mobileLocal:"LOCAL",navAbout:"A SANTOMEN",navServices:"SERVIÇOS",navPortfolio:"PORTFÓLIO",navBook:"AGENDAR",navContact:"CONTATO",bookNow:"AGENDAR HORÁRIO ↗",heroEyebrow:"TRADIÇÃO QUE ENCONTRA ATITUDE",heroLine1:"SEU ESTILO.",heroLine2:"SUA MARCA.",heroLine3:"SANTOMEN.",heroText:"Mais que um corte: atenção aos detalhes, respeito pelo seu estilo e aquela resenha boa de barbearia. Chega mais.",heroCTA:"QUERO MARCAR MEU HORÁRIO ↗",seeWork:"CONHEÇA NOSSO TRABALHO",aboutTag:"QUEM SOMOS",aboutTitle:"NA CADEIRA, VOCÊ É A PRIORIDADE.",aboutText:"A Santomen faz parte da rotina de quem valoriza um bom corte, uma barba bem-feita e um atendimento sem enrolação. Aqui, cada detalhe conta e cada estilo tem seu espaço.",followInstagram:"ACOMPANHE A SANTOMEN NO INSTAGRAM",servicesTag:"O QUE FAZEMOS",servicesTitle:"SEU VISUAL. NOSSO COMPROMISSO.",servicesText:"Conheça os tipos de atendimento. Valores e durações serão confirmados pela equipe.",portfolioTag:"NOSSO TRABALHO",portfolioTitle:"O RESULTADO FALA POR SI.",allOnInstagram:"VER PORTFÓLIO ORIGINAL NO INSTAGRAM",teamTag:"NOSSA EQUIPE",teamTitle:"TALENTO NAS MÃOS CERTAS.",teamCTA:"CONSULTAR HORÁRIOS",bookingTag:"SEU PRÓXIMO HORÁRIO",bookingTitle:"O PRÓXIMO VISUAL COMEÇA AQUI.",bookingText:"Escolha o atendimento e consulte a agenda. Você também pode falar diretamente com nossa equipe pelo WhatsApp.",talkWhatsApp:"FALAR DIRETAMENTE NO WHATSAPP ↗",serviceLabel:"01 / SERVIÇO",barberLabel:"02 / PROFISSIONAL",dateLabel:"03 / DATA",timeLabel:"04 / HORÁRIO",nameLabel:"05 / SEU NOME",phoneLabel:"06 / WHATSAPP",locationTag:"ONDE FICAMOS",locationTitle:"A CASA DO SEU ESTILO.",directions:"COMO CHEGAR ↗",contactCTA:"ENTRAR EM CONTATO ↗"};
const en={mobileValues:"PRICES",mobileBook:"BOOK",mobileInstagram:"INSTAGRAM",mobileLocal:"LOCATION",navAbout:"ABOUT US",navServices:"SERVICES",navPortfolio:"OUR WORK",navBook:"BOOK",navContact:"CONTACT",bookNow:"BOOK NOW ↗",heroEyebrow:"TRADITION MEETS ATTITUDE",heroLine1:"YOUR STYLE.",heroLine2:"YOUR MARK.",heroLine3:"SANTOMEN.",heroText:"More than a haircut: attention to detail, respect for your style and the friendly atmosphere of a real barbershop.",heroCTA:"BOOK MY APPOINTMENT ↗",seeWork:"EXPLORE OUR WORK",aboutTag:"WHO WE ARE",aboutTitle:"IN THE CHAIR, YOU COME FIRST.",aboutText:"Santomen is for those who appreciate a great haircut, a well-groomed beard and straightforward service. Every detail matters and every style belongs.",followInstagram:"FOLLOW SANTOMEN ON INSTAGRAM",servicesTag:"WHAT WE DO",servicesTitle:"YOUR LOOK. OUR COMMITMENT.",servicesText:"Explore our services. Prices and durations will be confirmed by our team.",portfolioTag:"OUR WORK",portfolioTitle:"THE RESULTS SPEAK FOR THEMSELVES.",allOnInstagram:"VIEW ORIGINAL PORTFOLIO ON INSTAGRAM",teamTag:"OUR TEAM",teamTitle:"SKILL IN THE RIGHT HANDS.",teamCTA:"CHECK TIMES",bookingTag:"YOUR NEXT APPOINTMENT",bookingTitle:"YOUR NEXT LOOK STARTS HERE.",bookingText:"Choose your service and check availability, or talk directly to our team on WhatsApp.",talkWhatsApp:"CHAT ON WHATSAPP ↗",serviceLabel:"01 / SERVICE",barberLabel:"02 / BARBER",dateLabel:"03 / DATE",timeLabel:"04 / TIME",nameLabel:"05 / YOUR NAME",phoneLabel:"06 / WHATSAPP",locationTag:"FIND US",locationTitle:"THE HOME OF YOUR STYLE.",directions:"DIRECTIONS ↗",contactCTA:"CONTACT US ↗"};
const es={mobileValues:"PRECIOS",mobileBook:"RESERVAR",mobileInstagram:"INSTAGRAM",mobileLocal:"UBICACIÓN",navAbout:"LA SANTOMEN",navServices:"SERVICIOS",navPortfolio:"PORTAFOLIO",navBook:"RESERVAR",navContact:"CONTACTO",bookNow:"RESERVAR HORA ↗",heroEyebrow:"TRADICIÓN CON ACTITUD",heroLine1:"TU ESTILO.",heroLine2:"TU MARCA.",heroLine3:"SANTOMEN.",heroText:"Más que un corte: cuidado en los detalles, respeto por tu estilo y el buen ambiente de una barbería auténtica.",heroCTA:"QUIERO RESERVAR ↗",seeWork:"CONOCE NUESTRO TRABAJO",aboutTag:"QUIÉNES SOMOS",aboutTitle:"EN LA SILLA, TÚ ERES LA PRIORIDAD.",aboutText:"Santomen es para quienes valoran un buen corte, una barba cuidada y un trato directo. Cada detalle cuenta y todos los estilos tienen su lugar.",followInstagram:"SÍGUENOS EN INSTAGRAM",servicesTag:"QUÉ HACEMOS",servicesTitle:"TU IMAGEN. NUESTRO COMPROMISO.",servicesText:"Conoce nuestros servicios. El equipo confirmará precios y duración.",portfolioTag:"NUESTRO TRABAJO",portfolioTitle:"EL RESULTADO HABLA POR SÍ SOLO.",allOnInstagram:"VER PORTAFOLIO EN INSTAGRAM",teamTag:"EL EQUIPO",teamTitle:"TALENTO EN BUENAS MANOS.",teamCTA:"CONSULTAR HORARIOS",bookingTag:"TU PRÓXIMA CITA",bookingTitle:"TU PRÓXIMO ESTILO EMPIEZA AQUÍ.",bookingText:"Elige el servicio y consulta la agenda. También puedes hablar con nosotros por WhatsApp.",talkWhatsApp:"HABLAR POR WHATSAPP ↗",serviceLabel:"01 / SERVICIO",barberLabel:"02 / PROFESIONAL",dateLabel:"03 / FECHA",timeLabel:"04 / HORA",nameLabel:"05 / NOMBRE",phoneLabel:"06 / WHATSAPP",locationTag:"UBICACIÓN",locationTitle:"LA CASA DE TU ESTILO.",directions:"CÓMO LLEGAR ↗",contactCTA:"CONTACTAR ↗"};
const ja={mobileValues:"料金",mobileBook:"予約",mobileInstagram:"INSTAGRAM",mobileLocal:"場所",navAbout:"サントメンについて",navServices:"サービス",navPortfolio:"実績",navBook:"予約",navContact:"お問い合わせ",bookNow:"予約する ↗",heroEyebrow:"伝統と個性の融合",heroLine1:"自分のスタイル。",heroLine2:"自分らしさ。",heroLine3:"SANTOMEN.",heroText:"ただの散髪ではありません。細部へのこだわり、自分らしいスタイル、居心地の良いバーバーショップ。",heroCTA:"予約を相談する ↗",seeWork:"実績を見る",aboutTag:"私たちについて",aboutTitle:"あなたを第一に考えます。",aboutText:"Santomenは、丁寧なカットとひげの手入れ、誠実な接客を大切にしています。一人ひとりのスタイルに寄り添います。",followInstagram:"INSTAGRAMを見る",servicesTag:"サービス",servicesTitle:"あなたのスタイルを大切に。",servicesText:"サービスをご覧ください。料金と所要時間はスタッフにご確認ください。",portfolioTag:"作品",portfolioTitle:"仕上がりがすべてを語る。",allOnInstagram:"公式INSTAGRAMで作品を見る",teamTag:"スタッフ",teamTitle:"確かな技術。",teamCTA:"空き時間を確認",bookingTag:"次回のご予約",bookingTitle:"新しいスタイルはここから。",bookingText:"サービスを選んで空き状況をご確認ください。WhatsAppでもお問い合わせいただけます。",talkWhatsApp:"WHATSAPPで相談 ↗",serviceLabel:"01 / サービス",barberLabel:"02 / 担当者",dateLabel:"03 / 日付",timeLabel:"04 / 時間",nameLabel:"05 / お名前",phoneLabel:"06 / WHATSAPP",locationTag:"アクセス",locationTitle:"あなたのスタイルの場所。",directions:"道順 ↗",contactCTA:"お問い合わせ ↗"};
const de={mobileValues:"PREISE",mobileBook:"BUCHEN",mobileInstagram:"INSTAGRAM",mobileLocal:"STANDORT",navAbout:"ÜBER UNS",navServices:"LEISTUNGEN",navPortfolio:"PORTFOLIO",navBook:"TERMIN",navContact:"KONTAKT",bookNow:"TERMIN ANFRAGEN ↗",heroEyebrow:"TRADITION TRIFFT CHARAKTER",heroLine1:"DEIN STIL.",heroLine2:"DEIN MARKENZEICHEN.",heroLine3:"SANTOMEN.",heroText:"Mehr als ein Haarschnitt: Liebe zum Detail, Respekt für deinen Stil und die entspannte Atmosphäre eines echten Barbershops.",heroCTA:"MEINEN TERMIN ANFRAGEN ↗",seeWork:"UNSERE ARBEIT ENTDECKEN",aboutTag:"ÜBER UNS",aboutTitle:"BEI UNS STEHST DU IM MITTELPUNKT.",aboutText:"Santomen steht für gute Haarschnitte, gepflegte Bärte und ehrlichen Service. Jedes Detail zählt und jeder Stil hat seinen Platz.",followInstagram:"SANTOMEN AUF INSTAGRAM",servicesTag:"UNSERE LEISTUNGEN",servicesTitle:"DEIN LOOK. UNSER ANSPRUCH.",servicesText:"Entdecke unsere Leistungen. Preise und Dauer bestätigt unser Team.",portfolioTag:"UNSERE ARBEIT",portfolioTitle:"ERGEBNISSE SPRECHEN FÜR SICH.",allOnInstagram:"ORIGINALPORTFOLIO AUF INSTAGRAM",teamTag:"UNSER TEAM",teamTitle:"KÖNNEN IN DEN RICHTIGEN HÄNDEN.",teamCTA:"TERMINE PRÜFEN",bookingTag:"DEIN NÄCHSTER TERMIN",bookingTitle:"DEIN NÄCHSTER LOOK BEGINNT HIER.",bookingText:"Wähle eine Leistung und frage freie Zeiten an. Oder kontaktiere uns direkt über WhatsApp.",talkWhatsApp:"AUF WHATSAPP SCHREIBEN ↗",serviceLabel:"01 / LEISTUNG",barberLabel:"02 / BARBIER",dateLabel:"03 / DATUM",timeLabel:"04 / UHRZEIT",nameLabel:"05 / DEIN NAME",phoneLabel:"06 / WHATSAPP",locationTag:"STANDORT",locationTitle:"DIE HEIMAT DEINES STILS.",directions:"WEGBESCHREIBUNG ↗",contactCTA:"KONTAKT ↗"};
const dict={pt,en,es,ja,de}; const storageKey="santomen:preferred-language";
function saved(){try{return localStorage.getItem(storageKey)||"pt"}catch{return "pt"}}
let active=dict[saved()]?saved():"pt";
function setLanguage(code,save){
  active=dict[code]?code:"pt"; document.documentElement.lang=({pt:"pt-BR",en:"en",es:"es",ja:"ja",de:"de"})[active];
  const trigger=document.getElementById("language-trigger"),current=document.getElementById("language-current");
  if(current)current.textContent=({pt:"PT",en:"EN",es:"ES",ja:"JA",de:"DE"})[active];
  if(trigger)trigger.setAttribute("aria-label","Idioma atual: "+({pt:"Português (Brasil)",en:"English",es:"Español",ja:"日本語",de:"Deutsch"})[active]+". Alterar idioma");
  document.querySelectorAll("#language-menu .language-option").forEach(option=>{
    const selected=option.dataset.language===active;
    option.setAttribute("aria-checked",String(selected));
  });
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key=el.dataset.i18n, s=(dict[active]&&dict[active][key])||pt[key];if(!s)return;
    // Preserve the editorial accent by keeping the final phrase in the highlighted span.
    if(el.classList.contains("display-title")&&s.includes(" ")){const index=s.lastIndexOf(" ",Math.max(0,Math.floor(s.length*.55)));const n=index>0?index:Math.floor(s.length/2);el.replaceChildren(document.createTextNode(s.slice(0,n+1)),Object.assign(document.createElement("em"),{textContent:s.slice(n+1)}));}
    else el.textContent=s;
  });
  if(save){try{localStorage.setItem(storageKey,active)}catch{}}
  document.dispatchEvent(new CustomEvent("santomen:language",{detail:{language:active}}));
}
window.SANTOMEN_I18N={get language(){return active},t:(key)=>((dict[active]||pt)[key]||pt[key]||key),setLanguage,dict};
document.addEventListener("DOMContentLoaded",()=>{
  setLanguage(active,false);
  const root=document.getElementById("language-switcher"),trigger=document.getElementById("language-trigger"),menu=document.getElementById("language-menu");
  if(!root||!trigger||!menu)return;
  const options=[...menu.querySelectorAll(".language-option")];
  const selectedIndex=()=>Math.max(0,options.findIndex(option=>option.dataset.language===active));
  const close=(focusTrigger=false)=>{
    if(menu.hidden)return;
    menu.hidden=true;trigger.setAttribute("aria-expanded","false");
    if(focusTrigger)trigger.focus();
  };
  const open=()=>{
    menu.hidden=false;trigger.setAttribute("aria-expanded","true");
    options[selectedIndex()].focus();
  };
  trigger.addEventListener("click",()=>menu.hidden?open():close(true));
  trigger.addEventListener("keydown",event=>{
    if(event.key==="ArrowDown"||event.key==="ArrowUp"){
      event.preventDefault();open();
      if(event.key==="ArrowUp")options.at(-1).focus();
    }
  });
  menu.addEventListener("click",event=>{
    const option=event.target.closest(".language-option");
    if(!option||!menu.contains(option))return;
    setLanguage(option.dataset.language,true);close(true);
  });
  menu.addEventListener("keydown",event=>{
    const currentIndex=Math.max(0,options.indexOf(document.activeElement));
    if(event.key==="Escape"){event.preventDefault();close(true);return}
    if(event.key==="Tab"){close();return}
    let next;
    if(event.key==="ArrowDown")next=(currentIndex+1)%options.length;
    else if(event.key==="ArrowUp")next=(currentIndex-1+options.length)%options.length;
    else if(event.key==="Home")next=0;
    else if(event.key==="End")next=options.length-1;
    if(next!==undefined){event.preventDefault();options[next].focus()}
  });
  document.addEventListener("pointerdown",event=>{if(!root.contains(event.target))close()});
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!menu.hidden){event.preventDefault();close(true)}});
  root.addEventListener("focusout",event=>{if(!root.contains(event.relatedTarget))close()});
});
})();