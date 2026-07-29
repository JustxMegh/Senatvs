const { SlashCommandBuilder } = require('discord.js');
const Miniera = require('../Models /Miniera.js');

const PREZZI = {
  Legno: 105, Pietra: 75, Carbone: 105, Ferro: 135,
  Argento: 155, Rubino: 185, Oro: 215, Smeraldo: 245, Diamante: 275
};

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('miniera')
      .setDescription('Registra un\'estrazione inserendo i minerali desiderati')
      .addIntegerOption(opt => opt.setName('Legno').setDescription('Quantità di Legno ($105/pz)').setRequired(false))
      .addIntegerOption(opt => opt.setName('Pietra').setDescription('Quantità di Pietra ($75/pz)').setRequired(false))
      .addIntegerOption(opt => opt.setName('Carbone').setDescription('Quantità di Carbone ($105/pz)').setRequired(false))
      .addIntegerOption(opt => opt.setName('Ferro').setDescription('Quantità di Ferro ($135/pz)').setRequired(false))
      .addIntegerOption(opt => opt.setName('Argento').setDescription('Quantità di Argento ($155/pz)').setRequired(false))
      .addIntegerOption(opt => opt.setName('Rubino').setDescription('Quantità di Rubino ($185/pz)').setRequired(false))
      .addIntegerOption(opt => opt.setName('Oro').setDescription('Quantità di Oro ($215/pz)').setRequired(false))
      .addIntegerOption(opt => opt.setName('Smeraldo').setDescription('Quantità di Smeraldo ($245/pz)').setRequired(false))
      .addIntegerOption(opt => opt.setName('Diamante').setDescription('Quantità di Diamante ($275/pz)').setRequired(false)),

    async execute(interaction) {
      await interaction.deferReply();

      const materiali = ['Legno', 'Pietra', 'Carbone', 'Ferro', 'Argento', 'Rubino', 'Oro', 'Smeraldo', 'Diamante'];
      const qty = {};
      let guadagnoTotale = 0;
      let totalePezzi = 0;
      let resoconto = [];

      for (const mat of materiali) {
        const val = interaction.options.getInteger(mat);
        if (val !== null && val > 0) {
          qty[mat] = val;
          const sub = val * PREZZI[mat];
          guadagnoTotale += sub;
          totalePezzi += val;
          
          // La prima lettera diventa maiuscola nel resoconto
          const nomeFormattato = mat.charAt(0).toUpperCase() + mat.slice(1);
          resoconto.push(`• **${nomeFormattato}:** x${val} ($${sub.toLocaleString()})`);
        }
      }

      if (totalePezzi === 0) {
        return await interaction.editReply({ content: '⚠️ Inserisci la quantità di **almeno un minerale**!' });
      }

      await Miniera.create({
        executorId: interaction.user.id,
        items: qty,
        totalItems: totalePezzi,
        totalEarnings: guadagnoTotale,
        date: new Date()
      });

      await interaction.editReply({
        content: `⛏️ **Estrazione registrata per ${interaction.user}!**\n\n` +
                 `**Materiali (${totalePezzi} pezzi totali):**\n${resoconto.join('\n')}\n\n` +
                 `💰 **Guadagno Totale:** **$${guadagnoTotale.toLocaleString()}**`
      });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('minierareset')
      .setDescription('Azzera tutte le registrazioni della miniera'),
    async execute(interaction) {
      await interaction.deferReply();
      await Miniera.deleteMany({});
      await interaction.editReply({ content: '🔄 Registri della miniera azzerati!' });
    }
  }
];
