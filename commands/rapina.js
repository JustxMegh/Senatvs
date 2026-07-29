const { SlashCommandBuilder } = require('discord.js');
const Rapina = require('../Models /Rapina.js'); // Import from /Models

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rapina')
    .setDescription('Log a new heist')
    .addIntegerOption(option =>
      option.setName('totale')
        .setDescription('Total heist amount')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const totale = interaction.options.getInteger('totale');

    // Create a new record in MongoDB using the Rapina model
    const newRapina = new Rapina({
      userId: interaction.user.id,
      amount: totale,
      date: new Date(),
    });

    await newRapina.save();

    await interaction.editReply({
      content: `💰 Rapina of **$${totale}** saved to database!`,
    });
  },
};
