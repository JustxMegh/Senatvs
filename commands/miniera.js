const { SlashCommandBuilder } = require('discord.js');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('miniera')
      .setDescription('Controlla o gestisci i turni di miniera')
      .addStringOption(opt =>
        opt.setName('minerale')
           .setDescription('Tipo di minerale estratto o settore')
           .setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const minerale = interaction.options.getString('minerale');
      await interaction.editReply({ content: `⛏️ Registro miniera aggiornato per: **${minerale}**.` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('calcolomn')
      .setDescription('Calcola metrica MN applicando la riduzione del 70%')
      .addNumberOption(opt => 
        opt.setName('valore')
           .setDescription('Valore lordo di partenza (y)')
           .setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const y = interaction.options.getNumber('valore');
      const z = y * 0.30;
      
      await interaction.editReply({ 
        content: `📊 **Calcolo MN (-50%):**\n• Valore Base ($y$): **${y}**\n• Valore Calcolato ($z$): **${z.toFixed(2)}**` 
      });
    }
  }
];
