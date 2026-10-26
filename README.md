# Santomen Barbearia — VYZO Studio

## Integração compartilhada desfeita (26/10/2026)

Por solicitação do proprietário, o site da Santomen **não utiliza mais o Supabase compartilhado da HAUS Barber**.

- Site público: https://vyzo-studio.github.io/SantomenBarbearia/
- O site e suas mídias permanecem no repositório, com consultas de horários via WhatsApp.
- `config.js`: `supabaseUrl` e `supabasePublishableKey` vazios; `enableOnlineBooking: false`.
- O painel `admin.html` permanece disponível como código, mas o login e todas as ações de banco estão inativos sem infraestrutura própria.
- A migração `supabase/migrations/20261026_santomen_remove_from_haus.sql` remove exclusivamente funções, tabelas e esquema privado da Santomen do projeto Supabase da HAUS.
- As migrações antigas permanecem como histórico de código, **não devem ser reaplicadas na HAUS**.
- Usuários de `auth.users` e a infraestrutura HAUS não foram modificados.
- Antes da remoção não havia administradores, profissionais, serviços, reservas, pagamentos ou mídias cadastradas pela Santomen (apenas a configuração inicial).

### Para uma futura integração
Criar projeto Supabase independente e autorizado pela Santomen, cadastrar administrador, serviços e profissionais reais, revisar segurança e testar todos os fluxos antes de reativar reserva online.

### QA
`npm install && npm run check`. Para testes de navegador: `npx playwright install chromium && npm run test:browser`.
