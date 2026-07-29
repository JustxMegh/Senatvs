const { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ComponentType 
} = require('discord.js');

const Furto = require('../Models /Furto.js');
const Rapina = require('../Models /Rapina.js');
const Miniera = require('../Models /Miniera.js');

// Tutti i 9 materiali previsti dal comando miniera
const LISTA_MINERALI_DEFAULT = [
  'legno', 'pietra', 'carbone', 'ferro', 'argento', 'rubino', 'oro', 'smeraldo', 'diamante'
];

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
            description: 'Mostra i dettagli di tutti i minerali raccolti',
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
          const furti = await Furto.find().sort({ date: -1, createdAt: -1 }).limit(10);
          
          if (!furti || furti.length === 0) {
            return await interaction.editReply({ content: '🕵️ **Lista Furti:** Nessun record trovato.', components: [] });
          }

          let testo = '🕵️ **Ultimi 10 Furti Registrati:**\n\n';
          furti.forEach((f, index) => {
            let totaleOggetti = 0;
            if (f.items && Array.isArray(f.items)) {
              totaleOggetti = f.items.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
            } else if (typeof f.totalItems === 'number') {
              totaleOggetti = f.totalItems;
            }

            const userId = f.taggedUser || f.userId || f.user || f.executorId;
            const utenteText = userId ? `<@${userId}>` : 'Sconosciuto';

            const rawDate = f.date || f.createdAt || new Date();
            const timestampSec = Math.floor(new Date(rawDate).getTime() / 1000);
            const dateDisplay = isNaN(timestampSec) ? 'Data non disponibile' : `<t:${timestampSec}:R>`;

            testo += `**${index + 1}.** Vittima: ${utenteText} | Totale oggetti: **${totaleOggetti}** | Data: ${dateDisplay}\n`;
          });

          await interaction.editReply({ content: testo, components: [] });
        } 
        // --- SEZIONE MINIERA (ELENCO COMPLETO MATERIALI) ---
        else if (selezione === 'lista_miniera') {
          await i.deferUpdate();

          const registrazioni = await Miniera.find().sort({ date: -1, createdAt: -1 }).limit(10);

          if (!registrazioni || registrazioni.length === 0) {
            return await interaction.editReply({ content: '⛏️ **Lista Miniera:** Nessun record trovato.', components: [] });
          }

          let testo = '⛏️ **Ultime 10 Registrazioni Miniera:**\n\n';

          registrazioni.forEach((m, index) => {
            const rawDate = m.date || m.createdAt || new Date();
            const timestampSec = Math.floor(new Date(rawDate).getTime() / 1000);
            const dateDisplay = isNaN(timestampSec) ? 'Data non disponibile' : `<t:${timestampSec}:R>`;
            
            // Recupero Utente da executorId
            const userId = m.executorId || m.userId || m.user || m.taggedUser;
            const utente = userId ? `<@${userId}>` : 'Sconosciuto';

            // Estrazione oggetti da m.items (convertendo Mongoose Map se necessario)
            let itemsObj = {};
            if (m.items) {
              itemsObj = m.items instanceof Map ? Object.fromEntries(m.items) : m.items;
            }

            // Costruzione lista con tutti e 9 i materiali
            const dettagliMinerali = LISTA_MINERALI_DEFAULT.map((mat) => {
              const qta = Number(itemsObj[mat]) || 0;
              return `${mat}: **${qta}**`;
            });

            const guadagno = m.totalEarnings !== undefined ? ` | Guadagno: **$${m.totalEarnings.toLocaleString()}**` : '';

            testo += `**${index + 1}.** Utente: ${utente}${guadagno} | Data: ${dateDisplay}\n`;
            testo += `┗ 📊 ${dettagliMinerali.join(' | ')}\n\n`;
          });

          await interaction.editReply({ content: testo, components: [] });
        } 
        // --- SEZIONE RAPINE ---
        else if (selezione === 'lista_rapine') {
          await i.deferUpdate();
          const ultimeRapine = await Rapina.find()
            .sort({ date: -1, createdAt: -1 })
            .limit(10);

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
      .setName('player')
      .setDescription('Mostra le statistiche di un giocatore')
      .addUserOption(opt => opt.setName('utente').setDescription('Utente di cui mostrare i dati').setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const target = interaction.options.getUser('utente');
      await interaction.editReply({ content: `👤 Mostrando statistiche per **${target.tag}**.` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('aggiorna')
      .setDescription('Aggiorna i dati nel database')
      .addStringOption(opt => opt.setName('sezione').setDescription('Sezione da aggiornare').setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const sezione = interaction.options.getString('sezione');
      await interaction.editReply({ content: `🔄 Sezione **${sezione}** aggiornata!` });
    }
  },

  // --- COMANDO RESET CON MENU OPZIONI ALL'AVVIO ---
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
          {
            label: 'Reset Furti',
            description: 'Elimina tutte le registrazioni dei furti',
            value: 'reset_furti',
            emoji: '🗑️',
          },
          {
            label: 'Reset Miniera / Minerali',
            description: 'Elimina tutti i log di estrazione mineraria',
            value: 'reset_miniera',
            emoji: '⛏️',
          },
          {
            label: 'Reset Rapine',
            description: 'Elimina tutte le registrazioni delle rapine',
            value: 'reset_rapine',
            emoji: '💰',
          },
          {
            label: 'Reset Completo (Tutti i dati)',
            description: '⚠️ AZZERA TUTTI I DATI (Furti, Rapine, Miniera)',
            value: 'reset_tutto',
            emoji: '⚠️',
          },
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
            await interaction.editReply({ content: '✅ **Reset completato:** Tutte le registrazioni dei **Furti** sono state eliminate!', components: [] });
          } else if (scelta === 'reset_miniera') {
            await Miniera.deleteMany({});
            await interaction.editReply({ content: '✅ **Reset completato:** Tutti i log della **Miniera** sono stati eliminati!', components: [] });
          } else if (scelta === 'reset_rapine') {
            await Rapina.deleteMany({});
            await interaction.editReply({ content: '✅ **Reset completato:** Tutte le registrazioni delle **Rapine** sono state eliminate!', components: [] });
          } else if (scelta === 'reset_tutto') {
            await Promise.all([
              Furto.deleteMany({}),
              Miniera.deleteMany({}),
              Rapina.deleteMany({})
            ]);
            await interaction.editReply({ content: '⚠️ **Reset generale completato:** Tutti i dati (Furti, Rapine e Miniera) sono stati azzerati con successo!', components: [] });
          }
        } catch (error) {
          console.error('Errore durante il reset:', error);
          await interaction.editReply({ content: '❌ Si è verificato un errore durante l\'azzeramento dei dati nel database.', components: [] });
        }
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
          await interaction.editReply({ content: '⏱️ Tempo scaduto per selezionare l\'opzione di reset.', components: [] });
        }
      });
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('modifica')
      .setDescription('Modifica un record esistente nel DB')
      .addStringOption(opt => opt.setName('id').setDescription('ID del record').setRequired(true))
      .addStringOption(opt => opt.setName('valore').setDescription('Nuovo valore').setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const id = interaction.options.getString('id');
      const val = interaction.options.getString('valore');
      await interaction.editReply({ content: `✏️ Record \`${id}\` aggiornato a **${val}**.` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('calcolo')
      .setDescription('Esegue un calcolo su un totale')
      .addNumberOption(opt => opt.setName('totale').setDescription('Importo su cui effettuare il calcolo').setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const total = interaction.options.getNumber('totale');
      await interaction.editReply({ content: `🧮 Calcolo completato per il totale **${total}**.` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Verifica la latenza del bot'),
    async execute(interaction) {
      await interaction.reply({ content: '🏓 Pong!', flags: 64 });
    }
  }
];
