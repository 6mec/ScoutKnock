-- Quando foi gerado o seguimento. Só há um por empresa, por isso nunca volta a null.
alter table public.contacts add column follow_up_at timestamptz;

grant update (follow_up_at) on table public.contacts to authenticated;
