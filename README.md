# Hive

En webbapp-implementation av **Hive**, det abstrakta strategispelet för två
spelare som spelas med sexkantiga insektsbrickor istället för ett bräde.
Varje spelare använder sin egen telefon, platta eller dator — öppna samma
rum i en webbläsare på båda enheterna och spela tillsammans över nätverket.

Pjäser: Bidrottning 🐝 (1), Skalbagge 🪲 (2), Gräshoppa 🦗 (3), Spindel 🕷️
(2), Soldatmyra 🐜 (3) per spelare. Alla regler från grundspelet är
implementerade: placeringsordning, den tvingade bidrottning-senast-drag-4-
regeln, varje insekts rörelsemönster, en-kupa-regeln, rörelsefrihets­regeln
(glid-spärren), samt vinst-/oavgjort-avgörande.

## Projektstruktur

Det här är ett npm-workspaces-monorepo:

- `packages/shared` — Hive-regelmotorn (TypeScript, ramverksfri) och
  protokolltyperna för klient/server-kommunikationen. Har sin egen
  enhetstestsvit.
- `packages/server` — en Express + Socket.IO-server som håller spelrummen
  och är den auktoritativa domaren för varje drag.
- `packages/client` — en React + Vite-webbapp (mobilanpassad) som ritar upp
  hexbrädet och pratar med servern via Socket.IO.

## Installation

```bash
npm install
```

## Köra lokalt (utveckling)

Det delade paketet behöver byggas en gång (server/klient importerar dess
kompilerade utdata):

```bash
npm run build -w packages/shared
```

Kör sedan, i två terminaler:

```bash
npm run dev:server   # startar API/socket-servern på port 3001
npm run dev:client    # startar Vite-devservern på port 5173
```

Öppna `http://localhost:5173` i en webbläsare. På en annan enhet i samma
Wi-Fi-nätverk, använd datorns lokala IP-adress istället för `localhost`,
t.ex. `http://192.168.1.23:5173`, och sätt `VITE_SERVER_URL` innan du
startar klientens devserver om enheterna inte kan lista ut serveradressen
automatiskt:

```bash
VITE_SERVER_URL=http://192.168.1.23:3001 npm run dev:client
```

## Köra i produktion (en enda server)

Servern kan även servera den byggda klienten direkt, så att båda
spelarna bara öppnar en URL:

```bash
npm run build            # bygger shared, server och client
node packages/server/dist/index.js
```

Öppna sedan `http://<server-ip>:3001` på båda enheterna.

### Deploy via Render

Repot innehåller en `render.yaml`-blueprint. Koppla GitHub-repot i Render
(**New +** → **Blueprint**), välj branch, och Render bygger och startar
appen automatiskt enligt kommandona ovan.

## Så spelar du

1. En spelare trycker på **Starta nytt spel** och delar den 4-teckens
   rumskoden med den andra spelaren.
2. Den andra spelaren anger koden och trycker på **Gå med i spel**.
3. Vit börjar. På din tur trycker du på en pjäs i ditt förråd för att
   placera den (brädet visar giltiga rutor), eller trycker på en av dina
   pjäser som redan ligger på brädet för att flytta den (giltiga mål
   markeras). Tryck på en markerad ruta för att bekräfta.
4. Nyp ihop fingrarna eller använd +/−-knapparna för att zooma, dra för att
   panorera, och tryck på ⦿-knappen för att centrera vyn på kupan.
5. Omringa motståndarens Bidrottning på alla sex sidor för att vinna.

Varje webbläsare kommer ihåg sin plats (färg) i ett rum via `localStorage`,
så att ladda om sidan ansluter dig till samma spel igen. Med
"lämna spelet"-knappen i statusfältet kan du när som helst lämna rummet och
gå tillbaka till startskärmen.

## Testning

```bash
npm test   # kör regelmotorns enhetstestsvit (vitest)
```
