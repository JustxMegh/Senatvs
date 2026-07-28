require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  PermissionFlagsBits,
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle,
  EmbedBuilder
} = require('discord.js');
const mongoose = require('mongoose');

// Mongoose Models
const Rapina = require('./models/Rapina.js');
const Furto = require('./models/Furto.js');
const Campo = require('./models/Campo.js');
const Deposito = require('./models/Deposito.js');
const Miniera = require('./models/Miniera.js');

// --- CONSTANTS & ROLES ---
const ROLE_1 = '1504768108106354702';
const ROLE_2 = '1504881557004095669';
const ROLE_3 = '1504768108106354701';
const ROLE_BOSS_STUDIO = '1509205516029657158';

const ITEM_PRICES = {
  Legno: 105,
  Pietra: 75,
  Carbone: 105,
  Ferro: 135,
  Argento: 155,
  Rubino: 185,
  Oro: 215,
  Smeraldo: 245,
  Diamante: 275
};

const FURTO_ITEMS = [
  "TV", "Stampante", "Microonde", "Caffetiera", "Laptop", "Audio System",
  "Music Dock", "Monitor", "Asciugacapelli", "Console", "Audio Mp3",
  "Tostapane", "Telescopio", "Digital scales", "Stand Mixer",
  "Bollitore dell'acqua", "VHS", "Soldi Sporchi"
];

const DEPOSITOS = [
  "Deposito Principal", "Deposito B.A.", "Deposito Boss Studio", 
  "Deposito Armi", "Deposito Droghe", "Deposito Secondario"
];

// Client Initialization
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB via Railway.'))
  .catch(err => console.error('MongoDB connection error:', err));

// Database Helper
async function getGlobalMinieraDoc() {
  let doc = await Miniera.findOne({ isGlobalStockpile: true });
  if (!doc) {
    doc = await Miniera.create({ isGlobalStockpile: true });
  }
  return doc;
}

// --- SLASH COMMAND DEFINITIONS ---
const commands = [
  // 1. RAPINA FAMILY
  new SlashCommandBuilder()
    .setName('rapina')
    .setDescription('Registra una nuova rapina')
    .addStringOption(opt => opt.setName('mentions').setDescription('Menziona gli utenti (es. @User1 @User2)').setRequired(true))
    .addNumberOption(opt => opt.setName('amount').setDescription('Importo totale').setRequired(true)),

  new SlashCommandBuilder()
    .setName('cancella')
    .setDescription('Cancella l\'ultima voce registrata')
    .addSubcommand(sub => sub.setName('rapina').setDescription('Cancella la tua ultima rapina'))
    .addSubcommand(sub => sub.setName('furto').setDescription('Cancella il tuo ultimo furto')),

  new SlashCommandBuilder()
    .setName('rapinareset')
    .setDescription('Resetta il database rapine (Ruolo Ristretto)'),

  new SlashCommandBuilder()
    .setName('lista')
    .setDescription('Mostra le liste')
    .addSubcommand(sub => sub.setName('rapina').setDescription('Mostra classifica e totali rapina'))
    .addSubcommand(sub => sub.setName('furti').setDescription('Mostra i furti effettuati'))
    .addSubcommand(sub => sub.setName('campo').setDescription('Mostra lo stato o lo storico delle sessioni campo'))
    .addSubcommand(sub => sub.setName('deposito').setDescription('Mostra la lista del deposito selezionato'))
    .addSubcommand(sub => sub.setName('minerali').setDescription('Mostra lo stato della miniera e i minerali globali')),

  new SlashCommandBuilder()
    .setName('calcolo')
    .setDescription('Comandi di calcolo')
    .addSubcommand(sub => sub.setName('soldisporchi').setDescription('Calcola il totale - 50%'))
    .addSubcommand(sub => sub.setName('minerali').setDescription('Calcola il valore totale dei minerali')),

  // 2. FURTO FAMILY
  new SlashCommandBuilder()
    .setName('furto')
    .setDescription('Registra un nuovo furto')
    .addUserOption(opt => opt.setName('target').setDescription('Utente associato').setRequired(true)),

  new SlashCommandBuilder()
    .setName('furtoreset')
    .setDescription('Resetta il database furti (Ruolo Ristretto)'),

  // 3. CAMPO FAMILY
  new SlashCommandBuilder()
    .setName('campo')
    .setDescription('Avvia una nuova sessione campo'),

  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Ferma una sessione attive')
    .addSubcommand(sub => sub.setName('campo').setDescription('Termina una sessione campo'))
    .addSubcommand(sub => sub.setName('miniera').setDescription('Termina la sessione miniera')),

  new SlashCommandBuilder()
    .setName('player')
    .setDescription('Gestisci i player nelle sessioni')
    .addSubcommandGroup(group => group
      .setName('campo')
      .setDescription('Gestisci player nel campo')
      .addSubcommand(sub => sub
        .setName('manage')
        .setDescription('Aggiungi/Rimuovi o aggiorna tempo/arma player in un campo')
      )
    )
    .addSubcommandGroup(group => group
      .setName('miniera')
      .setDescription('Gestisci player nella miniera')
      .addSubcommand(sub => sub
        .setName('manage')
        .setDescription('Entra/Esci o modifica minuti player nella miniera')
        .addUserOption(opt => opt.setName('target').setDescription('Seleziona il player').setRequired(true))
        .addStringOption(opt => opt.setName('action').setDescription('Azione').setRequired(true)
          .addChoices({ name: 'Entra', value: 'JOIN' }, { name: 'Esci', value: 'LEAVE' }, { name: 'Modifica Tempo', value: 'ADJUST' }))
        .addIntegerOption(opt => opt.setName('minutes').setDescription('Minuti da aggiungere/rimuovere (es. 10 o -10)').setRequired(false))
      )
    ),

  // 4. DEPOSITO FAMILY
  new SlashCommandBuilder()
    .setName('aggiorna')
    .setDescription('Aggiorna elementi')
    .addSubcommand(sub => sub.setName('deposito').setDescription('Aggiungi manualmente oggetti al deposito del canale')),

  new SlashCommandBuilder()
    .setName('deposito')
    .setDescription('Gestisci oggetti del deposito nel canale corrente'),

  // 5. MINIERA FAMILY
  new SlashCommandBuilder()
    .setName('miniera')
    .setDescription('Avvia la sessione di miniera'),

  new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Resetta dati')
    .addSubcommand(sub => sub.setName('minerali').setDescription('Resetta lo stockpile globale dei minerali')),

  new SlashCommandBuilder()
    .setName('modifica')
    .setDescription('Modifica valori globali')
    .addSubcommand(sub => sub.setName('minerali').setDescription('Modifica manualmente lo stockpile minerali'))
    .addSubcommand(sub => sub
      .setName('conto')
      .setDescription('Aggiungi o rimuovi importi dal conto')
      .addNumberOption(opt => opt.setName('amount').setDescription('Importo da aggiungere/sottrarre (es: 500 o -500)').setRequired(true))
    )
];

