const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const Miniera = require('../Models /Miniera.js');
// Importa eventuali altri modelli se necessari (es. Rapina, Furto)

module.exports = [
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
  {
    // Gestione dell'interazione del menu a tendina per tutte le sezioni
    name: 'management_menu_handler',
    async handleInteraction(i) {
      if (!i.isStringSelectMenu() || i.customId !== 'management_menu') return false;

      const selezione = i.values[0];

      // --- SEZIONE MINIERA (CHI HA PORTATO COSA) ---
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

          // Formattazione tempo in miniera
          let tempoMinieraStr = 'N/D';
          if (m.durationSeconds !== undefined && m.durationSeconds > 0) {
            const min = Math.floor(m.durationSeconds / 60);
            const sec = m.durationSeconds % 60;
            tempoMinieraStr = min > 0 ? `${min}m ${sec}s` : `${sec}s`;
          }

          // Partecipanti
          let partecipantiStr = utenteTag;
          if (m.participants && m.participants.length > 0) {
            partecipantiStr = m.participants.map(id => `<@${id}>`).join(', ');
          }

          // Estrazione oggetti
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

      // --- SEZIONE RAPINA ---
      else if (selezione === 'lista_rapina') {
        await i.deferUpdate();

        // Sostituisci "Rapina" con il nome del tuo modello effettivo se diverso
        // const rapine = await Rapina.find().sort({ date: -1, createdAt: -1 }).limit(10).lean();
        const rapine = []; // Placeholder se non hai ancora il modello collegato

        if (!rapine || rapine.length === 0) {
          return await i.editReply({ content: '🦹 **Lista Rapine:** Nessuna rapina registrata al momento.', components: [] });
        }

        let testo = '🦹 **Ultime Rapine Registrate:**\n\n';
        // Qui puoi aggiungere il ciclo forEach per formattare le rapine come fatto per la miniera

        await i.editReply({ content: testo, components: [] });
        return true;
      }

      // --- SEZIONE FURTO ---
      else if (selezione === 'lista_furto') {
        await i.deferUpdate();

        // Sostituisci "Furto" con il nome del tuo modello effettivo se diverso
        // const furti = await Furto.find().sort({ date: -1, createdAt: -1 }).limit(10).lean();
        const furti = []; // Placeholder se non hai ancora il modello collegato

        if (!furti || furti.length === 0) {
          return await i.editReply({ content: '🦊 **Lista Furti:** Nessun furto registrato al momento.', components: [] });
        }

        let testo = '🦊 **Ultimi Furti Registrati:**\n\n';
        // Qui puoi aggiungere il ciclo forEach per formattare i furti

        await i.editReply({ content: testo, components: [] });
        return true;
      }

      return false;
    }
  }
];
