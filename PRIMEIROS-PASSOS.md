# Primeiros passos com o Claude Code

Esta pasta já está preparada: tem o `CLAUDE.md` (as instruções do projeto), o plano em `docs/plano.md`, um `.gitignore` e um `.env.example`.

## 1. Instalar o Claude Code

Segue a documentação oficial, porque os comandos mudam com o tempo:
https://docs.claude.com/en/docs/claude-code/overview

## 2. Iniciar o Git nesta pasta

Abre um terminal dentro da pasta `ScoutKnock` e corre:

```
git init
git add .
git commit -m "Projeto inicial ScoutKnock"
```

O Git guarda o histórico. Se algo correr mal, voltas atrás.

## 3. Abrir o Claude Code na pasta

No mesmo terminal, escreve `claude` e carrega Enter. Ele lê o `CLAUDE.md` sozinho. Para confirmares, escreve `/memory` e vês os ficheiros que carregou.

## 4. Primeira mensagem

Cola isto:

> Lê o CLAUDE.md e o docs/plano.md. Estamos no dia 1 da semana 1. Propõe-me um plano curto para criar o projeto Next.js com TypeScript e Tailwind, ligado ao Supabase com login por email e Google. Não escrevas código ainda: quero aprovar o plano primeiro.

## 5. Como trabalhar a cada dia

1. Uma tarefa pequena de cada vez (ex.: "login com Google", não "faz a plataforma").
2. Pede sempre um plano e aprova antes de ele escrever código.
3. Quando funcionar, faz um commit.
4. Se ele fizer uma pergunta de negócio (preço, texto, lei), traz-a ao chat com o Claude e leva a resposta de volta.
5. Quando decidirem uma regra nova, pede-lhe: "Acrescenta isto ao CLAUDE.md".

## Segurança

- As chaves (Stripe, Supabase, Google, Claude) vão só para o ficheiro `.env.local`. Copia o `.env.example` para `.env.local` e preenche lá.
- Nunca cole chaves em conversas.
- Instala só plugins e skills de fontes em que confias.
