const { SlashCommandBuilder } = require('discord.js');
const Deposito = require('../Models /Deposito.js');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('deposito')
      .setDescription('Check or update deposit inventory')
      .addStringOption(opt => opt.setName('nome').setDescription('Name of the deposit').setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const name = interaction.options.getString('nome');
      
      let data = await Deposito.findOne({ depositoName: name });
      if (!data) return await interaction.editReply({ content: `📦 No deposit found for **${name}**.` });

      await interaction.editReply({ content: `📦 **Deposit ${name}:** ${data.items ? data.items.length : 0} items stored.` });
    }
  }
];
