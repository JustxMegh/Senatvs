const { SlashCommandBuilder } = require('discord.js');
const Miniera = require('../Models /Miniera.js');

// Listino prezzi al pezzo
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
      .setDescription('Registra un\'estrazione inserendo i minerali desiderati')
      // Tutti i campi ora sono OPZIONALI (.setRequired(false))
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

      // Raccogliamo solo quello che l'utente ha inserito (default a 0 se non specificato)
      const qty = {
        legno: interaction.options.getInteger('legno') || 0,
        pietra: interaction.options.getInteger('pietra') || 0,
        carbone: interaction.options.getInteger('carbone') || 0,
        ferro: interaction.options.getInteger('ferro') || 0,
        argento: interaction.options.getInteger('argento') || 0,
        rubino: interaction.options.getInteger('rubino') || 0,
        oro: interaction.options.getInteger('oro') || 0,
        smeraldo: interaction.options.getInteger('smeraldo') || 0,
        diamante: interaction.options.getInteger('diamante') || 0,
      };

      let guadagnoTotale = 0;
      let totalePezzi = 0;
      let dettagliTesto = [];

      // Calcoliamo solo sui minerali > 0
      for (const [key, qta] of Object.entries(qty)) {
        if (qta > 0) {
          const prezzoSingolo = PREZZI[key];
          const subtotale = qta * prezzoSingolo;
          guadagnoTotale += subtotale;
          totalePezzi += qta;

          const nomeFormattato = key.charAt(0).toUpperCase() + key.slice(1);
          dettagliTesto.push(`• **${nomeFormattato}:** x${qta} ($${subtotale.toLocaleString()})`);
        }
      }

      // Se non ha inserito nessun minerale o tutti 0
      if (totalePezzi === 0) {
        return await interaction.editReply({
          content: '⚠️ Devi inserire la quantità di almeno un minerale!'
        });
      }

      // Salvataggio nel database
      await Miniera.create({
        executorId: interaction.user.id,
        items: qty,
        totalItems: totalePezzi,
        totalEarnings: guadagnoTotale,
        date: new Date()
      });

      await interaction.editReply({
        content: `⛏️ **Estrazione Registrata per ${interaction.user}!**\n\n` +
                 `**Materiali estratti (Totale pezzi: ${totalePezzi}):**\n${dettagliTesto.join('\n')}\n\n` +
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
      await interaction.editReply({ content: '🔄 Tutti i dati della **Miniera** sono stati azzerati!' });
    }
  }
];
