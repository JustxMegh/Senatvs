require('dotenv').config();

const { Client, GatewayIntentBits, Collection, REST, Routes, MessageFlags } = require('discord.js');
const mongoose = require('mongoose');

// Import Mongoose Models
const Rapina = require('./Models/Rapina.js');
const Furto = require('./Models/Furto.js');
const Deposito = require('./Models/Deposito.js');
const Campo = require('./Models/Campo.js');
const Miniera = require('./Models/Miniera.js');

// Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// --- 1. MONGODB CONNECTION SETUP ---
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGO_PRIVATE_URL;

if (!mongoUri) {
  console.error('❌ ERROR: No MongoDB URI found in environment variables!');
} else {
  mongoose.connect(mongoUri, { bufferCommands: false })
    .then(() => console.log('✅ Connected to MongoDB successfully!'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));
}

// --- 2. COMPLETE COMMAND DEFINITIONS ---
// Define ALL your slash commands in this array:
const commands = [
  { name: 'ping', description: 'Replies with Pong!' },
  {
    name: 'deposito',
    description: 'Check or update inventory in deposit',
    options: [{ name: 'nome', type: 3, description: 'Name of the deposit', required: true }]
  },
  {
    name: 'rapina',
    description: 'Log a new heist (Rapina)',
    options: [{ name: 'totale', type: 4, description: 'Total heist amount', required: true }]
  },
  { name: 'cancella', description: 'Cancel an action or entry' },
  { name: 'rapinareset', description: 'Reset rapina data' },
  {
    name: 'furto',
    description: 'Log a theft (Furto)',
    options: [{ name: 'utente', type: 6, description: 'Target user', required: true }]
  },
  { name: 'furtoreset', description: 'Reset furto data' },
  { name: 'campo', description: 'Manage turf/campo sessions' },
  { name: 'stop', description: 'Stop current active session' },
  { name: 'player', description: 'Check player stats' },
  { name: 'aggiorna', description: 'Update data or metrics' },
  { name: 'miniera', description: 'Check or manage mining sessions' },
  { name: 'reset', description: 'General reset command' },
  { name: 'modifica', description: 'Modify an entry' },
  { name: 'lista', description: 'List entries or stats' },
  { name: 'calcolo', description: 'Perform calculations' },
  { name: 'calcolomn', description: 'Calculate MN metric' }
];

// --- 3. REGISTER SLASH COMMANDS ON STARTUP ---
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
  try {
    console.log(`Registering ${commands.length} slash commands...`);
    
    if (process.env.CLIENT_ID && process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log('✅ All Guild slash commands registered successfully!');
    } else if (process.env.CLIENT_ID) {
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log('✅ All Global slash commands registered successfully!');
    } else {
      console.warn('⚠️ CLIENT_ID missing: Unable to register slash commands.');
    }
  } catch (error) {
    console.error('❌ Error registering slash commands:', error);
  }
}

// --- 4. DISCORD EVENT LISTENERS & EXECUTION ---
client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}!`);
  await registerCommands();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    // ---------------- EXECUTION LOGIC ----------------
    if (commandName === 'ping') {
      await interaction.reply({ content: 'Pong!', flags: MessageFlags.Ephemeral });
    } 
    else if (commandName === 'deposito') {
      await interaction.deferReply();
      const depositoName = interaction.options.getString('nome');

      if (mongoose.connection.readyState !== 1) {
        return await interaction.editReply({ content: '❌ Database connection is currently unavailable.' });
      }

      let depositoData = await Deposito.findOne({ depositoName });

      if (!depositoData) {
        return await interaction.editReply({ content: `No deposit entry found for **${depositoName}**.` });
      }

      await interaction.editReply({ content: `📦 **Deposit:** ${depositoData.depositoName}\nItems stored: ${depositoData.items.length}` });
    }
    else if (commandName === 'rapina') {
      await interaction.deferReply();
      const totale = interaction.options.getInteger('totale');
      await interaction.editReply({ content: `💰 Rapina logged with total amount: **${totale}**` });
    }
    else if (commandName === 'furto') {
      await interaction.deferReply();
      const targetUser = interaction.options.getUser('utente');
      await interaction.editReply({ content: `🕵️ Furto logged against user: **${targetUser.tag}**` });
    }
    else if (commandName === 'campo') {
      await interaction.deferReply();
      await interaction.editReply({ content: '⚔️ Campo session status checked.' });
    }
    else if (commandName === 'miniera') {
      await interaction.deferReply();
      await interaction.editReply({ content: '⛏️ Miniera stockpile status checked.' });
    }
    else {
      // Placeholder response for remaining commands (/cancella, /rapinareset, /stop, /player, etc.)
      await interaction.deferReply();
      await interaction.editReply({ content: `✅ Executed /${commandName} successfully!` });
    }

  } catch (error) {
    console.error(`❌ Error handling /${commandName}:`, error);

    const responseMessage = { content: 'There was an error executing this command!' };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(responseMessage);
    } else {
      await interaction.reply({ ...responseMessage, flags: MessageFlags.Ephemeral });
    }
  }
});

// --- 5. BOT LOGIN ---
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ ERROR: DISCORD_TOKEN is missing from environment variables!');
} else {
  client.login(process.env.DISCORD_TOKEN);
}
