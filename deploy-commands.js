const { REST, Routes } = require('discord.js');
const { token, clientId, devGuildId } = require('./config');
const { buildRegistry } = require('./handlers/commandRegistry');

async function deploy() {
  if (!token || !clientId) {
    throw new Error('DISCORD_TOKEN and CLIENT_ID must be set in your .env before deploying commands.');
  }

  const { slashCommandsData } = buildRegistry();
  const rest = new REST({ version: '10' }).setToken(token);

  console.log(`Registrando ${slashCommandsData.length} comandi...`);

  if (devGuildId) {
    // Instant registration to a single guild - great for development.
    await rest.put(Routes.applicationGuildCommands(clientId, devGuildId), { body: slashCommandsData });
    console.log(`✅ Comandi registrati sul server di sviluppo ${devGuildId}`);
  } else {
    // Global registration - can take up to ~1 hour to propagate everywhere.
    await rest.put(Routes.applicationCommands(clientId), { body: slashCommandsData });
    console.log('✅ Comandi registrati globalmente (la propagazione puo\' richiedere fino a 1 ora)');
  }
}

deploy().catch((err) => {
  console.error('❌ Errore durante la registrazione dei comandi:', err);
  process.exit(1);
});
