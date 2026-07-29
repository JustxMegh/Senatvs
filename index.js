require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, REST, Routes, MessageFlags } = require('discord.js');
const mongoose = require('mongoose');

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
const commandsArray = [];

// --- 1. DYNAMICALLY LOAD ALL COMMAND FILES ---
const commandsPath = path.join(__dirname, 'commands');

// Check if commands directory exists
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    // Ensure the command has required properties
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      commandsArray.push(command.data.toJSON());
    } else if ('name' in command && 'execute' in command) {
      // Compatibility for plain object definitions
      client.commands.set(command.name, command);
      commandsArray.push(command);
    } else {
      console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
} else {
  console.warn('⚠️ No "commands" folder found. Make sure your command files are inside a "commands" directory!');
}

// --- 2. MONGODB CONNECTION SETUP ---
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGO_PRIVATE_URL;

if (!mongoUri) {
  console.error('❌ ERROR: No MongoDB URI found in environment variables!');
} else {
  mongoose.connect(mongoUri, {
    bufferCommands: false,
  })
  .then(() => console.log('✅ Connected to MongoDB successfully!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));
}

// --- 3. REGISTER ALL LOADED SLASH COMMANDS ---
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
  try {
    console.log(`Registering ${commandsArray.length} slash commands...`);
    
    if (process.env.CLIENT_ID && process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commandsArray }
      );
      console.log('✅ All Guild slash commands registered successfully!');
    } else if (process.env.CLIENT_ID) {
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commandsArray }
      );
      console.log('✅ All Global slash commands registered successfully!');
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

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Error executing /${interaction.commandName}:`, error);

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
