# Santomen Barbearia — VYZO Studio

## Status da integração (26/10/2026)

**Backend do painel conectado ao projeto Supabase existente da HAUS Barber, com isolamento lógico por prefixos, políticas RLS e autorização administrativa independente.**

A opção de usar um projeto compartilhado foi escolhida pelo responsável. Isso **não é isolamento físico**: o mesmo projeto compartilha infraestrutura, cotas, sistema Supabase Auth e acesso de proprietários do projeto. As tabelas e operações da Santomen não utilizam os cadastros das outras barbearias.

- Site: https://vyzo-studio.github.io/SantomenBarbearia/
- Painel: https://vyzo-studio.github.io/SantomenBarbearia/admin.html
- Projeto Supabase: Haus_Barber (ID `pmhpgrdeknzbvegkrnxi`), organização `Vyzo_std`
- Banco Santomen: 11 tabelas `public.santomen_*` com Row Level Security; funções `santomen_*` e esquema privado `santomen_private`
- Autenticação: Supabase Auth compartilhado, mas autorização da Santomen exige UID explicitamente inserido em `santomen_admins`.
- **Ainda não foi criada/vinculada conta administradora Santomen**; ninguém recebeu acesso por herdar permissões da HAUS.
- **Ainda não há preços, serviços e profissionais registrados** no banco Santomen.
- Site público continua em modo **consulta de agenda pelo WhatsApp**. `enableOnlineBooking: false` desativa as chamadas de reserva no navegador, e a migração adicional revoga a execução pública das funções de agendamento.
- A configuração frontend usa somente chave pública `sb_publishable_...`. **Nunca** publicar uma chave secreta nem credenciais pessoais.

## Migrações

1. `supabase/migrations/20261024_santomen_initial.sql`: cria somente tabelas, funções e políticas da Santomen.
2. `supabase/migrations/20261026_santomen_public_booking_gate.sql`: revoga temporariamente acesso público às funções de catálogo, disponibilidade e solicitação de reserva, até homologação.

Ambas aplicadas no projeto Supabase da HAUS; sem alterações deliberadas em tabelas existentes de HAUS ou Luence.

## Etapas pendentes

1. Definir o e-mail que administrará a Santomen. Criar a conta com senha definida pelo responsável (ou vincular uma conta existente por autorização explícita).
2. Cadastrar o UID de Auth na tabela `santomen_admins`, sem conceder acesso geral ao banco.
3. Testar login real e operações: serviços, profissionais, bloqueios, agenda, lançamentos, caixa, pagamentos, estornos e histórico. Testar usuário sem permissão.
4. Cadastrar serviços, valores, duração e colaboradores reais; confirmar política de tratamento de dados e autorização de fotografias.
5. Validar disponibilidade, concorrência, proteção contra abuso, expiração de solicitações e taxas/quotas compartilhadas.
6. Liberar RPCs públicas apenas por migração revisada e definir `enableOnlineBooking: true` somente após aprovação.
7. Se a venda exigir infraestrutura exclusiva em nome do cliente, migrar posteriormente a Santomen para um projeto Supabase próprio.

## Testes

`npm install && npm run check` e `npx playwright install chromium && npm run test:browser`.

Verifique os resultados reais em https://github.com/Vyzo-Studio/SantomenBarbearia/actions.

**Limites de segurança:** RLS e políticas impedem os papéis comuns de misturar tabelas. Proprietários e operadores privilegiados do projeto Supabase compartilhado continuam podendo acessar os dados de todas as marcas.
