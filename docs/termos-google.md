# Termos do Google Places — o que se pode guardar

Resumo feito a 31/10/2026 a partir das páginas oficiais. **Não é aconselhamento jurídico**: validar com um jurista antes de usar dados reais. Os termos mudam; reconfirmar antes do lançamento.

Fontes:
- Termos de serviço da plataforma (secção 3.2.3): https://cloud.google.com/maps-platform/terms
- Termos específicos por serviço (secção B.14, Places API): https://cloud.google.com/maps-platform/terms/maps-service-terms
- Políticas e atribuições do Places API: https://developers.google.com/maps/documentation/places/web-service/policies

## O que dizem

1. **Place ID:** pode ser guardado **indefinidamente**.
2. **Latitude e longitude:** só podem ficar em cache até **30 dias consecutivos**, depois têm de ser apagadas.
3. **Resto dos dados** (nome, morada, telefone, site, avaliações, horário): **não** se pode guardar, pré-carregar nem pôr em cache, salvo exceções expressas.
4. **Copiar e guardar nomes de empresas, moradas ou avaliações** está listado nos termos como exemplo de "scraping" proibido (3.2.3(a)).
5. **Não usar** o conteúdo do Google "num serviço de listagens ou diretório" nem "para criar ou aumentar um produto de publicidade" (3.2.3(d)).
6. **Atribuição:** mostrar a atribuição do Google onde os dados aparecem e, em mapas, usar um mapa Google.
7. Não encontrei referência explícita a "listas de contacto" ou "prospeção". A leitura mais próxima são os pontos 4 e 5.

## O que isto quer dizer para o ScoutKnock

Risco real: o CRM (Contactos) e os sites demo guardam nome, morada e contacto de empresas vindos do Google. Pelos termos, isso **não está claramente permitido**.

Opções, da mais segura para a menos:
- **A. Guardar só o `place_id`** e ir buscar os detalhes à API de cada vez que o freelancer abre o contacto. Seguro, mas cada abertura custa uma chamada.
- **B. Dados escritos pelo freelancer:** o freelancer escreve ou cola o que ele próprio obteve (notas, estado, contacto confirmado por ele). O que ele introduz é dele, não do Google. Os dados do Google só aparecem em ecrã, sem serem copiados para a base de dados.
- **C. Pedir autorização ao Google** (contacto comercial) para o caso de uso. Sem garantia de resposta.
- **D. Fonte alternativa** (por exemplo, o registo público de empresas) para os dados de contacto, e o Google só para descobrir e avaliar.

Recomendação provisória: **A + B** (place_id guardado, notas e estados do freelancer guardados, dados do Google lidos na hora). Os sites demo devem usar dados que o freelancer confirma ou escreve, e não uma cópia guardada do Google.

## A validar com jurista
- Se o uso de "listas de prospeção" cai ou não nas restrições 4 e 5.
- Como tratar a atribuição quando não se mostra mapa.
- Se a opção B é suficiente para os sites demo.
