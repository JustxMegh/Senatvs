const { SlashCommandBuilder } = require('discord.js');
const Miniera = require('../Models /Miniera.js');

// Listino prezzi unitari
const PREZZI = {
  legno: 105,
  pietra: 75,
  carbone: 105,
  ferro: 135,
  argento: 155,
  rubino: 185,
  oro: 215,
  smeraldo: 245,
  diamante: 275
};

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('miniera')
      .setDescription('Registra il bottino estratto in miniera')
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

      // Raccogliamo solo i materiali in cui è stata inserita una quantità > 0
      const materialiDisponibili = ['legno', 'pietra', 'carbone', 'ferro', 'argento', 'rubino', 'oro', 'smeraldo', 'diamante'];
      const qty = {};
      let guadagnoTotale = 0;
      let totalePezzi = 0;
      let resocontoRighe = [];

      for (const mat of materialiDisponibili) {
        const qta = interaction.options.getInteger(mat);
        if (qta && qta > 0) {
          qty[mat] = qta;
          const subtotale = qta * (PREZZI[mat] || 0);
          guadagnoTotale += subtotale;
          totalePezzi += qta;

          const nomeFormat = mat.charAt(0).toUpperCase() + mat.slice(1);
          resocontoRighe.push(`• **${nomeFormat}:** x${qta} ($${subtotale.toLocaleString()})`);
        }
      }

      // Se non è stato specificato alcun materiale
      if (totalePezzi === 0) {
        return await interaction.editReply({
          content: '⚠️ Devi specificare la quantità di **almeno un materiale** portato!'
        });
      }

      // Salvataggio nel Database
      await Miniera.create({
        executorId: interaction.user.id,
        items: qty,
        totalItems: totalePezzi,
        totalEarnings: guadagnoTotale,
        date: new Date()
      });

      await interaction.editReply({
        content: `⛏️ **Consegna Miniera registrata per ${interaction.user}!**\n\n` +
                 `**Materiali consegnati (${totalePezzi} pezzi totali):**\n${resocontoRighe.join('\n')}\n\n` +
                 `💰 **Valore totale:** **$${guadagnoTotale.toLocaleString()}**`
      });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('minierareset')
      .setDescription('Azzera tutti i log della miniera'),
    async execute(interaction) {
      await interaction.deferReply();
      await Miniera.deleteMany({});
      await interaction.editReply({ content: '🔄 Registro miniera svuotato con successo!' });
    }
  }
];
