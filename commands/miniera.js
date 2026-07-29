const { SlashCommandBuilder } = require('discord.js');
const Miniera = require('../Models /Miniera.js');

const PREZZI = {
  legno: 105, pietra: 75, carbone: 105, ferro: 135,
  argento: 155, rubino: 185, oro: 215, smeraldo: 245, diamante: 275
};

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('miniera')
      .setDescription('Registra un\'estrazione inserendo i minerali desiderati')
      .addIntegerOption(opt => opt.setName('legno').setDescription('Quantità di Legno ($105/pz)').setRequired(false))
      .addIntegerOption(opt => opt.setName('pietra').setDescription('Quantità di Pietra ($75/pz)').setRequired(false))
      .addIntegerOption(opt => opt.setName('carbone').setDescription('Quantità di Carbone ($105/pz)').setRequired(false))
      .addIntegerOption(opt => opt.setName('ferro').setDescription('Quantità di Ferro ($135/pz)').setRequired(false))
      .addIntegerOption(opt => opt.setName('argento').setDescription('Quantità di Argento ($155/pz)').setRequired(false))
      .addIntegerOption(opt => opt.setName('rubino').setDescription('Quantità di Rubino ($185/pz)').setRequired(false))
      .addIntegerOption(opt => opt.setName('oro').setDescription('Quantità di Oro ($215/pz)').setRequired(false))
      .addIntegerOption(opt => opt.setName('smeraldo').setDescription('Quantità di Smeraldo ($245/pz)').setRequired(false))
      .addIntegerOption(opt => opt.setName('diamante').setDescription('Quantità di Diamante ($275/pz)').setRequired(false)),

    async execute(interaction) {
      await interaction.deferReply();

      const materiali = ['legno', 'pietra', 'carbone', 'ferro', 'argento', 'rubino', 'oro', 'smeraldo', 'diamante'];
      const qty = {};
      let guadagnoTotale = 0;
      let totalePezzi = 0;
      let resoconto = [];

      for (const mat of materiali) {
        const val = interaction.options.getInteger(mat);
        if (val !== null && val > 0) {
          // Forziamo la chiave rigorosamente in minuscolo per MongoDB
          const chiaveMinuscola = mat.toLowerCase();
          qty[chiaveMinuscola] = val;

          const sub = val * PREZZI[mat];
          guadagnoTotale += sub;
          totalePezzi += val;
          
          const nomeFormattato = mat.charAt(0).toUpperCase() + mat.slice(1);
          resoconto.push(`• **${nomeFormattato}:** x${val} ($${sub.toLocaleString()})`);
        }
      }

      if (totalePezzi === 0) {
        return await interaction.editReply({ content: '⚠️ Inserisci la quantità di **almeno un minerale**!' });
      }

      // Salvataggio pulito con chiavi minuscole
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
