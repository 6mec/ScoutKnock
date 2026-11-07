# Publicar o ScoutKnock (Netlify, plano grátis)

O ScoutKnock fica num repositório **privado** do GitHub e é publicado pela Netlify a cada `git push` para `main`. As chaves vivem só no `.env.local` (computador) e nas variáveis de ambiente da Netlify. Nunca no código, no Git nem em conversas.

O `netlify.toml` diz à Netlify o comando de build (`npm run build`) e a versão do Node (22). A Netlify deteta o Next.js sozinha.

## Fase A: primeira publicação no endereço .netlify.app

### 1. GitHub
1. Criar um repositório **privado** vazio (sem README nem .gitignore).
2. No terminal, na pasta do ScoutKnock:
   ```
   git remote add origin https://github.com/<conta>/<repositorio>.git
   git push -u origin main
   ```
   O `.gitignore` já deixa de fora `.env`, `.env.local`, `.env.*.local`, `INSTRUCOES-PARA-CLAUDE.md`, `.netlify/`, `.next/` e `node_modules/`.

### 2. Netlify
1. "Add new project" → "Import an existing project" → GitHub → o repositório.
2. Antes de publicar, em "Environment variables", só estas seis (valores do `.env.local`):

   | Variável | Nota |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | |
   | `SUPABASE_SECRET_KEY` | marcar como secreta |
   | `SITE_URL` | o endereço `https://….netlify.app`, sem barra no fim |
   | `COMPANY_SOURCE` | `osm` |
   | `MARKETS_ENABLED` | `PT` |

3. "Deploy". Depois de saber o endereço `.netlify.app`, acertar o `SITE_URL` e "Trigger deploy".

**Ficam de fora da Netlify (desligado):** `SIGNUPS_ENABLED` (sem ele, ninguém cria conta), Google Places (`GOOGLE_*`), Claude (`ANTHROPIC_API_KEY`), Stripe (`STRIPE_*`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`), emails (`RESEND_API_KEY`, `EMAIL_REAL_SENDING`, `WAITLIST_EMAIL_FROM`, `WAITLIST_TOKEN_SECRET`), verificação dos sites (`SITE_CHECKS_*`, `BOT_CONTACT_*`) e sites oficiais por subdomínio (`OFFICIAL_SITES_BASE_DOMAIN`, `OFFICIAL_SITE_REMOVAL_CONTACT`).

### 3. Supabase do ScoutKnock
1. Authentication → Sign In / Providers: **desligar "Allow new users to sign up"**. A app já recusa /registar, mas sem isto alguém podia criar conta diretamente no Supabase e entrar no painel.
2. Authentication → URL Configuration:
   - Site URL: o endereço `.netlify.app`.
   - Redirect URLs: acrescentar `https://….netlify.app/**` e manter `http://localhost:3000/**`.

### 4. Teste no .netlify.app
- [ ] `/painel` sem sessão leva a `/entrar`; `/registar` leva a `/entrar`.
- [ ] Entrar no painel; Início, Projetos e Contactos abrem.
- [ ] Uma busca no Radar (OpenStreetMap), feita no browser: aparecem o servidor, os segundos e os resultados. Repetir a mesma busca: aviso "guardados neste browser" e o número de buscas não sobe.
- [ ] O portfólio em `/p/<endereço>` abre; partilhado no WhatsApp mostra título, descrição e imagem.
- [ ] "Esqueci-me da palavra-passe": o link do email aponta para o `.netlify.app`.
- [ ] No telemóvel, o selo "Powered by Netlify" não tapa a barra de baixo do painel nem o botão do WhatsApp do portfólio (a app reserva espaço por baixo).

**Selo da Netlify:** no plano grátis aparece em todas as páginas e não se pode esconder. Para o tirar: plano pago da Netlify ou outro alojamento.

## Fase B: domínio scoutkncok.com

Fica para depois de testada a Fase A. Plano aprovado: domínio sem www (o www reencaminha), a raiz `/` abre o portfólio, `/p/daniel` leva a `/`, o `.netlify.app` reencaminha para o domínio, e o `SITE_URL` só muda depois de o certificado HTTPS estar ativo. O `.netlify.app` fica nos Redirect URLs do Supabase até o Daniel confirmar.
