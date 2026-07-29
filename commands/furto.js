const { SlashCommandBuilder } = require('discord.js');
const Furto = require('../Models /Furto.js');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('furto')
      .setDescription('Log a theft against a user')
      .addUserOption(opt => opt.setName('utente').setDescription('Target user').setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const targetUser = interaction.options.getUser('utente');
      
      await Furto.create({ targetId: targetUser.id, loggedBy: interaction.user.id, date: new Date() });
      await interaction.editReply({ content: `🕵️ **Furto logged** against ${targetUser.tag}.` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('furtoreset')
      .setDescription('Reset all theft statistics'),
    async execute(interaction) {
      await interaction.deferReply();
      await Furto.deleteMany({});
      await interaction.editReply({ content: '🔄 All **Furto** records have been reset!' });
    }
  }
];
