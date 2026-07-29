const { SlashCommandBuilder } = require('discord.js');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('player')
      .setDescription('Check player stats')
      .addUserOption(opt => opt.setName('utente').setDescription('Target user').setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const target = interaction.options.getUser('utente');
      await interaction.editReply({ content: `👤 Stats overview for **${target.tag}**.` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('aggiorna')
      .setDescription('Force-update database metrics'),
    async execute(interaction) {
      await interaction.deferReply();
      await interaction.editReply({ content: '🔄 Server metrics updated!' });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('reset')
      .setDescription('General system reset'),
    async execute(interaction) {
      await interaction.deferReply();
      await interaction.editReply({ content: '⚙️ General system data reset.' });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('modifica')
      .setDescription('Edit an entry')
      .addStringOption(opt => opt.setName('id').setDescription('Entry ID').setRequired(true))
      .addStringOption(opt => opt.setName('valore').setDescription('New value').setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const id = interaction.options.getString('id');
      const val = interaction.options.getString('valore');
      await interaction.editReply({ content: `✏️ Entry \`${id}\` updated to **${val}**.` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('lista')
      .setDescription('Display active server logs'),
    async execute(interaction) {
      await interaction.deferReply();
      await interaction.editReply({ content: '📋 Showing active logs overview.' });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('calcolo')
      .setDescription('Perform reward or percentage calculations')
      .addNumberOption(opt => opt.setName('totale').setDescription('Total amount').setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const total = interaction.options.getNumber('totale');
      await interaction.editReply({ content: `🧮 Standard calculation for **${total}** completed.` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Check bot status'),
    async execute(interaction) {
      await interaction.reply({ content: '🏓 Pong!', flags: 64 });
    }
  }
];
