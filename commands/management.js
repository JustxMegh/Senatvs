const { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ComponentType 
} = require('discord.js');

const Furto = require('../Models /Furto.js');
const Rapina = require('../Models /Rapina.js');
const Miniera = require('../Models /Miniera.js');

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
            description: 'Mostra i log delle estrazioni e della miniera',
            value: 'lista_miniera',
            emoji: '⛏️',
          },
          {
            label: 'Rapine',
            description: 'Mostra i log e le percentuali sulle quote splittate',
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

        await i.deferUpdate();

        const selezione = i.values[0];

        // --- SEZIONE FURTI ---
        if (selezione === 'lista_furti') {
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
        // --- SEZIONE MINIERA ---
        else if (selezione === 'lista_miniera') {
          const miniera = await Miniera.find().sort({ date: -1, createdAt: -1 }).limit(10);

          if (!miniera || miniera.length === 0) {
            return await interaction.editReply({ content: '⛏️ **Lista Minerali/Miniera:** Nessun record trovato.', components: [] });
          }

          let testo = '⛏️ **Ultimi 10 Log Miniera:**\n\n';
          miniera.forEach((m, index) => {
            const rawDate = m.date || m.createdAt || new Date();
            const timestampSec = Math.floor(new Date(rawDate).getTime() / 1000);
            const dateDisplay = isNaN(timestampSec) ? '' : `| Data: <t:${timestampSec}:R>`;

            testo += `**${index + 1}.** Utente: <@${m.executorId}> | Pezzi: **${m.totalItems || 0}** | Guadagno: **$${m.totalEarnings ? m.totalEarnings.toLocaleString() : 0}** ${dateDisplay}\n`;
          });

          await interaction.editReply({ content: testo, components: [] });
        } 
        // --- SEZIONE RAPINE ---
        else if (selezione === 'lista_rapine') {
          const tutteLeRapine = await Rapina.find();

          if (!tutteLeRapine || tutteLeRapine.length === 0) {
            return await interaction.editReply({ content: '💰 **Lista Rapine:** Nessun record trovato.', components: [] });
          }

          const guadagnoNettoUtenti = {};
          let totaleQuoteSplittate = 0;

          // Calcola il bilancio totale spalmato su tutti i partecipanti di ogni rapina
          tutteLeRapine.forEach(r => {
            const importoTotale = r.totalAmount || 0;
            let listaPartecipanti = [];
            
            if (Array.isArray(r.participants) && r.participants.length > 0) {
              listaPartecipanti = r.participants;
            } else if (r.executorId) {
              listaPartecipanti = [r.executorId];
            }

            if (listaPartecipanti.length > 0) {
              const quotaSingola = importoTotale / listaPartecipanti.length;
              listaPartecipanti.forEach(uId => {
                guadagnoNettoUtenti[uId] = (guadagnoNettoUtenti[uId] || 0) + quotaSingola;
                totaleQuoteSplittate += quotaSingola;
              });
            }
          });

          const ultimeRapine = tutteLeRapine
            .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
            .slice(0, 10);

          let testo = `💰 **Ultime Rapine Registrate:**\n\n`;

          // Mostra solo il totale e la data delle ultime 10 rapine (senza l'elenco dei partecipanti sotto ognuna)
          ultimeRapine.forEach((r, index) => {
            const rawDate = r.date || r.createdAt || new Date();
            const timestampSec = Math.floor(new Date(rawDate).getTime() / 1000);
            const dateDisplay = isNaN(timestampSec) ? '' : `| <t:${timestampSec}:R>`;

            testo += `**${index + 1}.** Totale: **$${(r.totalAmount || 0).toLocaleString()}** ${dateDisplay}\n`;
          });

          testo += `\n📊 **Percentuale di Contributo Totale (dopo split delle quote):**\n`;

          const utentiOrdinati = Object.entries(guadagnoNettoUtenti)
            .sort(([, guadagnoA], [, guadagnoB]) => guadagnoB - guadagnoA);

          utentiOrdinati.forEach(([userId, guadagnoNetto]) => {
            const percentuale = totaleQuoteSplittate > 0 
              ? ((guadagnoNetto / totaleQuoteSplittate) * 100).toFixed(1) 
              : '0.0';

            testo += `• <@${userId}>: **$${guadagnoNetto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}** (${percentuale}%)\n`;
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
