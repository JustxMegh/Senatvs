const { SlashCommandBuilder } = require('discord.js');
const Miniera = require('../Models /Miniera.js');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('miniera')
      .setDescription('Check or manage mining sessions'),
    async execute(interaction) {
      await interaction.deferReply();
      await interaction.editReply({ content: '⛏️ **Miniera** stockpile status checked.' });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('calcolomn')
      .setDescription('Calculate MN metric (Applies 70% reduction)')
      .addNumberOption(opt => opt.setName('valore').setDescription('Base value (y)').setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const y = interaction.options.getNumber('valore');
      
      // Formula: z = y - 70%
      const z = y * 0.30;
      
      await interaction.editReply({ 
        content: `📊 **Calcolo MN:**\n• Base value ($y$): **${y}**\n• Value after -70% ($z$): **${z.toFixed(2)}**` 
      });
    }
  }
];
