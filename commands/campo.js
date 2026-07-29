const { SlashCommandBuilder } = require('discord.js');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('campo')
      .setDescription('Gestisci le sessioni campo')
      .addStringOption(opt =>
        opt.setName('zona')
           .setDescription('Nome della zona/turf')
           .setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const zona = interaction.options.getString('zona');
      await interaction.editReply({ content: `⚔️ Sessione **Campo** attivata/controllata per la zona: **${zona}**` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('stop')
      .setDescription('Interrompe una sessione attiva')
      .addStringOption(opt =>
        opt.setName('tipo')
           .setDescription('Tipo di sessione da fermare (es. campo, miniera)')
           .setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const tipo = interaction.options.getString('tipo');
      await interaction.editReply({ content: `🛑 Sessione di tipo **${tipo}** interrotta e salvata.` });
    }
  }
];
