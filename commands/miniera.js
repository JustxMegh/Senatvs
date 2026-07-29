const { SlashCommandBuilder } = require('discord.js');
const Miniera = require('../Models /Miniera.js'); // Fix del path (senza spazi extra)

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
      .setDescription('Registra un\'estrazione specificando le quantità e calcola il guadagno')
      .addIntegerOption(opt => opt.setName('legno').setDescription('Quantità di Legno ($105/pz)').setRequired(true))
      .addIntegerOption(opt => opt.setName('pietra').setDescription('Quantità di Pietra ($75/pz)').setRequired(true))
      .addIntegerOption(opt => opt.setName('carbone').setDescription('Quantità di Carbone ($105/pz)').setRequired(true))
      .addIntegerOption(opt => opt.setName('ferro').setDescription('Quantità di Ferro ($135/pz)').setRequired(true))
      .addIntegerOption(opt => opt.setName('argento').setDescription('Quantità di Argento ($155/pz)').setRequired(true))
      .addIntegerOption(opt => opt.setName('rubino').setDescription('Quantità di Rubino ($185/pz)').setRequired(true))
      .addIntegerOption(opt => opt.setName('oro').setDescription('Quantità di Oro ($215/pz)').setRequired(true))
      .addIntegerOption(opt => opt.setName('smeraldo').setDescription('Quantità di Smeraldo ($245/pz)').setRequired(true))
      .addIntegerOption(opt => opt.setName('diamante').setDescription('Quantità di Diamante ($275/pz)').setRequired(true)),

    async execute(interaction) {
      await interaction.deferReply();

      // Raccolta quantità inserite dall'utente
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

      // Calcolo guadagno per ciascun materiale e totale
      let guadagnoTotale = 0;
      let totalePezzi = 0;
      let dettagliTesto = [];

      for (const [key, qta] of Object.entries(qty)) {
        if (qta > 0) {
          const prezzoSingolo = PREZZI[key];
          const subtotale = qta * prezzoSingolo;
          guadagnoTotale += subtotale;
          totalePezzi += qta;

          // Nome formattato con maiuscola
          const nomeFormattato = key.charAt(0).toUpperCase() + key.slice(1);
          dettagliTesto.push(`• **${nomeFormattato}:** x${qta} ($${subtotale.toLocaleString()})`);
        }
      }

      // Salvataggio nel database
      await Miniera.create({
        executorId: interaction.user.id,
        items: qty,
        totalItems: totalePezzi,
        totalEarnings: guadagnoTotale,
        date: new Date()
      });

      const riepilogo = dettagliTesto.length > 0 
        ? dettagliTesto.join('\n') 
        : '_Nessun materiale estratto (tutti a 0)_';

      await interaction.editReply({
        content: `⛏️ **Estrazione Registrata per ${interaction.user}!**\n\n` +
                 `**Materiali estratti (Totale pezzi: ${totalePezzi}):**\n${riepilogo}\n\n` +
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
