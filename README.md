# dinos-mia-chat

Slovenski spletni klepet za DROE DINOS (odpadna embalaža). Uporabniški vmesnik in BFF tečeta v tem repozitoriju; LLM in dokumenti so pri Mikrografiji (mIA).

## Kaj je notri

- Next.js App Router (TypeScript)
- Javna klepetalnica v slovenščini, opozorilo in gumb **Posreduj operaterju**
- Strežniška pot `POST /api/chat`, ki drži API ključ in kliče mIA
- Ključ nikoli ne gre v odjemalski sveženj

## Zahteve

- Node.js 20+
- npm
- API ključ Mikrografija (samo v okoljski spremenljivki)

## Lokalni zagon

```bash
cp .env.example .env.local
# vstavite MIKROGRAFIJA_DINOS_API_KEY
npm install
npm run dev
```

Odprite [http://localhost:3000](http://localhost:3000).

## Okoljske spremenljivke

| Ime | Obvezno | Opis |
| --- | --- | --- |
| `MIKROGRAFIJA_DINOS_API_KEY` | da | Bearer žeton za mIA. Samo na strežniku. |
| `MIA_BASE_URL` | ne | Privzeto `https://mia.mikrografija.si/dinos/v1` |
| `MIA_MAX_TOKENS` | ne | Privzeto `1024`, vedno vsaj `256` |
| `OPERATOR_EMAIL` | ne | Cilj mailto za posredovanje operaterju |

Datoteke `.env` / `.env.local` niso v gitu. V kodi ni `NEXT_PUBLIC_` predpon za ključ.

## BFF

`POST /api/chat`

```json
{
  "messages": [
    { "role": "user", "content": "Kaj je DROE?" }
  ]
}
```

BFF doda sistemski prompt, pokliče `POST {MIA_BASE_URL}/chat/completions` z modelom `mia` in `max_tokens >= 256`, nato vrne:

```json
{
  "message": { "role": "assistant", "content": "..." }
}
```

## Produkcija

1. Nastavite `MIKROGRAFIJA_DINOS_API_KEY` v okolju gostitelja (Vercel, Hostinger Node, Docker, …).
2. `npm run build` in `npm start`, ali povežite Git z gostiteljem, ki požene Next.js.
3. Strežnik mora imeti izhod na `mia.mikrografija.si`.
4. Ključ rotirajte pri Mikrografiji; po rotaciji posodobite samo okolje.

## Izven obsega (v1)

Prijava uporabnikov, Teams, več ključev, prave vstopnice CRM.

## Licenca

Zasebno. DINOS / lastnik repozitorija.
