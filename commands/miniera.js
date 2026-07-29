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
      .addIntegerOption(opt => opt.setName('legno').setDescription('Quantità Legno ($105)').setRequired(false))
      .addIntegerOption(opt => opt.setName('pietra').setDescription('Quantità Pietra ($75)').setRequired(false))
      .addIntegerOption(opt => opt.setName('carbone').setDescription('Quantità Carbone ($105)').setRequired(false))
      .addIntegerOption(opt => opt.setName('ferro').setDescription('Quantità Ferro ($135)').setRequired(false))
      .addIntegerOption(opt => opt.setName('argento').setDescription('Quantità Argento ($155)').setRequired(false))
      .addIntegerOption(opt => opt.setName('rubino').setDescription('Quantità Rubino ($185)').setRequired(false))
      .addIntegerOption(opt => opt.setName('oro').setDescription('Quantità Oro ($215)').setRequired(false))
      .addIntegerOption(opt => opt.setName('smeraldo').setDescription('Quantità Smeraldo ($245)').setRequired(false))
      .addIntegerOption(opt => opt.setName('diamante').setDescription('Quantità Diamante ($275)').setRequired(false)),

    async execute(interaction) {
      await interaction.deferReply();

      const materiali = ['legno', 'pietra', 'carbone', 'ferro', 'argento', 'rubino', 'oro', 'smeraldo', 'diamante'];
      const qty = {};
      let guadagnoTotale = 0;
      let totalePezzi = 0;
      let resoconto = [];

      // Estraiamo solo i valori passati dall'utente
      for (const mat of materiali) {
        const val = interaction.options.getInteger(mat);
        if (val !== null && val > 0) {
          qty[mat] = val;
          const sub = val * PREZZI[mat];
          guadagnoTotale += sub;
          totalePezzi += val;
          resoconto.push(`• **${mat.charAt(0).toUpperCase() + mat.slice(1)}:** x${val} ($${sub.toLocaleString()})`);
        }
      }

      if (totalePezzi === 0) {
        return await interaction.editReply({ content: '⚠️ Inserisci la quantità di **almeno un minerale**!' });
      }

      const userId = interaction.user.id;

      // Stampiamo nel terminale per verfica immediata
      console.log('--- REGISTRAZIONE MINIERA ---');
      console.log('Utente ID:', userId);
      console.log('Oggetto Quantità:', qty);
      console.log('Totale Pezzi:', totalePezzi);
      console.log('Guadagno:', guadagnoTotale);

      // Salviamo nel DB specificando l'ID utente in tutti i formati possibili
      const doc = await Miniera.create({
        executorId: userId,
        userId: userId,
        user: userId,
        items: qty,
        materiali: qty,
        totalItems: totalePezzi,
        totalEarnings: guadagnoTotale,
        date: new Date()
      });

      console.log('Documento creato nel DB:', doc);

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
