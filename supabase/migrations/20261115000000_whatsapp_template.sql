-- Mensagem do "Chamar no WhatsApp", escrita pelo freelancer. Vazio usa o modelo da app.
-- {nome} é trocado pelo nome da empresa quando o WhatsApp abre.
alter table public.profiles
  add column whatsapp_template text check (char_length(whatsapp_template) <= 1000);

grant update (whatsapp_template) on table public.profiles to authenticated;
