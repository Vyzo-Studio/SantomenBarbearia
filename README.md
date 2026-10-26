# Santomen Barbearia — VYZO Studio

## Backend exclusivo ativado — 26/10/2026

A Santomen utiliza exclusivamente o projeto Supabase `Santomen_Barbearia` (ref: `whsitzmpotmhbyqpeimh`), organização separada da HAUS.

- Site: https://vyzo-studio.github.io/SantomenBarbearia/
- Painel: https://vyzo-studio.github.io/SantomenBarbearia/admin.html
- Banco: 11 tabelas `santomen_*`, com políticas de segurança RLS.
- Gestão: Supabase Auth + autorização explícita por `santomen_admins`. Nenhuma conta administrativa foi criada automaticamente.
- Agendamento público: `enableOnlineBooking: false`, consultas via WhatsApp. RPCs públicas de reserva/catálogo/horários permanecem com execução revogada até completar profissionais, preços e demais validações.
- Nunca colocar uma senha ou chave `service_role` no navegador.
- A HAUS não recebeu alterações.
- Migrações históricas de exclusão do banco compartilhado se aplicam **somente à HAUS antiga** e nunca devem ser executadas no projeto exclusivo.

Para finalizar o acesso, criar usuário em Authentication → Users, com senha definida diretamente pelo administrador, e registrar seu UID em `public.santomen_admins`. Depois testar as funções administrativas e cadastrar serviços, preços e profissionais reais antes de abrir reservas online.

Testes: `npm run check`; `npm run test:browser`.
