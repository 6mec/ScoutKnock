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

O nome do domínio está escrito assim de propósito. No código não aparece: vem de `SITE_URL`. A app já faz, com `SITE_URL` num domínio próprio em https:
- **`www` reencaminha para o domínio sem www**, com o mesmo caminho.
- **O endereço `.netlify.app` de produção reencaminha para o domínio.** As pré-visualizações da Netlify (endereços com `--`, como `deploy-preview-3--site.netlify.app`) e o localhost não.
- **Com `HOME_PORTFOLIO_SLUG`:**
  - a raiz `/` mostra esse portfólio;
  - `/p/<slug>` leva a `/`;
  - o endereço oficial (canonical) e o da partilha passam a ser `/`.
- **O "Aparecer no Google" continua desligado.** Sem ele, a página leva noindex.

### 1. Netlify: acrescentar o domínio
1. No site, "Domain management" → "Add a domain" → `scoutkncok.com`. A Netlify junta também o `www`.
2. Pôr `scoutkncok.com` (sem www) como domínio principal ("Set as primary domain").
3. A Netlify mostra "Pending DNS verification" com os valores certos para o site. Se forem diferentes dos de baixo, valem os dela.

### 2. Cloudflare: DNS
Em DNS → Records, apagar registos A, AAAA ou CNAME antigos de `@` e `www` e criar:

| Tipo | Nome | Destino | Proxy |
|---|---|---|---|
| CNAME | `@` | `apex-loadbalancer.netlify.com` | **DNS only** (nuvem cinzenta) |
| CNAME | `www` | o endereço `….netlify.app` do site | **DNS only** (nuvem cinzenta) |

Na raiz, a Cloudflare "achata" o CNAME (é o que a Netlify recomenda). A alternativa é um registo A `@` → `75.2.60.5`. Com a nuvem laranja (proxy) a Netlify não consegue criar o certificado.

### 3. HTTPS
1. Netlify → "Domain management" → "HTTPS" → "Verify DNS configuration". Pode levar de minutos a algumas horas.
2. Quando estiver verificado, o certificado (Let's Encrypt, grátis) é criado sozinho ou com "Provision certificate".
3. Confirmar que `https://scoutkncok.com` e `https://www.scoutkncok.com` abrem com cadeado. **Só depois** passar ao passo 4.

### 4. Variáveis na Netlify (depois do certificado)
1. `SITE_URL` = `https://scoutkncok.com`, sem barra no fim.
2. Nova: `HOME_PORTFOLIO_SLUG` = `daniel`.
3. "Trigger deploy". A partir daqui, o `.netlify.app` reencaminha para o domínio.

Antes disto, no painel: o portfólio `daniel` tem de estar **publicado**. Sem isso, a raiz dá "não encontrado".

### 5. Supabase
Authentication → URL Configuration:
- **Site URL:** `https://scoutkncok.com`.
- **Redirect URLs:** acrescentar `https://scoutkncok.com/**`. Manter `https://….netlify.app/**` e `http://localhost:3000/**` até confirmares que está tudo bem.

### 6. Email do portfólio (opcional)
- No painel → Portfólio → Email, escreve `contacto@scoutkncok.com`.
- **Para receber:** Cloudflare → Email → "Email Routing" (grátis) → criar `contacto@` a reencaminhar para o teu email pessoal. A Cloudflare junta sozinha os registos MX e TXT.
- **Para responder como `contacto@`:** é preciso um servidor de envio (SMTP). Fica fora desta fase.

### 7. Teste no domínio
- [ ] `https://scoutkncok.com` mostra o portfólio e o endereço fica `/`.
- [ ] `https://www.scoutkncok.com/entrar` leva a `https://scoutkncok.com/entrar`.
- [ ] `https://….netlify.app/painel` leva a `https://scoutkncok.com/painel`.
- [ ] `https://scoutkncok.com/p/daniel` leva a `https://scoutkncok.com/`.
- [ ] No código da página (Ctrl+U): `canonical` = `https://scoutkncok.com/` e `noindex`.
- [ ] Partilhado no WhatsApp: título, descrição e imagem, com o link do domínio.
- [ ] Entrar, Radar e Contactos funcionam; o `{portfolio}` das mensagens dá `https://scoutkncok.com/`.
- [ ] "Esqueci-me da palavra-passe": o link do email aponta para o domínio.
- [ ] Uma pré-visualização da Netlify (pull request) continua no seu endereço próprio.
