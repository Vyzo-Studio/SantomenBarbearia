# Santomen Barbearia — VYZO Studio

**Situação: website e painel administrativo implementados em código; ambiente de produção e backend exclusivo ainda não provisionados.**

Este projeto é independente das outras marcas do estúdio. A GNG Barbearia foi consultada apenas como referência de lógica técnica; nenhum dado, credencial, cliente, pagamento, fotografia ou banco é compartilhado.

## Informações de referência

- Identidade baseada no logotipo oficial enviado: preto, branco, cinza e amarelo.
- Instagram: https://www.instagram.com/santomenbarbearia/
- WhatsApp fornecido: +55 61 99223-2839.
- Endereço indicado no Instagram: QNM 20, Conjunto A, Lote 45 — Ceilândia/DF.
- Horário indicado: segunda a sábado, 08h30–20h.
- Serviços de referência: corte masculino, barba e corte infantil.

**Endereço, horários, preços, durações e equipe devem ser confirmados com o responsável.** Não publicar fotografias de clientes sem autorização adequada.

## Componentes criados

- Site público: index.html, style.css, app.js, config.js e i18n.js.
- Logotipo: assets/logo-santomen.webp, imagem oficial fornecida.
- Painel administrativo: admin.html, admin.css e admin.js.
- SQL de instalação preparado: supabase/migrations/20261024_santomen_initial.sql.
- Termos e privacidade preliminares: termos.html, privacidade.html.
- Qualidade: tests/, playwright.config.cjs, package.json e fluxos em .github/workflows/.

### Comportamento atual

**Sem backend:** o formulário prepara uma consulta de horário pelo WhatsApp, sem dizer que houve reserva. O login administrativo permanece bloqueado para não simular autenticação ou transações. Valores desconhecidos aparecem como 'Consulte o valor'.

**Backend futuro:** as funções SQL e chamadas JS em código foram preparadas para agendamentos e um painel independente, mas não foram implantadas ou homologadas em um banco Santomen. Não tratar painel, pagamentos e agenda online como operacionais até testes reais.

**Idiomas:** cinco traduções para partes importantes da interface, ainda sem cobertura completa de conteúdo e documentos legais.

## Implantação segura — ainda pendente

1. Criar projeto Supabase **exclusivo** da Santomen, após confirmação de organização e possível custo.
2. Revisar e aplicar a migração SQL nesse projeto novo (jamais no banco GNG ou HAUS), testar RLS e concorrência.
3. Criar usuário administrador no Supabase Auth e vincular o UUID em santomen_admins com acesso mínimo; nunca salvar senhas/secret keys em código público.
4. Definir preços/durações reais, profissionais, horários, fotografias com autorização e textos legais aprovados.
5. Preencher **somente** as chaves públicas próprias do projeto em config.js; nunca colocar service-role ou credenciais secretas.
6. Testar autenticação real, reserva simultânea, bloqueios, atualização de horários, pagamentos combinados, estornos, conciliação, falhas e regressões.
7. Habilitar GitHub Pages em **Settings → Pages → Build and deployment → Source: GitHub Actions**. A automação não dispõe de token administrativo para habilitar Pages pela primeira vez.
8. Validar site publicado antes de anunciar agendamentos online e gestão financeira completos.

## Testes

Com Node.js 22+ instalado, use: npm install, npm run check, npx playwright install chromium e npm run test:browser.

Confirme o status das execuções em https://github.com/Vyzo-Studio/SantomenBarbearia/actions. Testes estáticos e de navegador não garantem funcionamento do backend ainda não provisionado.
