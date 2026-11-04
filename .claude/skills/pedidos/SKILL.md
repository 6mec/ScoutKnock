---
name: pedidos
description: Trata os pedidos de trabalho que o Daniel guardou na app (botão "Pedir trabalho"): sites demo, sites com marcações e apps à medida para empresas. Usar quando o Daniel escrever /pedidos ou pedir para fazer os pedidos.
---

# Pedidos de trabalho

O Daniel guarda pedidos na app (ficha do contacto ou editor do site demo → "Pedir trabalho"). Aqui fazes cada um. Responde sempre em português de Portugal.

## Ferramenta

Tudo passa por `node scripts/pedidos.mjs` (chave de serviço do `.env.local`; o script nunca mostra chaves, e tu também não):

- `list` — pedidos por fazer e em curso, cada um com a ficha (`contact`) e o site demo (`demo`), se existirem.
- `show <id>` — um pedido.
- `start <id>` — marca "em curso". Faz isto antes de começar cada pedido.
- `update-demo <id> <ficheiro.json>` — escreve na demo do pedido. Campos aceites: `headline` (≤120), `intro` (≤400), `subheadline` (≤200), `cta_label` (≤40), `about` (≤800), `services` (≤6 de `{title ≤60, description ≤160}`), `highlights` (≤3, igual), `booking_enabled` (true/false), `booking_hours` (≤120), `niche_style` (uma das 13 identidades) e `template` (`classic`, `bold`, `soft`). Escreve o JSON num ficheiro temporário da pasta de rascunho, nunca no projeto.
- `done <id> "<nota>" [url]` — marca "feito", com uma nota curta do que fizeste e, se houver, o endereço para ver.

## Passos

1. Corre `list`. Se não houver pedidos, diz isso e pára.
2. Mostra ao Daniel a lista (empresa, tipo, uma linha do pedido) e trata-os por ordem, um de cada vez.
3. Para cada pedido, conforme o `kind`:
   - **`site` e `site_booking`**: precisa de `demo`. Se não houver, diz ao Daniel para criar o site demo dessa empresa na app e passa ao seguinte.
     - Escreve os textos a partir do `brief` e da demo: título, frase de apoio, botão, apresentação, "Sobre", serviços e destaques. Usa a identidade do nicho (`niche_style`) e o tom dela. Para `site_booking`, põe `booking_enabled: true` e `booking_hours` só se o horário vier no `brief`.
     - Grava com `update-demo` e marca com `done`, com o link da demo (`<site_url>/demo/<slug>`) ou o do editor (`<site_url>/painel/demos/<demo_id>`).
   - **`app`**: é um projeto à parte, fora deste repositório, em `../ScoutKnock-clientes/<nome-da-empresa-em-minúsculas-com-hífens>/`.
     - Antes de escrever código, propõe ao Daniel um plano curto (o que a app faz, ecrãs, tecnologia, o que custa alojar) e espera pela aprovação. Não decidas preços.
     - Depois de aprovado, cria o projeto, corre-o e mostra-o. Marca `done` com a nota e o caminho da pasta.
4. No fim, um resumo: o que ficou feito, o que ficou à espera e porquê. Lembra o Daniel de que, em "Pedidos", "Passar a projeto" regista o trabalho no ecrã de Projetos (valores e datas escreve-os ele).

## Regras

- Só os factos do `brief`, da ficha e da demo. Não inventes preços, prazos, números, prémios, anos de experiência, depoimentos nem clientes. Se faltar um dado importante, pergunta ao Daniel em vez de o inventar.
- Tudo o que escreves é texto de venda em nome da empresa: claro, simples, sem promessas de resultados.
- Nunca mexas no dono da demo, no endereço, na validade nem no aviso de proposta não oficial: isso é da app.
- Não guardes dados pessoais de clientes da empresa.
- Uma app que guarde dados de clientes da empresa (nomes, telefones, marcações) precisa de conversa com o jurista antes de ir para produção: diz isso ao Daniel no plano.
- Não mudes o estado de um pedido que não trataste.
