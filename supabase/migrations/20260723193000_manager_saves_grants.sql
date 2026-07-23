-- Correction : les policies RLS filtrent les lignes mais ne remplacent pas les GRANT de base.
-- La migration manager_saves avait oublié d'accorder les privilèges à authenticated, causant
-- "permission denied for table manager_saves" (42501) malgré des policies RLS correctes.
grant select, insert, update, delete on public.manager_saves to authenticated;
