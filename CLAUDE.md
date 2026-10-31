# ScoutKnock

Plataforma web para freelancers (PT e BR) encontrarem empresas locais que precisam do serviço deles. O freelancer escolhe serviço + nicho + localidade, vê empresas reais com uma nota de oportunidade, recebe uma mensagem de abordagem por IA e mostra um site demo feito para aquela empresa.

Dono do projeto: Daniel (Portugal). Responde-lhe em português de Portugal. Plano completo em @docs/plano.md.

## Stack

- Next.js (App Router) + TypeScript + Tailwind, alojado na Vercel
- Supabase: Postgres + autenticação (email e Google)
- Stripe: subscrições (packs) + faturação certificada via InvoiceXpress ou Moloni (PT)
- Google Places API (oficial) para dados das empresas
- API do Claude para mensagens de abordagem
- Resend para emails do sistema

## Comandos

Preencher quando o projeto existir (instalar, dev, build, test, lint).

## Regras fixas

- Nunca escrever chaves ou segredos no código. Usar `.env.local` (fora do Git) e manter `.env.example` atualizado.
- Dados de empresas só pela API oficial do Google Places. Nada de scraping do Google Maps ou Instagram.
- Guardar só dados públicos e comerciais das empresas (RGPD).
- Envio de mensagens é sempre manual e um a um (link wa.me ou email aberto). Nunca envio automático em massa.
- Interface em português (PT e BR) e inglês, com textos num ficheiro de traduções e não escritos à mão nos componentes.
- Cada site demo tem aviso "proposta não oficial" até ser publicado como oficial, e é apagado ao fim de 30 dias se não for aceite.
- Nenhuma funcionalidade é anunciada como disponível sem estar a funcionar.
- O custo da API por utilizador não pode passar 30% do preço do pack: respeitar sempre os limites de buscas e demos por pack.

## Como trabalhar

- Uma tarefa de cada vez. Antes de escrever código, propor um plano curto e esperar aprovação.
- Depois de cada passo que funcione: correr testes e lint, e sugerir um commit com mensagem clara.
- Perguntas de negócio (preços, textos de marketing, decisões legais) não se decidem aqui: devolver ao Daniel.
- Âmbito da versão 1 e ordem das tarefas: ver @docs/plano.md. O que está marcado como versão 2 não se constrói agora.
