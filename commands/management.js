const { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ComponentType 
} = require('discord.js');

const Furto = require('../Models/Furto.js');
const Rapina = require('../Models/Rapina.js');
const Miniera = require('../Models/Miniera.js');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('lista')
      .setDescription('Mostra un elenco filtrato di log e registrazioni'),
    async execute(interaction) {
      await interaction.deferReply();

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_lista_categoria')
        .setPlaceholder('Seleziona la lista che vuoi visualizzare...')
        .addOptions([
          {
            label: 'Furti',
            description: 'Mostra i log di tutti i furti registrati',
            value: 'lista_furti',
            emoji: '🕵️',
          },
          {
            label: 'Minerali / Miniera',
            description: 'Mostra chi ha portato cosa e il relativo valore',
            value: 'lista_miniera',
            emoji: '⛏️',
          },
          {
            label: 'Rapine',
            description: 'Mostra i log delle rapine registrate',
            value: 'lista_rapine',
            emoji: '💰',
          },
        ]);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const response = await interaction.editReply({
        content: '📋 **Seleziona la categoria della lista che vuoi consultare:**',
        components: [row],
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000,
      });

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          return await i.reply({ content: '❌ Non puoi interagire con questo menu.', flags: 64 });
        }

        const selezione = i.values[0];

        // --- SEZIONE FURTI ---
        if (selezione === 'lista_furti') {
          await i.deferUpdate();
          const furti = await Furto.find().sort({ date: -1, createdAt: -1 }).limit(10).lean();
          
          if (!furti || furti.length === 0) {
            return await interaction.editReply({ content: '🕵️ **Lista Furti:** Nessun record trovato.', components: [] });
          }

          let testo = '🕵️ **Ultimi 10 Furti Registrati:**\n\n';
          furti.forEach((f, index) => {
            let totaleOggetti = f.totalItems || 0;
            if (f.items && Array.isArray(f.items)) {
              totaleOggetti = f.items.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
            }

            const userId = f.taggedUser || f.userId || f.user || f.executorId;
            const utenteText = userId ? `<@${userId}>` : 'Sconosciuto';

            const rawDate = f.date || f.createdAt || new Date();
            const timestampSec = Math.floor(new Date(rawDate).getTime() / 1000);
            const dateDisplay = isNaN(timestampSec) ? 'Data N/D' : `<t:${timestampSec}:R>`;

            testo += `**${index + 1}.** Vittima: ${utenteText} | Totale oggetti: **${totaleOggetti}** | Data: ${dateDisplay}\n`;
          });

          await interaction.editReply({ content: testo, components: [] });
        } 

        // --- SEZIONE MINIERA (CHI HA PORTATO COSA) ---
        else if (selezione === 'lista_miniera') {
          await i.deferUpdate();

          // Utilizziamo .lean() per leggere l'oggetto JavaScript puro
          const registrazioni = await Miniera.find().sort({ date: -1, createdAt: -1 }).limit(10).lean();

          if (!registrazioni || registrazioni.length === 0) {
            return await interaction.editReply({ content: '⛏️ **Lista Miniera:** Nessuna consegna registrata.', components: [] });
          }

          let testo = '⛏️ **Ultime Consegne Miniera (Chi ha portato cosa):**\n\n';

          registrazioni.forEach((m, index) => {
            const rawDate = m.date || m.createdAt || new Date();
            const timestampSec = Math.floor(new Date(rawDate).getTime() / 1000);
            const dateDisplay = isNaN(timestampSec) ? '' : `<t:${timestampSec}:R>`;
            
            // ID di chi ha effettuato la registrazione
            const userId = m.executorId || m.userId || m.user;
            const utente = userId ? `<@${userId}>` : 'Sconosciuto';

            // Costruiamo la lista dinamica di COSA ha portato l'utente
            const itemsObj = m.items || {};
            const dettagli = [];

            for (const [materiale, qta] of Object.entries(itemsObj)) {
              if (qta > 0) {
                const nomeMat = materiale.charAt(0).toUpperCase() + materiale.slice(1);
                dettagli.push(`${nomeMat}: **x${qta}**`);
              }
            }

            const elencoOggetti = dettagli.length > 0 ? dettagli.join(' | ') : 'Nessun dettaglio';
            const valoreTotale = m.totalEarnings ? ` | Valore: **$${m.totalEarnings.toLocaleString()}**` : '';

            testo += `**${index + 1}.** ${utente} (Data: ${dateDisplay})${valoreTotale}\n`;
            testo += `┗ 📦 **Ha portato:** ${elencoOggetti}\n\n`;
          });

          await interaction.editReply({ content: testo, components: [] });
        } 

        // --- SEZIONE RAPINE ---
        else if (selezione === 'lista_rapine') {
          await i.deferUpdate();
          const ultimeRapine = await Rapina.find().sort({ date: -1, createdAt: -1 }).limit(10).lean();

          if (!ultimeRapine || ultimeRapine.length === 0) {
            return await interaction.editReply({ content: '💰 **Lista Rapine:** Nessun record trovato.', components: [] });
          }

          let testo = `💰 **Ultime Rapine Registrate:**\n\n`;
          ultimeRapine.forEach((r, index) => {
            const rawDate = r.date || r.createdAt || new Date();
            const timestampSec = Math.floor(new Date(rawDate).getTime() / 1000);
            const dateDisplay = isNaN(timestampSec) ? '' : `| Data: <t:${timestampSec}:R>`;

            testo += `**${index + 1}.** Totale: **$${(r.totalAmount || 0).toLocaleString()}** ${dateDisplay}\n`;
          });

          await interaction.editReply({ content: testo, components: [] });
        }
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
          await interaction.editReply({ content: '⏱️ Tempo scaduto per selezionare la lista.', components: [] });
        }
      });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('reset')
      .setDescription('Azzera i dati registrati di un modulo o del database'),
    async execute(interaction) {
      await interaction.deferReply();

      const resetMenu = new StringSelectMenuBuilder()
        .setCustomId('select_reset_modulo')
        .setPlaceholder('Seleziona la sezione che vuoi azzerare...')
        .addOptions([
          { label: 'Reset Furti', value: 'reset_furti', emoji: '🗑️' },
          { label: 'Reset Miniera / Minerali', value: 'reset_miniera', emoji: '⛏️' },
          { label: 'Reset Rapine', value: 'reset_rapine', emoji: '💰' },
          { label: 'Reset Completo (Tutti i dati)', value: 'reset_tutto', emoji: '⚠️' },
        ]);

      const row = new ActionRowBuilder().addComponents(resetMenu);

      const response = await interaction.editReply({
        content: '⚙️ **Seleziona quale sezione del database desideri azzerare:**',
        components: [row],
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000,
      });

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          return await i.reply({ content: '❌ Non puoi interagire con questo menu.', flags: 64 });
        }

        await i.deferUpdate();
        const scelta = i.values[0];

        try {
          if (scelta === 'reset_furti') {
            await Furto.deleteMany({});
            await interaction.editReply({ content: '✅ Registrazioni **Furti** eliminate!', components: [] });
          } else if (scelta === 'reset_miniera') {
            await Miniera.deleteMany({});
            await interaction.editReply({ content: '✅ Registrazioni **Miniera** eliminate!', components: [] });
          } else if (scelta === 'reset_rapine') {
            await Rapina.deleteMany({});
            await interaction.editReply({ content: '✅ Registrazioni **Rapine** eliminate!', components: [] });
          } else if (scelta === 'reset_tutto') {
            await Promise.all([Furto.deleteMany({}), Miniera.deleteMany({}), Rapina.deleteMany({})]);
            await interaction.editReply({ content: '⚠️ **Tutti i dati azzerati con successo!**', components: [] });
          }
        } catch (error) {
          console.error('Errore reset:', error);
          await interaction.editReply({ content: '❌ Errore durante il reset.', components: [] });
        }
      });
    }
  }
];
