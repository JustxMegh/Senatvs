# Discord Log Bot

Bot Discord per registrare rapina, furto, campo, deposito, miniera e conto,
con dati salvati su MongoDB e pensato per essere ospitato su Railway.

## Struttura del progetto

```
src/
  index.js                # Avvio del bot
  deploy-commands.js       # Registra gli slash command su Discord
  config.js                # Variabili d'ambiente
  db/connect.js             # Connessione MongoDB
  models/                   # Schema Mongoose (uno o piu' per gruppo)
  utils/                    # Costanti, permessi, parsing, embed, servizi condivisi
  handlers/                 # Registro comandi + router delle interazioni
  commands/
    rapina/                 # /rapina, /rapinareset, /cancella rapina, /lista rapina, /calcolo soldisporchi
    furto/                  # /furto, /furtoreset, /cancella furto, /lista furti
    campo/                  # /campo, /player campo, /stop campo, /lista campo
    deposito/                # /aggiorna deposito, /deposito, /lista deposito
    miniera/                 # /miniera, /player miniera, /stop miniera, /calcolo minerali,
                              # /lista minerali, /reset minerali, /modifica minerali
    conto/                   # /modifica conto
```

## 1. Crea il bot su Discord

1. Vai su https://discord.com/developers/applications e crea una nuova applicazione.
2. Nella sezione "Bot", crea un bot e copia il **token**.
3. Nella sezione "OAuth2" > "General", copia il **Client ID**.
4. Invita il bot al tuo server con i permessi: `applications.commands` e `bot`
   (permessi minimi: Invia messaggi, Incorpora link, Usa comandi slash).

## 2. Configura le variabili d'ambiente

Copia `.env.example` in `.env` e compila:

```
DISCORD_TOKEN=il-tuo-token
CLIENT_ID=il-client-id-della-tua-app
DEV_GUILD_ID=id-server-per-test (opzionale, per registrare i comandi istantaneamente)
MONGODB_URI=la-tua-stringa-di-connessione-mongodb
```

## 3. Installa le dipendenze e registra i comandi

```bash
npm install
npm run deploy   # registra gli slash command su Discord
npm start        # avvia il bot
```

## 4. Deploy su Railway

1. Crea un nuovo progetto su Railway e collega questo repository GitHub.
2. Aggiungi un plugin MongoDB al progetto (o usa un cluster MongoDB Atlas) e
   copia la connection string nella variabile `MONGODB_URI` del progetto Railway.
3. Aggiungi anche `DISCORD_TOKEN` e `CLIENT_ID` nelle variabili d'ambiente di Railway.
4. Imposta il comando di avvio su `npm start` (Railway lo rileva di solito in automatico da `package.json`).
5. Esegui `npm run deploy` una volta (in locale, puntando allo stesso `MONGODB_URI`/token,
   oppure tramite la shell di Railway) ogni volta che aggiungi o modifichi un comando.

## ID configurati

Tutti gli ID di ruolo e canale usati dal bot si trovano in un unico posto:
`src/utils/constants.js`. Se un ruolo o canale cambia, modifica solo questo file.

## Note e assunzioni fatte in fase di sviluppo

- **/furto** e **/deposito**: essendo i menu a tendina di Discord limitati a 5 valori
  per apertura di un modulo, puoi selezionare al massimo 5 oggetti alla volta.
- **/aggiorna deposito**: per permettere nomi oggetto liberi (non essendo una lista fissa),
  gli oggetti si inseriscono come testo libero, uno per riga, nel formato `Nome: quantita'`.
- **/stop campo** (perso) e **/miniera** (fine sessione): stesso formato di inserimento libero
  per armi perse / minerali raccolti.
- **/furtoreset** e i comandi `/cancella furto` / `/lista furti` non sono stati vincolati
  a nessun ruolo, perche' non e' stato specificato durante la progettazione — se vuoi
  restringerli, basta aggiungere `requireRole(...)` come negli altri comandi.
