/** Santomen public configuration — exclusive backend for administration. 
 * The HAUS project is not connected.
 * Public scheduling stays via WhatsApp; online booking stays disabled until staff and services are set.
 */
window.SANTOMEN_CONFIG = Object.freeze({
  name: "Santomen Barbearia",
  phone: "5561992232839",
  instagram: "https://www.instagram.com/santomenbarbearia/",
  address: "St. M QNM 20, Loja 02 — Ceilândia, Brasília/DF, 72210-201",
  timezone: "America/Sao_Paulo",
  businessDays: [1,2,3,4,5,6],
  opening: "08:30",
  closing: "20:00",
  stepMinutes: 30,
  // Public online bookings stay off until verified prices, staff and security controls.
  enableOnlineBooking: false,
  supabaseUrl: "https://whsitzmpotmhbyqpeimh.supabase.co",
  supabasePublishableKey: "sb_publishable_tBP23AUm49uxvQ8A9dPFeQ_kfykPCtr"
});
window.SANTOMEN_DEFAULT_SERVICES = Object.freeze([
  {id:"corte",name:"Corte masculino",description:"Corte personalizado para o seu estilo.",category:"Cortes",price_cents:null,duration_minutes:null},
  {id:"barba",name:"Barba",description:"Acabamento e cuidado nos detalhes.",category:"Barba",price_cents:null,duration_minutes:null},
  {id:"infantil",name:"Corte infantil",description:"Estilo e atenção para os pequenos.",category:"Cortes",price_cents:null,duration_minutes:null}
]);