// Deploy Commands to Discord API
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('Slash commands registered successfully.');
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
})();

// --- HELPER FUNCTION: Helper Time Calculator ---
function calculateTotalSeconds(p) {
  let total = p.accumulatedSeconds || 0;
  if (p.isCurrentlyActive && p.joinedAt) {
    total += Math.floor((Date.now() - new Date(p.joinedAt).getTime()) / 1000);
  }
  total += (p.manualAdjustmentMinutes || 0) * 60;
  return Math.max(0, total);
}

// --- INTERACTION HANDLER ---
client.on('interactionCreate', async interaction => {
  try {
    // ----------------------------------------------------
    // 1. CHAT INPUT COMMANDS
    // ----------------------------------------------------
    if (interaction.isChatInputCommand()) {
      const { commandName, options, member, channel } = interaction;

      // Role Check Verification Helper
      const hasRoles = (...roles) => roles.some(r => member.roles.cache.has(r));

      // ------------------ RAPINA COMMANDS ------------------
      if (commandName === 'rapina') {
        const mentionsText = options.getString('mentions');
        const amount = options.getNumber('amount');
        const userMatches = mentionsText.match(/<@!?(\d+)>/g);

        if (!userMatches || userMatches.length === 0) {
          return interaction.reply({ content: 'Devi menzionare almeno un utente valido.', ephemeral: true });
        }

        const taggedIds = [...new Set(userMatches.map(m => m.replace(/<@!?|>/g, '')))];
        const splitAmount = amount / taggedIds.length;

        await Rapina.create({
          executorId: interaction.user.id,
          taggedUsers: taggedIds,
          totalAmount: amount,
          splitAmountPerUser: splitAmount
        });

        return interaction.reply(`✅ **Rapina registrata!** Totale: **$${amount.toLocaleString()}**. Diviso tra ${taggedIds.length} utenti ($${splitAmount.toFixed(2)} ciascuno).`);
      }

      if (commandName === 'cancella') {
        const sub = options.getSubcommand();
        if (sub === 'rapina') {
          const lastEntry = await Rapina.findOneAndDelete({ executorId: interaction.user.id }, { sort: { createdAt: -1 } });
          if (!lastEntry) return interaction.reply({ content: 'Nessuna rapina trovata da cancellare.', ephemeral: true });
          return interaction.reply(`🗑️ Ultima rapina registrata da te ($${lastEntry.totalAmount}) eliminata.`);
        }
        if (sub === 'furto') {
          const lastEntry = await Furto.findOneAndDelete({ executorId: interaction.user.id }, { sort: { createdAt: -1 } });
          if (!lastEntry) return interaction.reply({ content: 'Nessun furto trovato da cancellare.', ephemeral: true });
          return interaction.reply(`🗑️ Ultimo furto registrato da te è stato eliminato.`);
        }
      }

      if (commandName === 'rapinareset') {
        if (!hasRoles(ROLE_1)) return interaction.reply({ content: 'Non hai i permessi per eseguire questo comando.', ephemeral: true });
        await Rapina.deleteMany({});
        return interaction.reply('🚨 **Database rapine azzerato!**');
      }

      if (commandName === 'calcolo' && options.getSubcommand() === 'soldisporchi') {
        if (!hasRoles(ROLE_1, ROLE_2)) return interaction.reply({ content: 'Accesso negato.', ephemeral: true });
        
        const rapine = await Rapina.find({});
        const furti = await Furto.find({});
        let grandTotal = rapine.reduce((sum, r) => sum + r.totalAmount, 0) +
                         furti.reduce((sum, f) => sum + f.soldiSporchiAmount, 0);

        const netTotal = grandTotal - (grandTotal * 0.5);
        return interaction.reply(`💰 **Grand Total Soldi Sporchi:** $${grandTotal.toLocaleString()}\n📉 **Totale - 50%:** $${netTotal.toLocaleString()}`);
      }

      // ------------------ LISTA COMMANDS ------------------
      if (commandName === 'lista') {
        const sub = options.getSubcommand();

        if (sub === 'rapina') {
          if (!hasRoles(ROLE_1, ROLE_2)) return interaction.reply({ content: 'Accesso negato.', ephemeral: true });
          const rapine = await Rapina.find({});
          const furti = await Furto.find({});

          const userTotals = {};
          let grandTotal = 0;

          rapine.forEach(r => {
            r.taggedUsers.forEach(uid => {
              userTotals[uid] = (userTotals[uid] || 0) + r.splitAmountPerUser;
            });
            grandTotal += r.totalAmount;
          });

          furti.forEach(f => {
            if (f.soldiSporchiAmount > 0) {
              userTotals[f.taggedUser] = (userTotals[f.taggedUser] || 0) + f.soldiSporchiAmount;
              grandTotal += f.soldiSporchiAmount;
            }
          });

          if (grandTotal === 0) return interaction.reply('Nessun dato sulle rapine registrato.');

          let desc = `**GRAND TOTAL:** $${grandTotal.toLocaleString()}\n\n`;
          for (const [uid, amt] of Object.entries(userTotals)) {
            const pct = ((amt / grandTotal) * 100).toFixed(2);
            desc += `<@${uid}>: $${amt.toLocaleString()} (**${pct}%**)\n`;
          }

          const embed = new EmbedBuilder().setTitle('📊 Lista Rapine e Soldi Sporchi').setDescription(desc).setColor(0x00FF00);
          return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'furti') {
          const furti = await Furto.find({});
          const userItems = {};
          const itemTotals = {};
          let totalItemsCount = 0;

          furti.forEach(f => {
            if (!userItems[f.taggedUser]) userItems[f.taggedUser] = 0;
            f.items.forEach(i => {
              if (i.name !== 'Soldi Sporchi') {
                userItems[f.taggedUser] += i.quantity;
                itemTotals[i.name] = (itemTotals[i.name] || 0) + i.quantity;
                totalItemsCount += i.quantity;
              }
            });
          });

          let desc = `**TOTALE OGGETTI COMPLESSIVO:** ${totalItemsCount}\n\n**Per Giocatore:**\n`;
          for (const [uid, count] of Object.entries(userItems)) desc += `<@${uid}>: ${count} oggetti\n`;
          desc += `\n**Totale Per Tipo Oggetto:**\n`;
          for (const [name, count] of Object.entries(itemTotals)) desc += `• **${name}**: ${count}\n`;

          const embed = new EmbedBuilder().setTitle('📦 Lista Furti (Esclusi Soldi Sporchi)').setDescription(desc).setColor(0x3498DB);
          return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'campo') {
          if (!hasRoles(ROLE_1, ROLE_2)) return interaction.reply({ content: 'Accesso negato.', ephemeral: true });
          const campos = await Campo.find({}).sort({ sessionNumber: -1 });
          if (campos.length === 0) return interaction.reply('Nessuna sessione campo trovata.');

          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_lista_campo')
            .setPlaceholder('Seleziona una sessione Campo')
            .addOptions(campos.slice(0, 25).map(c => ({
              label: `Campo #${c.sessionNumber} (${c.status})`,
              value: c.sessionNumber.toString(),
              description: `Avviato il ${new Date(c.startTime).toLocaleDateString()}`
            })));

          const row = new ActionRowBuilder().addComponents(selectMenu);
          return interaction.reply({ content: 'Seleziona la sessione campo da visualizzare:', components: [row] });
        }

        if (sub === 'deposito') {
          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_lista_deposito')
            .setPlaceholder('Seleziona un deposito da visualizzare')
            .addOptions(DEPOSITOS.map(d => ({ label: d, value: d })));

          const row = new ActionRowBuilder().addComponents(selectMenu);
          return interaction.reply({ content: 'Seleziona un deposito:', components: [row] });
        }

        if (sub === 'minerali') {
          if (!hasRoles(ROLE_1)) return interaction.reply({ content: 'Accesso negato.', ephemeral: true });
          const doc = await getGlobalMinieraDoc();
          
          let desc = `**⛏️ Stockpile Globale Minerali:**\n`;
          for (const [min, qty] of Object.entries(doc.stockpile.toObject())) {
            desc += `• **${min}**: ${qty}\n`;
          }

          desc += `\n**👷 Partecipanti Ultima Sessione Miniera:**\n`;
          const activeSess = doc.activeSession;
          if (activeSess && activeSess.participants.length > 0) {
            activeSess.participants.forEach(p => {
              const secs = calculateTotalSeconds(p);
              const mins = Math.floor(secs / 60);
              desc += `• <@${p.userId}>: ${mins} min\n`;
            });
          } else {
            desc += `Nessuna sessione recente attiva.\n`;
          }

          const embed = new EmbedBuilder().setTitle('📊 Status Miniera & Minerali').setDescription(desc).setColor(0xF1C40F);
          return interaction.reply({ embeds: [embed] });
        }
      }

      // ------------------ FURTO COMMANDS ------------------
      if (commandName === 'furto') {
        const target = options.getUser('target');
        
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`furto_items_${target.id}`)
          .setPlaceholder('Seleziona uno o più oggetti...')
          .setMinValues(1)
          .setMaxValues(FURTO_ITEMS.length)
          .addOptions(FURTO_ITEMS.map(item => ({ label: item, value: item })));

        const row = new ActionRowBuilder().addComponents(selectMenu);
        return interaction.reply({ content: `Seleziona gli oggetti per il furto registrato a <@${target.id}>:`, components: [row], ephemeral: true });
      }

      if (commandName === 'furtoreset') {
        if (!hasRoles(ROLE_1)) return interaction.reply({ content: 'Accesso negato.', ephemeral: true });
        await Furto.deleteMany({});
        return interaction.reply('🚨 **Database furti azzerato!**');
      }

      // ------------------ CAMPO COMMANDS ------------------
      if (commandName === 'campo') {
        if (!hasRoles(ROLE_1, ROLE_2)) return interaction.reply({ content: 'Accesso negato.', ephemeral: true });

        const count = await Campo.countDocuments();
        const session = await Campo.create({
          sessionNumber: count + 1,
          status: 'ACTIVE',
          startTime: new Date()
        });

        return interaction.reply({
          content: `⚔️ **Campo #${session.sessionNumber} avviato!** Aggiungi partecipanti con il pulsante sottostante:`,
          components: [
            new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId(`campo_add_user_${session.sessionNumber}`)
                .setPlaceholder('Menu Gestione Partecipanti Campo')
                .addOptions([
                  { label: 'Aggiungi Partecipante', value: 'add' }
                ])
            )
          ]
        });
      }

      if (commandName === 'stop' && options.getSubcommand() === 'campo') {
        if (!hasRoles(ROLE_1, ROLE_2)) return interaction.reply({ content: 'Accesso negato.', ephemeral: true });
        const activeCampos = await Campo.find({ status: 'ACTIVE' });

        if (activeCampos.length === 0) return interaction.reply({ content: 'Nessun campo attivo da fermare.', ephemeral: true });

        const select = new StringSelectMenuBuilder()
          .setCustomId('select_stop_campo')
          .setPlaceholder('Seleziona il Campo da fermare')
          .addOptions(activeCampos.map(c => ({ label: `Campo #${c.sessionNumber}`, value: c.sessionNumber.toString() })));

        return interaction.reply({ content: 'Quale campo vuoi fermare?', components: [new ActionRowBuilder().addComponents(select)] });
      }

      if (commandName === 'player' && options.getSubcommandGroup() === 'campo') {
        if (!hasRoles(ROLE_1, ROLE_2)) return interaction.reply({ content: 'Accesso negato.', ephemeral: true });
        const activeCampos = await Campo.find({ status: 'ACTIVE' });
        if (activeCampos.length === 0) return interaction.reply({ content: 'Nessuna sessione campo attiva.', ephemeral: true });

        const select = new StringSelectMenuBuilder()
          .setCustomId('select_player_campo_session')
          .setPlaceholder('Seleziona sessione Campo')
          .addOptions(activeCampos.map(c => ({ label: `Campo #${c.sessionNumber}`, value: c.sessionNumber.toString() })));

        return interaction.reply({ content: 'Seleziona la sessione da gestire:', components: [new ActionRowBuilder().addComponents(select)], ephemeral: true });
      }

      // ------------------ DEPOSITO COMMANDS ------------------
      if (commandName === 'aggiorna' && options.getSubcommand() === 'deposito') {
        const depName = channel.name;
        
        // Authorization logic
        if (depName.toLowerCase().includes('boss studio')) {
          if (!hasRoles(ROLE_BOSS_STUDIO)) return interaction.reply({ content: 'Accesso negato: Solo il Boss Studio può accedere.', ephemeral: true });
        } else {
          if (!hasRoles(ROLE_1, ROLE_2, ROLE_3)) return interaction.reply({ content: 'Accesso negato per questo deposito.', ephemeral: true });
        }

        const modal = new ModalBuilder()
          .setCustomId(`modal_aggiorna_deposito_${encodeURIComponent(depName)}`)
          .setTitle(`Aggiorna ${depName}`)
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('item_name').setLabel('Nome Oggetto').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('item_qty').setLabel('Quantità da Aggiungere').setStyle(TextInputStyle.Short).setRequired(true)
            )
          );

        return interaction.showModal(modal);
      }

      if (commandName === 'deposito') {
        const depName = channel.name;
        let dep = await Deposito.findOne({ depositoName: depName });
        if (!dep || dep.items.length === 0) return interaction.reply({ content: 'Nessun oggetto in questo deposito.', ephemeral: true });

        const select = new StringSelectMenuBuilder()
          .setCustomId(`select_deposito_item_${encodeURIComponent(depName)}`)
          .setPlaceholder('Seleziona oggetti da modificare')
          .setMinValues(1)
          .setMaxValues(Math.min(dep.items.length, 5))
          .addOptions(dep.items.slice(0, 25).map(i => ({ label: `${i.name} (Attuali: ${i.quantity})`, value: i.name })));

        return interaction.reply({ content: 'Seleziona gli oggetti:', components: [new ActionRowBuilder().addComponents(select)], ephemeral: true });
      }

      // ------------------ MINIERA COMMANDS ------------------
      if (commandName === 'miniera') {
        if (!hasRoles(ROLE_1)) return interaction.reply({ content: 'Accesso negato.', ephemeral: true });
        const doc = await getGlobalMinieraDoc();

        doc.activeSession = {
          status: 'ACTIVE',
          startTime: new Date(),
          participants: []
        };
        await doc.save();

        const modal = new ModalBuilder()
          .setCustomId('modal_start_miniera')
          .setTitle('Avvia Sessione Miniera')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('participants')
                .setLabel('Menziona i partecipanti (es. @User1 @User2)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
            )
          );

        return interaction.showModal(modal);
      }

      if (commandName === 'stop' && options.getSubcommand() === 'miniera') {
        if (!hasRoles(ROLE_1)) return interaction.reply({ content: 'Accesso negato.', ephemeral: true });
        const doc = await getGlobalMinieraDoc();

        if (doc.activeSession.status !== 'ACTIVE') return interaction.reply({ content: 'Nessuna sessione miniera attiva.', ephemeral: true });

        // Close timers
        doc.activeSession.participants.forEach(p => {
          if (p.isCurrentlyActive) {
            p.accumulatedSeconds += Math.floor((Date.now() - new Date(p.joinedAt).getTime()) / 1000);
            p.isCurrentlyActive = false;
            p.leftAt = new Date();
          }
        });
        doc.activeSession.status = 'COMPLETED';
        doc.activeSession.endTime = new Date();
        await doc.save();

        const modal = new ModalBuilder()
          .setCustomId('modal_stop_miniera_minerals')
          .setTitle('Inserisci Minerali Raccolti')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('Legno').setLabel('Legno').setValue('0').setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('Pietra').setLabel('Pietra').setValue('0').setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('Carbone').setLabel('Carbone').setValue('0').setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('Ferro').setLabel('Ferro').setValue('0').setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('Altri').setLabel('Argento,Rubino,Oro,Smeraldo,Diamante').setPlaceholder('Formato: 0,0,0,0,0').setStyle(TextInputStyle.Short)
            )
          );

        return interaction.showModal(modal);
      }

      if (commandName === 'player' && options.getSubcommandGroup() === 'miniera') {
        if (!hasRoles(ROLE_1)) return interaction.reply({ content: 'Accesso negato.', ephemeral: true });
        const doc = await getGlobalMinieraDoc();
        if (doc.activeSession.status !== 'ACTIVE') return interaction.reply({ content: 'Nessuna sessione miniera attiva.', ephemeral: true });

        const target = options.getUser('target');
        const action = options.getString('action');
        const minutes = options.getInteger('minutes') || 0;

        let p = doc.activeSession.participants.find(part => part.userId === target.id);

        if (action === 'JOIN') {
          if (p && p.isCurrentlyActive) return interaction.reply({ content: 'Il giocatore è già presente.', ephemeral: true });
          if (!p) {
            doc.activeSession.participants.push({ userId: target.id, joinedAt: new Date(), isCurrentlyActive: true });
          } else {
            p.joinedAt = new Date();
            p.isCurrentlyActive = true;
          }
        } else if (action === 'LEAVE') {
          if (!p || !p.isCurrentlyActive) return interaction.reply({ content: 'Il giocatore non è attualmente attivo.', ephemeral: true });
          p.accumulatedSeconds += Math.floor((Date.now() - new Date(p.joinedAt).getTime()) / 1000);
          p.isCurrentlyActive = false;
          p.leftAt = new Date();
        } else if (action === 'ADJUST') {
          if (!p) return interaction.reply({ content: 'Giocatore non trovato nella sessione.', ephemeral: true });
          p.manualAdjustmentMinutes += minutes;
        }

        await doc.save();
        return interaction.reply(`✅ Sessione Miniera per <@${target.id}> aggiornata (${action}).`);
      }

      if (commandName === 'calcolo' && options.getSubcommand() === 'minerali') {
        if (!hasRoles(ROLE_1)) return interaction.reply({ content: 'Accesso negato.', ephemeral: true });
        const doc = await getGlobalMinieraDoc();

        let grandTotalValue = 0;
        let desc = `**💰 Calcolo Valore Stockpile Minerali:**\n\n`;

        for (const [min, price] of Object.entries(ITEM_PRICES)) {
          const qty = doc.stockpile[min] || 0;
          const val = qty * price;
          grandTotalValue += val;
          desc += `• **${min}**: ${qty} x $${price} = **$${val.toLocaleString()}**\n`;
        }
        desc += `\n**VALORE TOTALE:** $${grandTotalValue.toLocaleString()}`;

        return interaction.reply({ embeds: [new EmbedBuilder().setTitle('💎 Valore Minerali').setDescription(desc).setColor(0x9B59B6)] });
      }

      if (commandName === 'reset' && options.getSubcommand() === 'minerali') {
        if (!hasRoles(ROLE_1)) return interaction.reply({ content: 'Accesso negato.', ephemeral: true });
        const doc = await getGlobalMinieraDoc();
        for (const key of Object.keys(ITEM_PRICES)) doc.stockpile[key] = 0;
        await doc.save();
        return interaction.reply('🚨 **Stockpile dei minerali azzerato con successo!** (I dati del tempo giocatori sono rimasti invariati)');
      }

      if (commandName === 'modifica') {
        const sub = options.getSubcommand();

        if (sub === 'minerali') {
          if (!hasRoles(ROLE_1)) return interaction.reply({ content: 'Accesso negato.', ephemeral: true });
          const modal = new ModalBuilder()
            .setCustomId('modal_modifica_minerali')
            .setTitle('Modifica Stockpile Minerali')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('mineral_name').setLabel('Nome Minerale (es. Oro)').setStyle(TextInputStyle.Short).setRequired(true)
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('mineral_qty').setLabel('Nuova Quantità Totale').setStyle(TextInputStyle.Short).setRequired(true)
              )
            );

          return interaction.showModal(modal);
        }

        if (sub === 'conto') {
          if (!hasRoles(ROLE_BOSS_STUDIO)) return interaction.reply({ content: 'Accesso negato: Solo il Boss Studio può eseguire questo comando.', ephemeral: true });
          const amount = options.getNumber('amount');
          const doc = await getGlobalMinieraDoc();
          
          doc.bankBalance += amount;
          await doc.save();

          return interaction.reply(`🏦 **Conto Aggiornato!**\nModifica: **$${amount.toLocaleString()}**\nNuovo Saldo Totale: **$${doc.bankBalance.toLocaleString()}**`);
        }
      }
    }

    // ----------------------------------------------------
    // 2. SELECT MENU HANDLING
    // ----------------------------------------------------
    if (interaction.isStringSelectMenu()) {
      const { customId, values } = interaction;

      // --- FURTO ITEM SELECT ---
      if (customId.startsWith('furto_items_')) {
        const targetId = customId.replace('furto_items_', '');
        const modal = new ModalBuilder()
          .setCustomId(`modal_furto_qty_${targetId}`)
          .setTitle('Inserisci la Quantità per Oggetto');

        values.slice(0, 5).forEach(item => {
          modal.addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId(`item_qty_${item}`)
                .setLabel(`Quantità per ${item}`)
                .setValue('1')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            )
          );
        });

        return interaction.showModal(modal);
      }

      // --- LISTA CAMPO DISPLAY ---
      if (customId === 'select_lista_campo') {
        const sessionNum = parseInt(values[0]);
        const campo = await Campo.findOne({ sessionNumber: sessionNum });

        let desc = `**Stato:** ${campo.status}\n**Inizio:** ${new Date(campo.startTime).toLocaleString()}\n`;
        if (campo.endTime) desc += `**Fine:** ${new Date(campo.endTime).toLocaleString()}\n`;
        if (campo.outcome) desc += `**Esito:** ${campo.outcome} | **Fazione Avversaria:** ${campo.opponentFaction || 'N/D'}\n`;
        if (campo.weaponsLost > 0) desc += `**Armi Perse:** ${campo.weaponsLost}\n`;

        desc += `\n**Partecipanti:**\n`;
        campo.participants.forEach(p => {
          const secs = calculateTotalSeconds(p);
          const mins = Math.floor(secs / 60);
          desc += `• <@${p.userId}> | Tempo: **${mins} min** | Kills: **${p.kills}** | Arma: ${p.weaponGiven || 'Nessuna'}\n`;
        });

        if (campo.loot && campo.loot.length > 0) {
          desc += `\n**Loot Conquistato:**\n`;
          campo.loot.forEach(l => desc += `• [${l.category.toUpperCase()}] ${l.name}: x${l.quantity}\n`);
        }

        const embed = new EmbedBuilder().setTitle(`📜 Dettagli Campo #${sessionNum}`).setDescription(desc).setColor(0xE74C3C);
        return interaction.reply({ embeds: [embed] });
      }

      // --- LISTA DEPOSITO DISPLAY ---
      if (customId === 'select_lista_deposito') {
        const depName = values[0];
        
        if (depName.toLowerCase().includes('boss studio') && !interaction.member.roles.cache.has(ROLE_BOSS_STUDIO)) {
          return interaction.reply({ content: 'Accesso negato per visualizzare il deposito Boss Studio.', ephemeral: true });
        }
        if (!depName.toLowerCase().includes('boss studio') && !interaction.member.roles.cache.has(ROLE_1) && !interaction.member.roles.cache.has(ROLE_2) && !interaction.member.roles.cache.has(ROLE_3)) {
          return interaction.reply({ content: 'Accesso negato.', ephemeral: true });
        }

        const dep = await Deposito.findOne({ depositoName: depName });
        let desc = `**Oggetti nel deposito:**\n\n`;
        if (!dep || dep.items.length === 0) {
          desc += `Nessun oggetto disponibile.`;
        } else {
          dep.items.forEach(i => desc += `• **${i.name}**: ${i.quantity}\n`);
        }

        return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`📦 Status ${depName}`).setDescription(desc).setColor(0x1ABC9C)] });
      }

      // --- CAMPO ADD USER TRIGGER ---
      if (customId.startsWith('campo_add_user_')) {
        const sessionNum = customId.replace('campo_add_user_', '');
        const modal = new ModalBuilder()
          .setCustomId(`modal_campo_add_user_${sessionNum}`)
          .setTitle('Aggiungi Partecipante Campo')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('user_mention').setLabel('Menziona Partecipante (@User)').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('weapon_given').setLabel('Arma Data (lascia vuoto se Nessuna)').setStyle(TextInputStyle.Short).setRequired(false)
            )
          );
        return interaction.showModal(modal);
      }

      // --- STOP CAMPO TRIGGER ---
      if (customId === 'select_stop_campo') {
        const sessionNum = values[0];
        const modal = new ModalBuilder()
          .setCustomId(`modal_stop_campo_outcome_${sessionNum}`)
          .setTitle(`Termina Campo #${sessionNum}`)
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('outcome').setLabel('Esito: Scrivi WON o LOST').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('opponent').setLabel('Fazione Avversaria').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('weapons_lost').setLabel('Armi Perse (se LOST)').setValue('0').setStyle(TextInputStyle.Short).setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('kills').setLabel('Kills (Formato: @User1:2, @User2:5)').setStyle(TextInputStyle.Paragraph).setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('loot').setLabel('Loot (Formato: tipo:nome:qty)').setPlaceholder('es: weapons:AK47:2, drugs:Erba:50, bullets:9mm:500').setStyle(TextInputStyle.Paragraph).setRequired(false)
            )
          );
        return interaction.showModal(modal);
      }

      // --- PLAYER CAMPO SESSION SELECT ---
      if (customId === 'select_player_campo_session') {
        const sessionNum = values[0];
        const modal = new ModalBuilder()
          .setCustomId(`modal_manage_player_campo_${sessionNum}`)
          .setTitle(`Gestisci Player Campo #${sessionNum}`)
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('target_user').setLabel('Menzione Utente (@User)').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('action').setLabel('Azione: JOIN, LEAVE, o ADJUST').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('weapon').setLabel('Arma Data (Opzionale)').setStyle(TextInputStyle.Short).setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('minutes').setLabel('Minuti +/- (se azione ADJUST)').setStyle(TextInputStyle.Short).setRequired(false)
            )
          );
        return interaction.showModal(modal);
      }

      // --- DEPOSITO ITEM SELECTION ---
      if (customId.startsWith('select_deposito_item_')) {
        const depName = decodeURIComponent(customId.replace('select_deposito_item_', ''));
        const modal = new ModalBuilder()
          .setCustomId(`modal_update_deposito_items_${encodeURIComponent(depName)}`)
          .setTitle('Modifica Quantità Deposito');

        values.forEach(itemName => {
          modal.addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId(`qty_${itemName}`)
                .setLabel(`Qtà da aggiungere/rimuovere per ${itemName}`)
                .setPlaceholder('es. 5 oppure -3')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            )
          );
        });

        return interaction.showModal(modal);
      }
    }

    // ----------------------------------------------------
    // 3. MODAL SUBMISSION HANDLING
    // ----------------------------------------------------
    if (interaction.isModalSubmit()) {
      const { customId, fields } = interaction;

      // --- FURTO MODAL ---
      if (customId.startsWith('modal_furto_qty_')) {
        const targetId = customId.replace('modal_furto_qty_', '');
        const items = [];
        let soldiSporchiAmount = 0;

        fields.fields.forEach((field, key) => {
          const itemName = key.replace('item_qty_', '');
          const qty = parseInt(field.value) || 0;
          items.push({ name: itemName, quantity: qty });

          if (itemName === 'Soldi Sporchi') {
            soldiSporchiAmount += qty;
          }
        });

        await Furto.create({
          executorId: interaction.user.id,
          taggedUser: targetId,
          items: items,
          soldiSporchiAmount: soldiSporchiAmount
        });

        return interaction.reply(`✅ **Furto registrato per <@${targetId}>!**\n` + items.map(i => `• ${i.name}: x${i.quantity}`).join('\n'));
      }

      // --- CAMPO ADD USER MODAL ---
      if (customId.startsWith('modal_campo_add_user_')) {
        const sessionNum = parseInt(customId.replace('modal_campo_add_user_', ''));
        const userMention = fields.getTextInputValue('user_mention');
        const weaponGiven = fields.getTextInputValue('weapon_given') || null;

        const uid = userMention.replace(/<@!?|>/g, '');
        const campo = await Campo.findOne({ sessionNumber: sessionNum });

        campo.participants.push({
          userId: uid,
          weaponGiven: weaponGiven,
          joinedAt: new Date(),
          isCurrentlyActive: true
        });
        await campo.save();

        // Deposito B.A. Automation for Weapons Handed Out
        if (weaponGiven) {
          let depBA = await Deposito.findOne({ depositoName: 'Deposito B.A.' });
          if (!depBA) depBA = await Deposito.create({ depositoName: 'Deposito B.A.', items: [] });
          
          const existingItem = depBA.items.find(i => i.name.toLowerCase() === weaponGiven.toLowerCase());
          if (existingItem) existingItem.quantity += 1;
          else depBA.items.push({ name: weaponGiven, quantity: 1 });
          
          await depBA.save();
        }

        return interaction.reply(`✅ Partecipante <@${uid}> aggiunto al Campo #${sessionNum}.${weaponGiven ? ` Arma **${weaponGiven}** aggiunta automaticamente al Deposito B.A.` : ''}`);
      }

      // --- STOP CAMPO MODAL ---
      if (customId.startsWith('modal_stop_campo_outcome_')) {
        const sessionNum = parseInt(customId.replace('modal_stop_campo_outcome_', ''));
        const outcome = fields.getTextInputValue('outcome').toUpperCase();
        const opponent = fields.getTextInputValue('opponent');
        const weaponsLost = parseInt(fields.getTextInputValue('weapons_lost')) || 0;
        const killsText = fields.getTextInputValue('kills') || '';
        const lootText = fields.getTextInputValue('loot') || '';

        const campo = await Campo.findOne({ sessionNumber: sessionNum });
        campo.status = 'COMPLETED';
        campo.endTime = new Date();
        campo.outcome = outcome;
        campo.opponentFaction = opponent;
        campo.weaponsLost = weaponsLost;

        // Stop participant timers
        campo.participants.forEach(p => {
          if (p.isCurrentlyActive) {
            p.accumulatedSeconds += Math.floor((Date.now() - new Date(p.joinedAt).getTime()) / 1000);
            p.isCurrentlyActive = false;
            p.leftAt = new Date();
          }
        });

        // Parse kills
        if (killsText) {
          const killEntries = killsText.split(',');
          killEntries.forEach(entry => {
            const [uMatch, kVal] = entry.split(':');
            if (uMatch && kVal) {
              const uid = uMatch.trim().replace(/<@!?|>/g, '');
              const part = campo.participants.find(p => p.userId === uid);
              if (part) part.kills = parseInt(kVal.trim()) || 0;
            }
          });
        }

        // Parse & apply loot automations
        if (outcome === 'WON' && lootText) {
          const lootEntries = lootText.split(',');
          let bossStudioDep = await Deposito.findOne({ depositoName: 'Deposito Boss Studio' });
          if (!bossStudioDep) bossStudioDep = await Deposito.create({ depositoName: 'Deposito Boss Studio', items: [] });

          for (const entry of lootEntries) {
            const [cat, name, qty] = entry.split(':').map(s => s.trim());
            const parsedQty = parseInt(qty) || 0;
            campo.loot.push({ category: cat.toLowerCase(), name, quantity: parsedQty });

            // Automate Drugs to Deposito Boss Studio
            if (cat.toLowerCase() === 'drugs') {
              const itemInBoss = bossStudioDep.items.find(i => i.name.toLowerCase() === name.toLowerCase());
              if (itemInBoss) itemInBoss.quantity += parsedQty;
              else bossStudioDep.items.push({ name: name, quantity: parsedQty });
            }
          }
          await bossStudioDep.save();
        }

        // Automate weapons lost subtraction from Deposito B.A.
        if (outcome === 'LOST' && weaponsLost > 0) {
          let depBA = await Deposito.findOne({ depositoName: 'Deposito B.A.' });
          if (depBA && depBA.items.length > 0) {
            depBA.items[0].quantity = Math.max(0, depBA.items[0].quantity - weaponsLost);
            await depBA.save();
          }
        }

        await campo.save();
        return interaction.reply(`🛑 **Campo #${sessionNum} terminato!** Esito: **${outcome}**.`);
      }

      // --- PLAYER CAMPO MANAGEMENT MODAL ---
      if (customId.startsWith('modal_manage_player_campo_')) {
        const sessionNum = parseInt(customId.replace('modal_manage_player_campo_', ''));
        const targetUser = fields.getTextInputValue('target_user');
        const action = fields.getTextInputValue('action').toUpperCase();
        const weapon = fields.getTextInputValue('weapon') || null;
        const minutes = parseInt(fields.getTextInputValue('minutes')) || 0;

        const uid = targetUser.replace(/<@!?|>/g, '');
        const campo = await Campo.findOne({ sessionNumber: sessionNum });
        let p = campo.participants.find(part => part.userId === uid);

        if (action === 'JOIN') {
          if (!p) {
            campo.participants.push({ userId: uid, weaponGiven: weapon, joinedAt: new Date(), isCurrentlyActive: true });
          } else {
            p.joinedAt = new Date();
            p.isCurrentlyActive = true;
            if (weapon) p.weaponGiven = weapon;
          }
        } else if (action === 'LEAVE') {
          if (p && p.isCurrentlyActive) {
            p.accumulatedSeconds += Math.floor((Date.now() - new Date(p.joinedAt).getTime()) / 1000);
            p.isCurrentlyActive = false;
            p.leftAt = new Date();
          }
        } else if (action === 'ADJUST') {
          if (p) p.manualAdjustmentMinutes += minutes;
        }

        // Weapon handed out -> Deposito B.A. automation
        if (weapon && (action === 'JOIN' || action === 'ADJUST')) {
          let depBA = await Deposito.findOne({ depositoName: 'Deposito B.A.' });
          if (!depBA) depBA = await Deposito.create({ depositoName: 'Deposito B.A.', items: [] });
          const existingItem = depBA.items.find(i => i.name.toLowerCase() === weapon.toLowerCase());
          if (existingItem) existingItem.quantity += 1;
          else depBA.items.push({ name: weapon, quantity: 1 });
          await depBA.save();
        }

        await campo.save();
        return interaction.reply(`✅ Player <@${uid}> in Campo #${sessionNum} aggiornato!`);
      }

      // --- AGGIORNA DEPOSITO MODAL ---
      if (customId.startsWith('modal_aggiorna_deposito_')) {
        const depName = decodeURIComponent(customId.replace('modal_aggiorna_deposito_', ''));
        const itemName = fields.getTextInputValue('item_name');
        const itemQty = parseInt(fields.getTextInputValue('item_qty')) || 0;

        let dep = await Deposito.findOne({ depositoName: depName });
        if (!dep) dep = await Deposito.create({ depositoName: depName, items: [] });

        const existing = dep.items.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (existing) existing.quantity += itemQty;
        else dep.items.push({ name: itemName, quantity: itemQty });

        await dep.save();
        return interaction.reply(`✅ Aggiornato **${depName}**: aggiunti ${itemQty}x **${itemName}**.`);
      }

      // --- UPDATE DEPOSITO ITEMS MODAL ---
      if (customId.startsWith('modal_update_deposito_items_')) {
        const depName = decodeURIComponent(customId.replace('modal_update_deposito_items_', ''));
        let dep = await Deposito.findOne({ depositoName: depName });

        fields.fields.forEach((field, key) => {
          const itemName = key.replace('qty_', '');
          const qtyChange = parseInt(field.value) || 0;

          const item = dep.items.find(i => i.name === itemName);
          if (item) item.quantity = Math.max(0, item.quantity + qtyChange);
        });

        await dep.save();
        return interaction.reply(`✅ Quantità nel deposito **${depName}** aggiornate.`);
      }

      // --- START MINIERA MODAL ---
      if (customId === 'modal_start_miniera') {
        const text = fields.getTextInputValue('participants');
        const userMatches = text.match(/<@!?(\d+)>/g);

        const doc = await getGlobalMinieraDoc();
        if (userMatches) {
          const ids = [...new Set(userMatches.map(m => m.replace(/<@!?|>/g, '')))];
          ids.forEach(uid => {
            doc.activeSession.participants.push({
              userId: uid,
              joinedAt: new Date(),
              isCurrentlyActive: true
            });
          });
        }
        await doc.save();
        return interaction.reply('⛏️ **Sessione Miniera Avviata!** Timer in corso per i partecipanti.');
      }

      // --- STOP MINIERA MINERALS MODAL ---
      if (customId === 'modal_stop_miniera_minerals') {
        const doc = await getGlobalMinieraDoc();

        const legno = parseInt(fields.getTextInputValue('Legno')) || 0;
        const pietra = parseInt(fields.getTextInputValue('Pietra')) || 0;
        const carbone = parseInt(fields.getTextInputValue('Carbone')) || 0;
        const ferro = parseInt(fields.getTextInputValue('Ferro')) || 0;
        const altriStr = fields.getTextInputValue('Altri') || '0,0,0,0,0';
        const [argento, rubino, oro, smeraldo, diamante] = altriStr.split(',').map(s => parseInt(s.trim()) || 0);

        doc.stockpile.Legno += legno;
        doc.stockpile.Pietra += pietra;
        doc.stockpile.Carbone += carbone;
        doc.stockpile.Ferro += ferro;
        doc.stockpile.Argento += argento;
        doc.stockpile.Rubino += rubino;
        doc.stockpile.Oro += oro;
        doc.stockpile.Smeraldo += smeraldo;
        doc.stockpile.Diamante += diamante;

        await doc.save();
        return interaction.reply('🛑 **Sessione Miniera terminata e minerali aggiunti allo stockpile globale!**');
      }

      // --- MODIFICA MINERALI MODAL ---
      if (customId === 'modal_modifica_minerali') {
        const name = fields.getTextInputValue('mineral_name').trim();
        const qty = parseInt(fields.getTextInputValue('mineral_qty')) || 0;

        const doc = await getGlobalMinieraDoc();
        if (doc.stockpile[name] !== undefined) {
          doc.stockpile[name] = qty;
          await doc.save();
          return interaction.reply(`✅ Minerale **${name}** aggiornato a quantità: **${qty}**.`);
        } else {
          return interaction.reply({ content: `Minerale "${name}" non valido. Scegli tra: ${Object.keys(ITEM_PRICES).join(', ')}`, ephemeral: true });
        }
      }
    }
  } catch (err) {
    console.error('Interaction error:', err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Si è verificato un errore durante l\'esecuzione del comando.', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Si è verificato un errore durante l\'esecuzione del comando.', ephemeral: true });
    }
  }
});

// Login Bot
client.login(process.env.DISCORD_TOKEN);
