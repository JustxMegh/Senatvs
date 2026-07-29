const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const Miniera = require('../Models /Miniera.js');

// Stato in memoria per la sessione attiva di miniera
let activeSession = null; // { startTime: Date, participants: [] }

const PREZZI = {
  legno: 105, pietra: 75, carbone: 105, ferro: 135,
  argento: 155, rubino: 185, oro: 215, smeraldo: 245, diamante: 275
};

module.exports = [
  // --- 1. COMANDO /LISTA ---
  {
    data: new SlashCommandBuilder()
      .setName('lista')
      .setDescription('Mostra i menu di gestione e riepilogo'),

    async execute(interaction) {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('management_menu')
        .setPlaceholder('Seleziona una categoria da visualizzare...')
        .addOptions([
          {
            label: 'Ultime Consegne Miniera',
            description: 'Mostra i registri della miniera, tempi e partecipanti',
            value: 'lista_miniera'
          },
          {
            label: 'Ultime Rapine',
            description: 'Mostra lo storico delle rapine effettuate',
            value: 'lista_rapina'
          },
          {
            label: 'Ultimi Furti',
            description: 'Mostra lo storico dei furti effettuati',
            value: 'lista_furto'
          }
        ]);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.reply({
        content: '📋 **Menu di Gestione:** Scegli una voce dal menu sottostante per visualizzare i dati.',
        components: [row],
        ephemeral: false
      });
    }
  },

  // --- 2. COMANDO /MINIERA (START O CHIUSURA CON MINERALI) ---
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

      // CASO A: /miniera start
      if (subcommand === 'start') {
        if (activeSession) {
          return await interaction.reply({ content: '⚠️ C\'è già una sessione di miniera attiva! Digita `/miniera` con i minerali per concluderla.', ephemeral: true });
        }

        activeSession = {
          startTime: new Date(),
          participants: [interaction.user.id]
        };

        return await interaction.reply({ content: `⛏️ **Sessione di miniera avviata da ${interaction.user}!**\nIl timer è partito. Usate \`/player miniera\` per aggiungere partecipanti (max 10) e \`/miniera\` con i minerali per concludere.` });
      }

      // CASO B: Chiusura sessione inserendo i minerali
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

      let durationSeconds = 0;
      let partecipantiSalvati = [interaction.user.id];

      if (activeSession) {
        const endTime = new Date();
        durationSeconds = Math.floor((endTime - activeSession.startTime) / 1000);
        participantsSalvati = [...new Set(activeSession.participants)];
        activeSession = null;
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
                 `⏱️ **Tempo in miniera:** ${tempoStr}\n` +
                 `👥 **Partecipanti:** ${tagPartecipanti}\n\n` +
                 `**Materiali (${totalePezzi} pezzi totali):**\n${resoconto.join('\n')}\n\n` +
                 `💰 **Guadagno Totale:** **$${guadagnoTotale.toLocaleString()}**`
      });
    }
  },

  // --- 3. COMANDO /PLAYER MINIERA ---
  {
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

  // --- 4. COMANDO /MINIERARESET ---
  {
    data: new SlashCommandBuilder()
      .setName('minierareset')
      .setDescription('Azzera tutte le registrazioni della miniera e la sessione attiva'),
    async execute(interaction) {
      await interaction.deferReply();
      activeSession = null;
      await Miniera.deleteMany({});
      await interaction.editReply({ content: '🔄 Registri della miniera e sessioni azzerati!' });
    }
  },

  // --- 5. GESTORE DEL MENU A TENDINA (/LISTA) ---
  {
    name: 'management_menu_handler',
    async handleInteraction(i) {
      if (!i.isStringSelectMenu() || i.customId !== 'management_menu') return false;

      const selezione = i.values[0];

      if (selezione === 'lista_miniera') {
        await i.deferUpdate();

        const registrazioni = await Miniera.find().sort({ date: -1, createdAt: -1 }).limit(10).lean();

        if (!registrazioni || registrazioni.length === 0) {
          return await i.editReply({ content: '⛏️ **Lista Miniera:** Nessuna consegna registrata.', components: [] });
        }

        let testo = '⛏️ **Ultime Consegne Miniera (Chi ha portato cosa):**\n\n';

        registrazioni.forEach((m, index) => {
          const rawDate = m.date || m.createdAt || new Date();
          const timestampSec = Math.floor(new Date(rawDate).getTime() / 1000);
          const dateDisplay = isNaN(timestampSec) ? '' : `<t:${timestampSec}:R>`;
          
          const userId = m.executorId || m.userId || m.user || m.taggedUser || m.authorId;
          const utenteTag = userId ? `<@${userId}>` : 'Sconosciuto';

          let tempoMinieraStr = 'N/D';
          if (m.durationSeconds !== undefined && m.durationSeconds > 0) {
            const min = Math.floor(m.durationSeconds / 60);
            const sec = m.durationSeconds % 60;
            tempoMinieraStr = min > 0 ? `${min}m ${sec}s` : `${sec}s`;
          }

          let partecipantiStr = utenteTag;
          if (m.participants && m.participants.length > 0) {
            partecipantiStr = m.participants.map(id => `<@${id}>`).join(', ');
          }

          const itemsObj = m.items || {};
          const dettagli = [];
          const listaMateriali = ['legno', 'pietra', 'carbone', 'ferro', 'argento', 'rubino', 'oro', 'smeraldo', 'diamante'];
          
          for (const mat of listaMateriali) {
            const qta = Number(itemsObj[mat]) || 0;
            if (qta > 0) {
              const nomeMat = mat.charAt(0).toUpperCase() + mat.slice(1);
              dettagli.push(`- ${nomeMat}: ${qta}`);
            }
          }

          const elencoOggetti = dettagli.length > 0 ? dettagli.join('\n') : '- Nessun dettaglio';

          testo += `**${index + 1}.** Chiuso da ${utenteTag} (Data: ${dateDisplay})\n`;
          testo += `⏱️ **Tempo in miniera:** ${tempoMinieraStr}\n`;
          testo += `👥 **Partecipanti:** ${partecipantiStr}\n`;
          testo += `┗ 📦 **Ha portato:**\n${elencoOggetti}\n\n`;
        });

        await i.editReply({ content: testo, components: [] });
        return true;
      }

      else if (selezione === 'lista_rapina') {
        await i.deferUpdate();
        const rapine = []; 

        if (!rapine || rapine.length === 0) {
          return await i.editReply({ content: '🦹 **Lista Rapine:** Nessuna rapina registrata al momento.', components: [] });
        }

        let testo = '🦹 **Ultime Rapine Registrate:**\n\n';
        await i.editReply({ content: testo, components: [] });
        return true;
      }

      else if (selezione === 'lista_furto') {
        await i.deferUpdate();
        const furti = []; 

        if (!furti || furti.length === 0) {
          return await i.editReply({ content: '🦊 **Lista Furti:** Nessun furto registrato al momento.', components: [] });
        }

        let testo = '🦊 **Ultimi Furti Registrati:**\n\n';
        await i.editReply({ content: testo, components: [] });
        return true;
      }

      return false;
    }
  }
];
