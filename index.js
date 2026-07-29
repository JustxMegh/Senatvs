const { Client, GatewayIntentBits } = require('discord.js');
const { token } = require('./config');
const { connectDB } = require('./db/connect');
const { buildRegistry } = require('./handlers/commandRegistry');
const { handleInteraction } = require('./handlers/interactionRouter');

async function main() {
  await connectDB();

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  const registry = buildRegistry();

  client.once('clientReady', () => {
    console.log(`✅ Bot online come ${client.user.tag}`);
  });

  client.on('interactionCreate', (interaction) => handleInteraction(interaction, registry));

  await client.login(token);
}

main().catch((err) => {
  console.error('❌ Errore avvio bot:', err);
  process.exit(1);
});
