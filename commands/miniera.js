const { SlashCommandBuilder } = require('discord.js');
const Miniera = require('../Models/Miniera.js');

const PREZZI = {
  legno: 105, pietra: 75, carbone: 105, ferro: 135,
  argento: 155, rubino: 185, oro: 215, smeraldo: 245, diamante: 275
};

// Stato in memoria per la sessione attiva di miniera
let activeSession = null; // { startTime: Date, participants: [] }

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('miniera')
      .setDescription('Gestione della miniera e delle estrazioni')
      .addSubcommand(sub =>
        sub.setName('start')
           .setDescription('Avvia una nuova sessione di miniera (timer)')
      )
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
      const subcommand = interaction.options.getSubcommand(false);

      // --- CASO 1: /miniera start ---
      if (subcommand === 'start') {
        if (activeSession) {
          return await interaction.reply({ content: '⚠️ C\'è già una sessione di miniera attiva! Digita `/miniera` con i minerali per concluderla.', ephemeral: true });
        }

        activeSession = {
          startTime: new Date(),
          participants: [interaction.user.id] // Chi avvia la sessione entra automaticamente
        };

        return await interaction.reply({ content: `⛏️ **Sessione di miniera avviata da ${interaction.user}!**\nIl timer è partito. Usate \`/player miniera\` per aggiungere partecipanti (max 10) e \`/miniera\` con i minerali per concludere.` });
      }

      // --- CASO 2: Chiusura sessione con i minerali ---
      await interaction.deferReply();

      const materiali = ['legno', 'pietra', 'carbone', 'ferro', 'argento', 'rubino', 'oro', 'smeraldo', 'diamante'];
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
          
          const nomeFormattato = mat.charAt(0).toUpperCase() + mat.slice(1);
          resoconto.push(`• **${nomeFormattato}:** x${val} ($${sub.toLocaleString()})`);
        }
      }

      if (totalePezzi === 0) {
        return await interaction.editReply({ content: '⚠️ Inserisci la quantità di **almeno un minerale** per concludere la sessione!' });
      }

      // Calcoliamo la durata se c'era una sessione attiva, altrimenti 0
      let durationSeconds = 0;
      let partecipantiSalvati = [interaction.user.id];

      if (activeSession) {
        const endTime = new Date();
        durationSeconds = Math.floor((endTime - activeSession.startTime) / 1000);
        participantsSalvati = [...new Set(activeSession.participants)]; // Rimuove eventuali duplicati
        activeSession = null; // Resetta la sessione
      }

      const nuovaEstrazione = new Miniera({
        executorId: String(interaction.user.id),
        participants: partecipantiSalvati,
        durationSeconds: durationSeconds,
        items: qty,
        totalItems: totalePezzi,
        totalEarnings: guadagnoTotale,
        date: new Date()
      });

      await nuovaEstrazione.save();

      const minuti = Math.floor(durationSeconds / 60);
      const secondi = durationSeconds % 60;
      const tempoStr = durationSeconds > 0 ? `${minuti}m ${secondi}s` : 'N/D';

      const tagPartecipanti = partecipantiSalvati.map(id => `<@${id}>`).join(', ');

      await interaction.editReply({
        content: `⛏️ **Sessione di miniera conclusa da ${interaction.user}!**\n` +
                 `⏱️ **Tempo trascorso:** ${tempoStr}\n` +
                 `👥 **Partecipanti:** ${tagPartecipanti}\n\n` +
                 `**Materiali (${totalePezzi} pezzi totali):**\n${resoconto.join('\n')}\n\n` +
                 `💰 **Guadagno Totale:** **$${guadagnoTotale.toLocaleString()}**`
      });
    }
  },
  {
    // Comando /player miniera per aggiungere partecipanti
    data: new SlashCommandBuilder()
      .setName('player')
      .setDescription('Gestione dei giocatori')
      .addSubcommand(sub =>
        sub.setName('miniera')
           .setDescription('Unisciti alla sessione di miniera attiva')
           .addUserOption(opt => opt.setName('utente').setDescription('Utente da aggiungere (opzionale, default tu)').setRequired(false))
      ),

    async execute(interaction) {
      if (!activeSession) {
        return await interaction.reply({ content: '⚠️ Non c\'è alcuna sessione di miniera attiva in questo momento. Avviala con `/miniera start`.', ephemeral: true });
      }

      const targetUser = interaction.options.getUser('utente') || interaction.user;

      if (activeSession.participants.includes(targetUser.id)) {
        return await interaction.reply({ content: `⚠️ ${targetUser} è già registrato in questa sessione di miniera!`, ephemeral: true });
      }

      if (activeSession.participants.length >= 10) {
        return await interaction.reply({ content: '⚠️ È stato raggiunto il limite massimo di **10 partecipanti** per questa sessione!', ephemeral: true });
      }

      activeSession.participants.push(targetUser.id);

      await interaction.reply({ content: `✅ ${targetUser} è stato aggiunto alla sessione di miniera! (${activeSession.participants.length}/10 partecipanti)` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('minierareset')
      .setDescription('Azzera tutte le registrazioni della miniera'),
    async execute(interaction) {
      await interaction.deferReply();
      activeSession = null;
      await Miniera.deleteMany({});
      await interaction.editReply({ content: '🔄 Registri della miniera e sessioni azzerati!' });
    }
  }
];
