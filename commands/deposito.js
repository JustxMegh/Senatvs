const { SlashCommandBuilder } = require('discord.js');
const Deposito = require('../Models /Deposito.js');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('deposito')
      .setDescription('Verifica l\'inventario di un deposito')
      .addStringOption(opt => 
        opt.setName('nome')
           .setDescription('Nome del deposito da cercare')
           .setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const name = interaction.options.getString('nome');
      
      let data = await Deposito.findOne({ depositoName: name });
      if (!data) return await interaction.editReply({ content: `📦 Nessun deposito trovato con il nome **${name}**.` });

      await interaction.editReply({ content: `📦 **Deposito ${name}:** ${data.items ? data.items.length : 0} oggetti presenti.` });
    }
  }
];
