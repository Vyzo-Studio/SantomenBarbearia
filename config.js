/** Santomen public configuration — no backend linked. 
 * Owner requested removal from the HAUS shared Supabase project on 2026-10-26.
 * Public scheduling stays via WhatsApp; admin panel is disabled.
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
  supabaseUrl: "",
  supabasePublishableKey: ""
});
window.SANTOMEN_DEFAULT_SERVICES = Object.freeze([
  {id:"corte",name:"Corte masculino",description:"Corte personalizado para o seu estilo.",category:"Cortes",price_cents:null,duration_minutes:null},
  {id:"barba",name:"Barba",description:"Acabamento e cuidado nos detalhes.",category:"Barba",price_cents:null,duration_minutes:null},
  {id:"infantil",name:"Corte infantil",description:"Estilo e atenção para os pequenos.",category:"Cortes",price_cents:null,duration_minutes:null}
]);
