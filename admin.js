/* Santomen admin — uses real Supabase Auth and database RLS only. */
const cfg=window.SANTOMEN_CONFIG||{};
const $=(q,root=document)=>root.querySelector(q);
const $$=(q,root=document)=>[...root.querySelectorAll(q)];
const configured=Boolean(/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(cfg.supabaseUrl||"") && /^sb_publishable_/.test(cfg.supabasePublishableKey||""));
let db=null,currentUser=null;
let bookingView="all",bookingSearch="",pollHandle=null,pollInFlight=false,pollFingerprint=null,pollErrorCount=0;
const data={bookings:[],services:[],barbers:[],blocks:[],payments:[],allocations:[],refunds:[],sessions:[],media:[],settings:[]};
const titles={dashboard:"VISÃO GERAL",bookings:"AGENDAMENTOS",manual:"AGENDAR MANUALMENTE",services:"SERVIÇOS E PREÇOS",barbers:"PROFISSIONAIS",blocks:"BLOQUEIO DE HORÁRIOS",finance:"CAIXA E FINANCEIRO",gallery:"PORTFÓLIO",settings:"CONFIGURAÇÕES"};
const money=n=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format((Number(n)||0)/100);
const cents=n=>Math.round(Number(n||0)*100);
const digits=s=>String(s||"").replace(/\D/g,"");
const datePT=s=>s?String(s).slice(0,10).split("-").reverse().join("/"):"—";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const fmtTime=s=>String(s||"").slice(0,5);
const isoToday=()=>{const f=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());const p=Object.fromEntries(f.map(x=>[x.type,x.value]));return p.year+"-"+p.month+"-"+p.day};
function flash(text,kind="info",login=false){const el=$(login?"#login-feedback":"#admin-feedback");el.textContent=text;el.className="admin-flash "+kind}
function rowTable(headers,rows){if(!rows.length)return '<p class="empty-result">Nenhum registro para esta visualização.</p>';return '<table class="data-table"><thead><tr>'+headers.map(x=>'<th>'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+rows.join("")+'</tbody></table>'}
function opt(el,values,first){el.replaceChildren(new Option(first||"Selecione",""));values.forEach(v=>el.append(new Option(v.text,v.value)))}
function activateTab(tab){
 $("#admin-tabs [data-tab]").forEach(b=>{const active=b.dataset.tab===tab;b.classList.toggle("active",active);if(active)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});
 $("[data-panel]").forEach(el=>el.hidden=el.dataset.panel!==tab);
 $("#panel-title").textContent=titles[tab]||"GESTÃO";
 window.scrollTo({top:0,behavior:"instant"});
}
function filled(name){return data[name]||[]}
function getBarber(id){return filled("barbers").find(x=>x.id===id)?.name||"Não identificado"}
function getService(id){return filled("services").find(x=>x.id===id)?.name||"Não identificado"}
function hydrateSelects(){
  $$("select[data-services]").forEach(el=>opt(el,filled("services").map(x=>({text:x.name,value:x.id})),"Selecione o serviço"));
  $$("select[data-barbers]").forEach(el=>opt(el,filled("barbers").map(x=>({text:x.name,value:x.id})),el.closest("#block-form")?"Todos os profissionais":"Selecione o profissional"));
  const paidIds=new Set(filled("payments").map(x=>x.booking_id));
  const pending=filled("bookings").filter(x=>!paidIds.has(x.id)&&!["cancelled","rejected","expired"].includes(x.status));
  $$("select[data-unpaid]").forEach(el=>opt(el,pending.map(x=>({text:datePT(x.booking_date)+" "+fmtTime(x.starts_at)+" — "+x.customer_name+" — "+money(x.price_snapshot_cents),value:x.id})),"Selecione o atendimento"));
}
function renderDashboard(){
 const today=isoToday(),all=filled("bookings"),day=all.filter(x=>x.booking_date===today);
 const appointments=day.length,pending=all.filter(x=>x.status==="pending").length,completed=day.filter(x=>x.status==="completed").length;
 const receipts=filled("payments").filter(x=>String(x.paid_at).slice(0,10)===today).reduce((v,x)=>v+x.amount_cents,0);
 const refunded=filled("refunds").filter(x=>String(x.refunded_at).slice(0,10)===today).reduce((v,x)=>v+x.amount_cents,0);
 const stats=[["AGENDAMENTOS DE HOJE",appointments],["SOLICITAÇÕES PENDENTES",pending],["CONCLUÍDOS HOJE",completed],["RECEBIDO HOJE (LÍQUIDO)",money(receipts-refunded)]];
 $("#dashboard-stats").innerHTML=stats.map(([name,value])=>'<div class="stat"><div class="stat-name">'+esc(name)+'</div><strong>'+esc(value)+'</strong></div>').join("");
 const next=all.filter(x=>x.booking_date>=today&&!["cancelled","rejected","expired"].includes(x.status)).sort((a,b)=>(a.booking_date+a.starts_at).localeCompare(b.booking_date+b.starts_at)).slice(0,10);
 $("#dashboard-bookings").innerHTML=rowTable(["DATA","CLIENTE","SERVIÇO","PROFISSIONAL","SITUAÇÃO"],next.map(x=>'<tr><td>'+datePT(x.booking_date)+' '+fmtTime(x.starts_at)+'</td><td>'+esc(x.customer_name)+'</td><td>'+esc(getService(x.service_id))+'</td><td>'+esc(getBarber(x.barber_id))+'</td><td>'+esc(x.status)+'</td></tr>'));
}
function renderBookings(){
 const day=$("#filter-date").value;
 const search=bookingSearch.trim().toLowerCase();
 const all=filled("bookings");
 const filtered=all.filter(b=>(!day||b.booking_date===day)&&(bookingView==="all"||b.status===bookingView)&&(!search||(b.customer_name||"").toLowerCase().includes(search)||digits(b.phone||"").includes(digits(search))&&(digits(search).length>0)));
 const list=filtered.sort((a,b)=>(a.booking_date+a.starts_at).localeCompare(b.booking_date+b.starts_at));
 const states={pending:"PENDENTE",confirmed:"CONFIRMADO",completed:"CONCLUÍDO",cancelled:"CANCELADO",rejected:"RECUSADO",expired:"EXPIRADO"};
 const count=$("#santomen-booking-count");if(count)count.textContent=list.length+(list.length===1?" ATENDIMENTO":" ATENDIMENTOS");
 const heading=$("#booking-date-summary");if(heading)heading.textContent=day?"AGENDA · "+datePT(day):"TODOS OS AGENDAMENTOS";
 $("#booking-table").innerHTML=list.length?list.map(b=>{
   const allowed=["pending","confirmed"].includes(b.status),name=esc(b.customer_name||""),phone=digits(b.phone||"");
   const contact=phone?'<a class="tiny-button" href="https://wa.me/'+esc(phone.startsWith("55")?phone:"55"+phone)+'" target="_blank" rel="noopener noreferrer">WHATSAPP ↗</a>':"";
   const controls=allowed?(b.status==="pending"?'<button type="button" class="tiny-button" data-status-id="'+esc(b.id)+'" data-status="confirmed">CONFIRMAR</button>':"")+'<button type="button" class="tiny-button" data-status-id="'+esc(b.id)+'" data-status="cancelled">CANCELAR</button>':"";
   return '<article class="santomen-appointment" data-state="'+esc(b.status)+'"><div class="smappointment-top"><div><span class="smappointment-time">'+datePT(b.booking_date)+' · '+fmtTime(b.starts_at)+'</span><strong>'+name+'</strong></div><span class="smappointment-status">'+esc(states[b.status]||b.status)+'</span></div><div class="smappointment-meta"><span>'+esc(getService(b.service_id))+'</span><span>'+esc(getBarber(b.barber_id))+'</span><span>'+money(b.price_snapshot_cents)+'</span><span>'+esc(b.phone||"")+'</span></div><div class="smappointment-bottom"><span class="smappointment-meta">'+esc(b.source||"")+'</span><div class="smappointment-actions">'+contact+controls+'</div></div></article>';
 }).join(""):'<div class="empty-result">NENHUM AGENDAMENTO ENCONTRADO PARA ESTE FILTRO.<br>ESCOLHA OUTRO DIA OU VEJA TODOS OS ATENDIMENTOS.</div>';
}
function renderServices(){
 $("#service-table").innerHTML=rowTable(["SERVIÇO","CATEGORIA","VALOR","DURAÇÃO","PÚBLICO","AÇÃO"],filled("services").map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.category)+'</td><td>'+money(x.price_cents)+'</td><td>'+esc(x.duration_minutes)+' min</td><td>'+ (x.is_active?"ATIVO":"INATIVO")+'</td><td><button class="tiny-button" type="button" data-edit-service="'+esc(x.id)+'">EDITAR</button></td></tr>'));
}
function renderBarbers(){
 $("#barber-table").innerHTML=rowTable(["NOME","HORÁRIO","SITUAÇÃO","AÇÃO"],filled("barbers").map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+fmtTime(x.opening)+' – '+fmtTime(x.closing)+'</td><td>'+(x.is_active?"ATIVO":"INATIVO")+'</td><td><button type="button" class="tiny-button" data-edit-barber="'+esc(x.id)+'">EDITAR</button></td></tr>'));
}
function renderBlocks(){
 $("#block-table").innerHTML=rowTable(["DATA","PROFISSIONAL","PERÍODO","MOTIVO","AÇÃO"],filled("blocks").sort((a,b)=>b.block_date.localeCompare(a.block_date)).map(x=>'<tr><td>'+datePT(x.block_date)+'</td><td>'+ (x.barber_id?esc(getBarber(x.barber_id)):"TODA A EQUIPE")+'</td><td>'+fmtTime(x.starts_at)+'–'+fmtTime(x.ends_at)+'</td><td>'+esc(x.reason||"—")+'</td><td><button class="tiny-button" type="button" data-delete-block="'+esc(x.id)+'">REMOVER</button></td></tr>'));
}
function renderFinance(){
 const open=filled("sessions").find(x=>!x.closed_at);const badge=$("#cash-status");badge.textContent=open?"CAIXA ABERTO":"CAIXA FECHADO";badge.className="status-pill"+(open?" paid":"");
 const gross=filled("payments").reduce((v,x)=>v+x.amount_cents,0),refunded=filled("refunds").reduce((v,x)=>v+x.amount_cents,0);
 const allocations=filled("allocations");const methodSum=m=>allocations.filter(x=>x.method===m).reduce((v,x)=>v+x.amount_cents,0);
 $("#finance-stats").innerHTML=[["RECEBIMENTOS",money(gross)],["ESTORNOS",money(refunded)],["SALDO LÍQUIDO",money(gross-refunded)],["PAGAMENTOS",filled("payments").length]].map(([k,v])=>'<div class="stat"><div class="stat-name">'+k+'</div><strong>'+esc(v)+'</strong></div>').join("");
 const rows=filled("payments").sort((a,b)=>b.paid_at.localeCompare(a.paid_at)).map(p=>{
  const booking=filled("bookings").find(x=>x.id===p.booking_id);
  const breakdown=allocations.filter(x=>x.payment_id===p.id).map(x=>({cash:"Dinheiro",pix:"Pix",debit:"Débito",credit:"Crédito"}[x.method]+": "+money(x.amount_cents))).join(" + ");
  const paidRefund=filled("refunds").filter(x=>x.payment_id===p.id).reduce((v,x)=>v+x.amount_cents,0);
  const refund=paidRefund<p.amount_cents?'<button type="button" class="tiny-button" data-refund="'+esc(p.id)+'">ESTORNAR</button>':"";
  return '<tr><td>'+datePT(p.paid_at)+' '+String(p.paid_at||"").slice(11,16)+'</td><td>'+esc(booking?.customer_name||"—")+'</td><td>'+esc(breakdown)+'</td><td>'+money(p.amount_cents)+'</td><td>'+money(paidRefund)+'</td><td>'+refund+'</td></tr>';
 });
 $("#payment-table").innerHTML=rowTable(["PAGO EM","CLIENTE","FORMAS","RECEBIDO","ESTORNADO","AÇÃO"],rows);
}
function renderMedia(){
 $("#media-table").innerHTML=rowTable(["TÍTULO","CATEGORIA","PUBLICAÇÃO","AÇÃO"],filled("media").map(x=>'<tr><td>'+esc(x.title)+'</td><td>'+esc(x.category)+'</td><td>'+(x.published?"VISÍVEL":"RASCUNHO")+'</td><td><button type="button" class="tiny-button" data-toggle-media="'+esc(x.id)+'">'+(x.published?"OCULTAR":"PUBLICAR")+'</button></td></tr>'));
}
function renderSettings(){
 const f=$("#settings-form"),s=filled("settings")[0];if(!s)return;
 f.elements.name.value=s.name||"";f.elements.whatsapp.value=s.whatsapp||"";f.elements.address.value=s.address||"";
 f.elements.opening.value=fmtTime(s.opening);f.elements.closing.value=fmtTime(s.closing);f.elements.step.value=s.step_minutes||30;
}

