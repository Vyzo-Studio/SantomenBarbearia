/* Santomen • custom black/yellow calendar, inspired by GNG functional layout. */
(function(){
"use strict";
if(window.SANTOMEN_ADMIN_CALENDAR_READY)return;
window.SANTOMEN_ADMIN_CALENDAR_READY=true;
var MONTHS=["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
var DAYS=["SEG","TER","QUA","QUI","SEX","SÁB","DOM"];
var pad=function(n){return String(n).padStart(2,"0")};
var key=function(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())};
var parse=function(s){var m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(s||"");if(!m)return null;var d=new Date(+m[1],+m[2]-1,+m[3],12);return d.getFullYear()===+m[1]&&d.getMonth()+1===+m[2]&&d.getDate()===+m[3]?d:null};
var today=function(){var f=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).map(function(x){return [x.type,x.value]}));return f.year+"-"+f.month+"-"+f.day};
var view=parse(today())||new Date(),counts={},dialog=null,activeInput=null,activeButton=null,dialogView=null;
function btn(label,cls,attrs){return '<button type="button" class="'+cls+'" '+attrs+'>'+label+'</button>'}
function monthMarkup(d,selected,showCounts){
 var y=d.getFullYear(),m=d.getMonth(),start=(new Date(y,m,1,12).getDay()+6)%7,end=new Date(y,m+1,0,12).getDate();
 var html='<div class="smcal-weekdays">'+DAYS.map(function(x){return '<span>'+x+'</span>'}).join("")+'</div><div class="smcal-grid">';
 for(var b=0;b<start;b++)html+='<span class="smcal-blank" aria-hidden="true"></span>';
 for(var day=1;day<=end;day++){
  var date=new Date(y,m,day,12),iso=key(date),selectedNow=iso===selected,has=showCounts&&counts[iso]>0;
  var cls="smcal-day"+(selectedNow?" selected":"")+(iso===today()?" today":"")+(date.getDay()===0?" closed-day":"")+(has?" has-bookings":"");
  html+=btn(day,cls,'data-smcal-date="'+iso+'" aria-label="'+day+' de '+MONTHS[m].toLowerCase()+' de '+y+(has?', '+counts[iso]+' atendimentos':'')+'" aria-pressed="'+selectedNow+'"');
 }
 return html+"</div>";
}
function header(date,prefix){return '<div class="smcal-head">'+btn("‹","smcal-arrow",'data-'+prefix+'-shift="-1" aria-label="Mês anterior"')+'<strong>'+MONTHS[date.getMonth()]+" "+date.getFullYear()+'</strong>'+btn("›","smcal-arrow",'data-'+prefix+'-shift="1" aria-label="Próximo mês"')+"</div>"}
function render(){
 var target=document.getElementById("santomen-inline-calendar");if(!target)return;
 var input=document.getElementById("filter-date");
 target.innerHTML=header(view,"smcal")+monthMarkup(view,input?input.value:"",true);
}
function chooseDate(iso){var input=document.getElementById("filter-date");if(!input)return;input.value=iso;input.dispatchEvent(new Event("change",{bubbles:true}));render()}
function close(){if(dialog&&dialog.open)dialog.close();if(activeButton)activeButton.focus({preventScroll:true});activeInput=null;activeButton=null}
function paint(){
 if(!dialog||!dialog.open)return;
 dialog.querySelector(".smcal-popup-inner").innerHTML=header(dialogView,"pop")+monthMarkup(dialogView,activeInput?activeInput.value:"",false)+'<div class="smcal-popup-footer">'+btn("HOJE","tiny-button","data-pop-today")+btn("FECHAR","tiny-button","data-pop-close")+"</div>";
}
function open(input,trigger){
 activeInput=input;activeButton=trigger;dialogView=parse(input.value)||parse(today())||new Date();
 if(!dialog){
  dialog=document.createElement("dialog");dialog.className="smcal-dialog";dialog.setAttribute("aria-label","Calendário Santomen");dialog.innerHTML='<div class="smcal-popup-inner"></div>';document.body.append(dialog);
  dialog.addEventListener("click",function(event){
   var b=event.target.closest("button");if(!b)return;
   if(b.dataset.popShift){dialogView=new Date(dialogView.getFullYear(),dialogView.getMonth()+Number(b.dataset.popShift),1,12);paint();return}
   if(b.dataset.smcalDate){
    var d=b.dataset.smcalDate;
    if(activeInput&&((activeInput.min&&d<activeInput.min)||(activeInput.max&&d>activeInput.max)))return;
    activeInput.value=d;activeInput.dispatchEvent(new Event("input",{bubbles:true}));activeInput.dispatchEvent(new Event("change",{bubbles:true}));close();return;
   }
   if(b.hasAttribute("data-pop-today")){if(activeInput){activeInput.value=today();activeInput.dispatchEvent(new Event("change",{bubbles:true}))}close()}
   if(b.hasAttribute("data-pop-close"))close();
  });
  dialog.addEventListener("close",function(){activeInput=null;activeButton=null});
 }
 dialog.showModal();paint();
}
function fields(){
 document.querySelectorAll('#manual-form input[type="date"],#block-form input[type="date"]').forEach(function(input){
  if(input.dataset.santomenCalendar)return;input.dataset.santomenCalendar="1";
  var trigger=document.createElement("button");trigger.type="button";trigger.className="smcal-field-trigger";trigger.setAttribute("aria-label","Escolher data em calendário");trigger.setAttribute("aria-haspopup","dialog");
  function update(){var d=parse(input.value);trigger.textContent=d?DAYS[(d.getDay()+6)%7]+" · "+pad(d.getDate())+"/"+pad(d.getMonth()+1)+"/"+d.getFullYear()+" ▾":"ESCOLHER DATA ▾"}
  input.classList.add("santomen-visually-hidden");input.insertAdjacentElement("afterend",trigger);
  input.addEventListener("change",update);trigger.addEventListener("click",function(e){e.preventDefault();open(input,trigger)});update();
 });
}
var style=document.createElement("style");
style.textContent='.smcal-field-trigger{min-height:45px;display:flex;align-items:center;justify-content:space-between;width:100%;background:#282d2b;border:1px solid #52574a;border-radius:10px;padding:10px 13px;color:#f3f2e9;font:900 12px "DM Sans",sans-serif;cursor:pointer}.smcal-field-trigger:focus-visible{outline:2px solid #f4d900;outline-offset:2px}.smcal-dialog{width:min(390px,calc(100vw - 24px));max-height:min(94vh,720px);border:1px solid #77734a;border-radius:21px;padding:21px;color:#f6f4ed;background:#1c2020;box-shadow:0 30px 80px #000b}.smcal-dialog::backdrop{background:#070808b8;backdrop-filter:blur(4px)}.smcal-dialog .smcal-grid{gap:5px}.smcal-dialog .smcal-day{min-height:44px}.smcal-popup-footer{display:flex;justify-content:space-between;gap:14px;margin-top:20px}.smcal-popup-footer button{min-height:41px;padding:10px 16px}';
document.head.appendChild(style);
function init(){
 fields();render();
 var inline=document.getElementById("santomen-inline-calendar");
 if(inline)inline.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;if(b.dataset.smcalShift){view=new Date(view.getFullYear(),view.getMonth()+Number(b.dataset.smcalShift),1,12);render()}if(b.dataset.smcalDate)chooseDate(b.dataset.smcalDate)});
 var filter=document.getElementById("filter-date");
 if(filter)filter.addEventListener("change",function(){var d=parse(filter.value);if(d)view=new Date(d.getFullYear(),d.getMonth(),1,12);render()});
 window.addEventListener("santomen:bookings-updated",function(e){counts=e.detail&&e.detail.dates||{};render()});
 window.SANTOMEN_CALENDAR={render:render};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();