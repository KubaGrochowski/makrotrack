# Makrotrack

Dziennik posiłków z makro. Czysty HTML/CSS/JS w jednym pliku, bez budowania i bez zależności.

Na żywo: https://kubagrochowski.github.io/makrotrack/

## Co jest w aplikacji

- **Posiłki**: własne przepisy (nazwa, zdjęcie, pory: śniadanie / obiad / kolacja, składniki z gramaturą i makro na 100 g). Kalorie liczą się same: białko i węglowodany 4 kcal/g, tłuszcz 9 kcal/g. Sortowanie i sekcje według pory.
- **Dziennik**: tydzień i posiłki zjedzone w wybranym dniu, porcje (×0,5, ×1,5…).
- **Pasek na dole**: kcal, białko, tłuszcz i węglowodany dnia względem zapotrzebowania; **+** to szybkie dodanie bez zapisywania posiłku.
- **Ustawienia** (zębatka): zapotrzebowanie i wylogowanie.

## Konto i dane (Supabase)

Logowanie e-mailem i hasłem w tym samym projekcie Supabase co [hbtrack](https://github.com/KubaGrochowski/hbtrack), więc działa to samo konto. Dane są w osobnej tabeli `public.makro_items`: jeden wiersz na posiłek (`m:<id>`), dzień (`d:<rrrr-mm-dd>`) i zapotrzebowanie (`goals`). Zmiany zapisują się od razu na urządzeniu i wysyłają w tle; bez internetu czekają w kolejce. Inne urządzenia pobierają zmiany po powrocie do aplikacji i co 30 s.

Tabelę tworzy się raz, w Supabase → SQL Editor:

```sql
create table public.makro_items (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.makro_items enable row level security;
create policy "makro_items: własne wiersze" on public.makro_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

W kodzie jest tylko klucz publiczny (`sb_publishable_…`); kluczy `service_role`/secret nie wolno tu dodawać.

## Uruchomienie lokalnie

```bash
npx -y serve -l 5174 .
```

i otwórz http://localhost:5174.