function calendarDateCounts(){
 const days={};
 for(const b of filled("bookings")){if(b.booking_date&&!["cancelled","rejected","expired"].includes(b.status))days[b.booking_date]=(days[b.booking_date]||0)+1}
 return days;
}
function emitAgendaEvent(){
 window.dispatchEvent(new CustomEvent("santomen:bookings-updated",{detail:{dates:calendarDateCounts()}}));
 const pending=filled("bookings").filter(b=>b.status==="pending").length;
 const badge=$("#nav-pending-count");if(badge){badge.textContent=String(pending);badge.hidden=pending===0}
}
function paintSync(message,ok=true){
 const sync=$("#santomen-sync"),label=$("#santomen-sync-label"),time=$("#santomen-sync-time");
 if(!sync||!label||!time)return;
 sync.classList.toggle("is-offline",!ok);
 label.textContent=message;
 time.textContent=new Date().toLocaleTimeString("pt-BR",{timeZone:cfg.timezone||"America/Sao_Paulo"})+" · "+(ok?"AGENDA ATUALIZADA":"NÃO SINCRONIZADO");
}
function calendarFinanceDay(date){
 if(!date)return null;
 const dateObject=new Date(date);if(Number.isNaN(dateObject.valueOf()))return null;
 const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(dateObject).map(x=>[x.type,x.value]));
 return parts.year+"-"+parts.month+"-"+parts.day;
}
function renderFinancialOverview(){
 const el=$("#santomen-finance-overview");if(!el)return;
 const now=isoToday(),month=now.slice(0,7),year=now.slice(0,4),payments=filled("payments"),refunds=filled("refunds");
 function total(records,dateField,rule){return records.filter(x=>{const d=calendarFinanceDay(x[dateField]);return d&&rule(d)}).reduce((v,x)=>v+(Number(x.amount_cents)||0),0)}
 const net=rule=>total(payments,"paid_at",rule)-total(refunds,"refunded_at",rule);
 const metrics=[["LÍQUIDO HOJE",money(net(d=>d===now))],["LÍQUIDO NO MÊS",money(net(d=>d.startsWith(month)))],["LÍQUIDO NO ANO",money(net(d=>d.startsWith(year)))],["TRANSAÇÕES",String(payments.length)]];
 el.innerHTML=metrics.map(([label,value])=>'<div class="stat"><div class="stat-name">'+esc(label)+'</div><strong>'+esc(value)+'</strong></div>').join("");
}
function exportFinanceCSV(){
 if(!currentUser)return;
 const lines=[["DATA","CLIENTE","SERVIÇO","VALOR RECEBIDO (R$)","FORMA(S)","VALOR ESTORNADO (R$)"]];
 for(const p of filled("payments")){
  const booking=filled("bookings").find(b=>b.id===p.booking_id),parts=filled("allocations").filter(x=>x.payment_id===p.id).map(x=>x.method+":"+money(x.amount_cents)).join(" + ");
  const refund=filled("refunds").filter(x=>x.payment_id===p.id).reduce((a,b)=>a+b.amount_cents,0);
  lines.push([datePT(p.paid_at),booking?.customer_name||"",getService(booking?.service_id),String((p.amount_cents/100).toFixed(2)).replace(".",","),parts,String((refund/100).toFixed(2)).replace(".",",")]);
 }
 // Prefix spreadsheet formulas, so imported CSV cannot execute cell formulas.
 const safe=v=>{let value=String(v??"");if(/^[\s]*[=+\-@]/.test(value))value="'"+value;return '"'+value.replaceAll('"','""')+'"'};
 const csv="\uFEFF"+lines.map(row=>row.map(safe).join(";")).join("\r\n");
 const object=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
 const a=document.createElement("a");a.href=object;a.download="santomen-financeiro-"+isoToday()+".csv";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(object),1000);
}
async function pollBookings(){
 if(!currentUser||!db||pollInFlight||document.hidden)return;
 pollInFlight=true;
 try{
  const fresh=await queryRows("bookings");
  if(!currentUser)return;
  const fingerprint=JSON.stringify(fresh.map(b=>[b.id,b.status,b.updated_at,b.created_at,b.booking_date,b.starts_at]));
  if(fingerprint!==pollFingerprint){
   const previousIds=new Set(filled("bookings").map(b=>b.id));
   const newBookings=fresh.filter(b=>!previousIds.has(b.id));
   data.bookings=fresh;pollFingerprint=fingerprint;
   renderDashboard();renderBookings();hydrateSelects();emitAgendaEvent();
   if(newBookings.length&&previousIds.size){
    flash("NOVO AGENDAMENTO RECEBIDO: "+newBookings.length+" — agenda sincronizada.","success");
   }
  }
  pollErrorCount=0;paintSync("ATUALIZAÇÃO AUTOMÁTICA · 5 SEGUNDOS");
 }catch(error){
  pollErrorCount++;
  if(pollErrorCount===1||pollErrorCount%12===0)console.warn("Falha na sincronização de agendamentos Santomen:",error);
  paintSync("CONEXÃO INSTÁVEL · NOVA TENTATIVA",false);
 }finally{pollInFlight=false}
}
function stopPolling(){if(pollHandle!==null){clearInterval(pollHandle);pollHandle=null}pollInFlight=false;pollFingerprint=null;paintSync("MONITORAMENTO PAUSADO",false)}
function startPolling(){
 if(pollHandle!==null||!currentUser)return;
 pollHandle=setInterval(pollBookings,5000);
 paintSync("ATUALIZAÇÃO AUTOMÁTICA · 5 SEGUNDOS");
}
function renderAll(){hydrateSelects();renderDashboard();renderBookings();renderServices();renderBarbers();renderBlocks();renderFinance();renderFinancialOverview();renderMedia();renderSettings();emitAgendaEvent()}
async function queryRows(table,order){
 let q=db.from("santomen_"+table).select("*");if(order)q=q.order(order,{ascending:false});const {data:rows,error}=await q;
 if(error)throw Error("Falha em "+table+": "+error.message);return rows||[];
}
async function load(){
 if(!db||!currentUser)return;
 $("#refresh").disabled=true;flash("Sincronizando dados reais com o banco...");
 try{
  const tables=["bookings","services","barbers","blocks","payments","payment_allocations","refunds","cash_sessions","media","settings"];
  const result=await Promise.all(tables.map(name=>queryRows(name)));
  const keys=["bookings","services","barbers","blocks","payments","allocations","refunds","sessions","media","settings"];
  keys.forEach((key,i)=>data[key]=result[i]);pollFingerprint=JSON.stringify(filled("bookings").map(b=>[b.id,b.status,b.updated_at,b.created_at,b.booking_date,b.starts_at]));renderAll();paintSync("ATUALIZAÇÃO AUTOMÁTICA · 5 SEGUNDOS");
  flash("Dados atualizados. Última consulta: "+new Date().toLocaleTimeString("pt-BR",{timeZone:cfg.timezone||"America/Sao_Paulo"}),"success");
 }catch(error){flash(error.message+". Algumas informações podem estar desatualizadas.","error");console.error(error)}
 finally{$("#refresh").disabled=false}
}
async function invoke(fn,params,done){if(!currentUser){flash("Sessão expirada. Entre novamente.","error");return}
 try{const {data:result,error}=await db.rpc(fn,params);if(error)throw error;flash(done||"Operação concluída.","success");await load();return result}
 catch(error){flash("Não foi possível concluir: "+error.message,"error");throw error}
}
async function mutate(table,operation,payload,id){
 const q=db.from("santomen_"+table);
 const {error}=await (operation==="insert"?q.insert(payload):operation==="delete"?q.delete().eq("id",id):q.update(payload).eq("id",id));
 if(error)throw error;flash("Registro atualizado com sucesso.","success");await load();
}
function setupTabs(){
 $$("#admin-tabs [data-tab]").forEach(btn=>btn.addEventListener("click",()=>activateTab(btn.dataset.tab)));
 $("#refresh").addEventListener("click",load);
 $("#filter-date").addEventListener("change",renderBookings);
 $("#filter-clear").addEventListener("click",()=>{$("#filter-date").value="";$("#filter-date").dispatchEvent(new Event("change",{bubbles:true}));renderBookings()});
 document.addEventListener("click",e=>{const button=e.target.closest("[data-nav-target]");if(button)activateTab(button.dataset.navTarget)});
 $("#santomen-booking-filters [data-booking-view]").forEach(button=>button.addEventListener("click",()=>{
  bookingView=button.dataset.bookingView;
  $("#santomen-booking-filters [data-booking-view]").forEach(b=>{const active=b===button;b.classList.toggle("selected",active);b.setAttribute("aria-pressed",String(active))});
  renderBookings();
 }));
 $("#santomen-booking-search")?.addEventListener("input",e=>{bookingSearch=e.target.value;renderBookings()});
 $("#santomen-export-csv")?.addEventListener("click",exportFinanceCSV);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden&&currentUser)pollBookings()});
 window.addEventListener("pagehide",stopPolling);
}
function setupForms(){
 $("#manual-form").addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget,z=f.elements;try{await invoke("santomen_admin_manual_booking",{p_service_id:z.service.value,p_barber_id:z.barber.value,p_date:z.date.value,p_time:z.time.value,p_name:z.name.value.trim(),p_phone:digits(z.phone.value),p_source:z.source.value},"Agendamento manual registrado.");f.reset()}catch{}});
 $("#service-form").addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget,z=f.elements;const payload={name:z.name.value.trim(),category:z.category.value.trim(),description:z.description.value.trim(),price_cents:cents(z.price.value),duration_minutes:Number(z.duration.value),is_active:z.active.checked};try{await mutate("services",z.id.value?"update":"insert",payload,z.id.value);f.reset();$("#service-form-title").textContent="CADASTRAR SERVIÇO"}catch(x){flash(x.message,"error")}});
 $("#service-reset").addEventListener("click",()=>{$("#service-form").reset();$("#service-form").elements.id.value="";$("#service-form-title").textContent="CADASTRAR SERVIÇO"});
 $("#barber-form").addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget,z=f.elements;const payload={name:z.name.value.trim(),bio:z.bio.value.trim(),opening:z.opening.value,closing:z.closing.value,is_active:z.active.checked};if(payload.closing<=payload.opening){flash("A hora de saída deve ser posterior à entrada.","error");return}try{await mutate("barbers",z.id.value?"update":"insert",payload,z.id.value);f.reset();$("#barber-form-title").textContent="CADASTRAR PROFISSIONAL"}catch(x){flash(x.message,"error")}});
 $("#barber-reset").addEventListener("click",()=>{$("#barber-form").reset();$("#barber-form").elements.id.value="";$("#barber-form-title").textContent="CADASTRAR PROFISSIONAL"});
 $("#block-form").addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget,z=f.elements;if(z.end.value<=z.start.value){flash("O fim deve ser posterior ao início.","error");return}try{await mutate("blocks","insert",{barber_id:z.barber.value||null,block_date:z.date.value,starts_at:z.start.value,ends_at:z.end.value,reason:z.reason.value.trim()});f.reset()}catch(x){flash(x.message,"error")}});
 $("#cash-open-form").addEventListener("submit",async e=>{e.preventDefault();try{await invoke("santomen_admin_open_cash",{p_opening_cents:cents(e.currentTarget.elements.opening.value)},"Caixa aberto.")}catch{}});
 $("#cash-close-form").addEventListener("submit",async e=>{e.preventDefault();if(!confirm("Confirma o fechamento deste caixa?"))return;try{await invoke("santomen_admin_close_cash",{p_counted_cents:cents(e.currentTarget.elements.counted.value)},"Caixa fechado.")}catch{}});
 $("#payment-form").addEventListener("submit",async e=>{e.preventDefault();const z=e.currentTarget.elements;const payload={p_booking_id:z.booking.value,p_cash:cents(z.cash.value),p_pix:cents(z.pix.value),p_debit:cents(z.debit.value),p_credit:cents(z.credit.value)};const total=payload.p_cash+payload.p_pix+payload.p_debit+payload.p_credit;const booking=filled("bookings").find(x=>x.id===payload.p_booking_id);if(!booking||total!==booking.price_snapshot_cents){flash("A soma deve ser exatamente "+money(booking?.price_snapshot_cents||0),"error");return}if(!confirm("Confirmar recebimento de "+money(total)+"?"))return;try{await invoke("santomen_admin_record_payment",payload,"Pagamento registrado sem duplicidade.");e.currentTarget.reset()}catch{}});
 $("#settings-form").addEventListener("submit",async e=>{e.preventDefault();const z=e.currentTarget.elements;const phone=digits(z.whatsapp.value);if(!/^55[1-9]\d{9,10}$/.test(phone)){flash("Informe WhatsApp válido: 55 + DDD + número.","error");return}if(z.closing.value<=z.opening.value){flash("Horário de encerramento inválido.","error");return}try{await mutate("settings","update",{name:z.name.value,address:z.address.value,whatsapp:phone,opening:z.opening.value,closing:z.closing.value,step_minutes:Number(z.step.value),updated_at:new Date().toISOString()},1)}catch(x){flash(x.message,"error")}});
 $("#media-form").addEventListener("submit",async e=>{e.preventDefault();const z=e.currentTarget.elements;try{const u=new URL(z.url.value);if(u.protocol!=="https:")throw Error("URL segura HTTPS obrigatória");await mutate("media","insert",{title:z.title.value.trim(),category:z.category.value.trim(),image_url:u.href,published:z.published.checked});e.currentTarget.reset()}catch(x){flash(x.message,"error")}});
}
function setupActions(){
 document.addEventListener("click",async e=>{
  const btn=e.target.closest("[data-status-id],[data-edit-service],[data-edit-barber],[data-delete-block],[data-refund],[data-toggle-media]");
  if(!btn||!currentUser)return;
  if(btn.dataset.editService){const item=filled("services").find(x=>x.id===btn.dataset.editService);if(!item)return;const f=$("#service-form").elements;f.id.value=item.id;f.name.value=item.name;f.category.value=item.category;f.price.value=(item.price_cents/100).toFixed(2);f.duration.value=item.duration_minutes;f.description.value=item.description;f.active.checked=item.is_active;$("#service-form-title").textContent="EDITAR SERVIÇO";activateTab("services");return}
  if(btn.dataset.editBarber){const item=filled("barbers").find(x=>x.id===btn.dataset.editBarber);if(!item)return;const f=$("#barber-form").elements;f.id.value=item.id;f.name.value=item.name;f.bio.value=item.bio;f.opening.value=fmtTime(item.opening);f.closing.value=fmtTime(item.closing);f.active.checked=item.is_active;$("#barber-form-title").textContent="EDITAR PROFISSIONAL";activateTab("barbers");return}
  if(btn.dataset.statusId){const status=btn.dataset.status;if(!confirm("Alterar status do atendimento para "+status+"?"))return;try{await invoke("santomen_admin_set_booking_status",{p_booking_id:btn.dataset.statusId,p_status:status},"Status atualizado com validação do servidor.")}catch(x){flash(x.message,"error")}return}
  if(btn.dataset.deleteBlock){if(!confirm("Remover este bloqueio?"))return;try{await mutate("blocks","delete",{},btn.dataset.deleteBlock)}catch(x){flash(x.message,"error")}return}
  if(btn.dataset.toggleMedia){const item=filled("media").find(x=>x.id===btn.dataset.toggleMedia);if(!item)return;try{await mutate("media","update",{published:!item.published},item.id)}catch(x){flash(x.message,"error")}return}
  if(btn.dataset.refund){const payment=filled("payments").find(x=>x.id===btn.dataset.refund);if(!payment)return;const used=filled("refunds").filter(x=>x.payment_id===payment.id).reduce((v,x)=>v+x.amount_cents,0);const max=payment.amount_cents-used;
   const amount=prompt("Valor do estorno em R$ (máximo "+money(max)+"):",(max/100).toFixed(2));if(amount===null)return;const reason=prompt("Motivo do estorno (obrigatório):","");if(reason===null)return;
   try{await invoke("santomen_admin_refund",{p_payment_id:payment.id,p_amount_cents:cents(amount.replace(",",".")),p_reason:reason},"Estorno registrado no histórico.")}catch{}return;
  }
 });
}
async function verifySession(){
 if(!db)return false;
 const {data:auth,error:authError}=await db.auth.getUser();
 if(authError||!auth?.user)return false;
 const {data:membership,error}=await db.from("santomen_admins").select("user_id").eq("user_id",auth.user.id).maybeSingle();
 if(error||!membership){await db.auth.signOut();flash("Conta autenticada, mas não autorizada como administrador.","error",true);return false}
 currentUser=auth.user;$("#admin-login").hidden=true;$("#admin-panel").hidden=false;$("#logout").hidden=false;
 await load();startPolling();return true;
}
async function start(){
 setupTabs();setupForms();setupActions();
 if(!configured){flash("O banco de dados independente da Santomen ainda não foi configurado. O painel não aceita acesso fictício ou senhas locais.","error",true);$("#login-form").querySelector('button[type="submit"]').disabled=true;return}
 try{
  const sdk=await import("https://esm.sh/@supabase/supabase-js@2.49.4?bundle");
  db=sdk.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,detectSessionInUrl:false,storage:sessionStorage,autoRefreshToken:true}});
  flash("Conexão pronta. Entre com sua conta autorizada.", "info",true);
  await verifySession();
 }catch(error){console.error(error);flash("Falha ao carregar o provedor de autenticação. Recarregue e verifique a configuração.","error",true)}
 $("#login-form").addEventListener("submit",async e=>{
  e.preventDefault();if(!db)return;const btn=e.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;
  try{const {error}=await db.auth.signInWithPassword({email:$("#login-email").value.trim(),password:$("#login-password").value});if(error)throw error;if(!await verifySession())throw Error("Sem permissão administrativa");$("#login-password").value=""}
  catch(error){flash("Acesso negado: "+error.message,"error",true)}
  finally{btn.disabled=false}
 });
 $("#logout").addEventListener("click",async()=>{stopPolling();await db.auth.signOut();currentUser=null;$("#admin-panel").hidden=true;$("#admin-login").hidden=false;$("#logout").hidden=true;flash("Sessão encerrada.","success",true)});
 db.auth.onAuthStateChange((event)=>{if(event==="SIGNED_OUT"){stopPolling();currentUser=null;$("#admin-panel").hidden=true;$("#admin-login").hidden=false;$("#logout").hidden=true}});
}
start();
