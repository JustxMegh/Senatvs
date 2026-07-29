require('dotenv').config(); // Load environment variables first

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

client.commands = new Collection();

// --- 1. MONGODB CONNECTION SETUP ---
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGO_PRIVATE_URL;

if (!mongoUri) {
  console.error('❌ ERROR: No MongoDB URI found in environment variables!');
} else {
  mongoose.connect(mongoUri, {
    bufferCommands: false, // Prevents 10s buffering timeouts if DB disconnects
  })
  .then(() => console.log('✅ Connected to MongoDB successfully!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));
}

// --- 2. SLASH COMMANDS DEFINITION ---
const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
  {
    name: 'deposito',
    description: 'Check or update inventory in deposit',
    options: [
      {
        name: 'nome',
        type: 3, // String
        description: 'Name of the deposit',
        required: true,
      },
    ],
  },
  // Add any additional command definitions here...
];

// --- 3. REGISTER SLASH COMMANDS ON STARTUP ---
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
  try {
    console.log('Registering slash commands...');
    
    // Registering to a specific Guild (Instant update)
    if (process.env.CLIENT_ID && process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log('✅ Guild slash commands registered successfully!');
    } else if (process.env.CLIENT_ID) {
      // Global registration (fallback if GUILD_ID is not provided)
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log('✅ Global slash commands registered successfully!');
    } else {
      console.warn('⚠️ CLIENT_ID missing: Unable to register slash commands.');
    }
  } catch (error) {
    console.error('❌ Error registering slash commands:', error);
  }
}

// --- 4. DISCORD EVENT LISTENERS ---
client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}!`);
  await registerCommands();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    if (commandName === 'ping') {
      await interaction.reply({ content: 'Pong!', flags: MessageFlags.Ephemeral });
    } 
    else if (commandName === 'deposito') {
      // Defer reply immediately so Discord doesn't time out within 3 seconds
      await interaction.deferReply();

      const depositoName = interaction.options.getString('nome');

      // Safe DB Query
      if (mongoose.connection.readyState !== 1) {
        return await interaction.editReply({ 
          content: '❌ Database connection is currently unavailable. Please check Railway logs.' 
        });
      }

      let depositoData = await Deposito.findOne({ depositoName });

      if (!depositoData) {
        return await interaction.editReply({ 
          content: `No deposit entry found for **${depositoName}**.` 
        });
      }

      await interaction.editReply({ 
        content: `📦 **Deposit:** ${depositoData.depositoName}\nItems stored: ${depositoData.items.length}` 
      });
    }
  } catch (error) {
    console.error(`❌ Error handling /${commandName}:`, error);

    // Prevent "The application did not respond" crashes
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
