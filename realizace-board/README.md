# Centrální nástěnka realizací (MVP)

Jednoduchý frontend prototyp interní aplikace inspirované Trello stylem.

## Co umí
- Správa uživatelů s jednotně pojmenovanými rolemi v češtině.
- Zakládání zakázek/realizací s políčky:
  - název
  - popis
  - klient
  - odhadovaná cena
  - adresa
  - stav zakázky
  - přiřazení pracovníci
- Přidávání úkolů k jednotlivým zakázkám.
- Centrální nástěnka rozdělená do sloupců **K vyřízení / Probíhá / Hotovo**.
- Uložení dat do `localStorage`.

## Rychlé spuštění
```bash
cd realizace-board
python3 -m http.server 4173
```
Pak otevřete: `http://localhost:4173`.

> Poznámka: Jde o MVP prototyp bez přihlášení a bez backendu. Hodí se jako základ pro další rozvoj.
