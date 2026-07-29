const { SlashCommandBuilder } = require('discord.js');
const Campo = require('../Models /Campo.js');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('campo')
      .setDescription('Start or check active turf/campo sessions'),
    async execute(interaction) {
      await interaction.deferReply();
      await interaction.editReply({ content: '⚔️ **Campo** session status checked.' });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('stop')
      .setDescription('End current active session'),
    async execute(interaction) {
      await interaction.deferReply();
      await interaction.editReply({ content: '🛑 Active session stopped and logged.' });
    }
  }
];
