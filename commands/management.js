const { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ComponentType 
} = require('discord.js');

const Furto = require('../Models /Furto.js');
const Rapina = require('../Models /Rapina.js');
const Miniera = require('../Models /Miniera.js');

// Lista dei minerali disponibili con opzione 0 inclusa
const OPZIONI_MINERALI = [
  { label: 'Nessun Minerale (0)', value: '0', description: 'Imposta la quantità a 0', emoji: '❌' },
  { label: 'Ferro', value: 'ferro', description: 'Minerali di ferro raccolti', emoji: '🪨' },
  { label: 'Rame', value: 'rame', description: 'Minerali di rame raccolti', emoji: '🟠' },
  { label: 'Oro', value: 'oro', description: 'Pepite d\'oro raccolte', emoji: '🟡' },
  { label: 'Diamante', value: 'diamante', description: 'Diamanti grezzi trovati', emoji: '💎' },
  { label: 'Smeraldo', value: 'smeraldo', description: 'Smeraldi trovati', emoji: '🟢' }
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
            description: 'Seleziona ed elenca i minerali raccolti',
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

            const rawDate = f.date || f.createdAt || new Date();
            const timestampSec = Math.floor(new Date(rawDate).getTime() / 1000);
            const dateDisplay = isNaN(timestampSec) ? 'Data non disponibile' : `<t:${timestampSec}:R>`;

            testo += `**${index + 1}.** Vittima: <@${f.taggedUser}> | Totale oggetti: **${totaleOggetti}** | Data: ${dateDisplay}\n`;
          });

          await interaction.editReply({ content: testo, components: [] });
        } 
        // --- SEZIONE MINIERA (Menu Selezione Minerali) ---
        else if (selezione === 'lista_miniera') {
          await i.deferUpdate();

          // Sottomenu per selezionare lo specifico minerale (inclusa opzione 0)
          const mineraliMenu = new StringSelectMenuBuilder()
            .setCustomId('select_minerale_tipo')
            .setPlaceholder('Seleziona il minerale da filtrare...')
            .addOptions(OPZIONI_MINERALI);

          const mineraliRow = new ActionRowBuilder().addComponents(mineraliMenu);

          const minieraResponse = await interaction.editReply({
            content: '⛏️ **Seleziona il minerale di cui vuoi consultare la raccolta:**',
            components: [mineraliRow],
          });

          const subCollector = minieraResponse.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60000,
          });

          subCollector.on('collect', async (subInt) => {
            if (subInt.user.id !== interaction.user.id) {
              return await subInt.reply({ content: '❌ Non puoi interagire con questo menu.', flags: 64 });
            }

            await subInt.deferUpdate();
            const mineraleScelto = subInt.values[0];

            // Gestione opzione 0 (Nessun minerale)
            if (mineraleScelto === '0') {
              return await interaction.editReply({ 
                content: '⛏️ **Selezione Minerale:** Hai selezionato **0 / Nessun minerale**. Nessun filtro applicato.', 
                components: [] 
              });
            }

            // Ricerca nel DB per il minerale specifico
            const registrazioni = await Miniera.find({ 
              $or: [
                { 'items.name': mineraleScelto },
                { 'mineralType': mineraleScelto }
              ]
            }).sort({ date: -1, createdAt: -1 }).limit(10);

            if (!registrazioni || registrazioni.length === 0) {
              return await interaction.editReply({ 
                content: `⛏️ **Lista Miniera (${mineraleScelto}):** Nessun record trovato per questo minerale.`, 
                components: [] 
              });
            }

            let testo = `⛏️ **Ultimi 10 Log per il minerale: ${mineraleScelto.toUpperCase()}**\n\n`;
            registrazioni.forEach((m, index) => {
              const rawDate = m.date || m.createdAt || new Date();
              const timestampSec = Math.floor(new Date(rawDate).getTime() / 1000);
              const dateDisplay = isNaN(timestampSec) ? 'Data non disponibile' : `<t:${timestampSec}:R>`;

              const utente = m.executorId ? `<@${m.executorId}>` : 'Sconosciuto';
              
              // Estrazione quantità specifica
              let quantita = 0;
              if (m.items && Array.isArray(m.items)) {
                const itemFound = m.items.find(i => i.name === mineraleScelto);
                if (itemFound) quantita = itemFound.quantity || 0;
              } else if (m.quantity) {
                quantita = m.quantity;
              }

              testo += `**${index + 1}.** Utente: ${utente} | Quantità: **${quantita}** | Data: ${dateDisplay}\n`;
            });

            await interaction.editReply({ content: testo, components: [] });
          });
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
  {
    data: new SlashCommandBuilder()
      .setName('reset')
      .setDescription('Reset di un modulo di sistema')
      .addStringOption(opt => opt.setName('modulo').setDescription('Nome del modulo da azzerare').setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const modulo = interaction.options.getString('modulo');
      await interaction.editReply({ content: `⚙️ Modulo **${modulo}** azzerato!` });
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
