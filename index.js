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
const Rapina = require('./Models/Rapina.js');
const Furto = require('./Models/Furto.js');
const Campo = require('./Models/Campo.js');
const Deposito = require('./Models/Deposito.js');
const Miniera = require('./Models/Miniera.js');

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
          return interaction.reply({ content: 'Accesso negato al Deposito Boss Studio.', ephemeral: true });
        }

        let dep = await Deposito.findOne({ depositoName: depName });
        if (!dep || dep.items.length === 0) return interaction.reply({ content: `Il deposito **${depName}** è vuoto.`, ephemeral: true });

        let desc = `**📦 Contenuto di ${depName}:**\n\n`;
        dep.items.forEach(i => desc += `• **${i.name}**: ${i.quantity}\n`);

        const embed = new EmbedBuilder().setTitle(`📋 ${depName}`).setDescription(desc).setColor(0x2ECC71);
        return interaction.reply({ embeds: [embed] });
      }
    }

    // ----------------------------------------------------
    // 3. MODAL SUBMIT HANDLING
    // ----------------------------------------------------
    if (interaction.isModalSubmit()) {
      const { customId, fields } = interaction;

      // --- FURTO QUANTITY MODAL ---
      if (customId.startsWith('modal_furto_qty_')) {
        const targetId = customId.replace('modal_furto_qty_', '');
        const itemsToSave = [];
        let soldiSporchiAmount = 0;

        fields.fields.forEach((field, id) => {
          const itemName = id.replace('item_qty_', '');
          const qty = parseInt(field.value) || 0;

          if (itemName === 'Soldi Sporchi') {
            soldiSporchiAmount = qty;
          } else {
            itemsToSave.push({ name: itemName, quantity: qty });
          }
        });

        await Furto.create({
          executorId: interaction.user.id,
          taggedUser: targetId,
          items: itemsToSave,
          soldiSporchiAmount
        });

        return interaction.reply({ content: `✅ **Furto registrato con successo** per <@${targetId}>!`, ephemeral: true });
      }

      // --- DEPOSITO UPDATE MODAL ---
      if (customId.startsWith('modal_aggiorna_deposito_')) {
        const depName = decodeURIComponent(customId.replace('modal_aggiorna_deposito_', ''));
        const itemName = fields.getTextInputValue('item_name');
        const itemQty = parseInt(fields.getTextInputValue('item_qty')) || 0;

        let dep = await Deposito.findOne({ depositoName: depName });
        if (!dep) dep = new Deposito({ depositoName: depName, items: [] });

        const existingItem = dep.items.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (existingItem) {
          existingItem.quantity += itemQty;
        } else {
          dep.items.push({ name: itemName, quantity: itemQty });
        }

        await dep.save();
        return interaction.reply(`✅ Aggiunti **x${itemQty} ${itemName}** al deposito **${depName}**!`);
      }

      // --- MINIERA START MODAL ---
      if (customId === 'modal_start_miniera') {
        const text = fields.getTextInputValue('participants');
        const matches = text.match(/<@!?(\d+)>/g);

        if (!matches || matches.length === 0) {
          return interaction.reply({ content: 'Nessun utente valido menzionato.', ephemeral: true });
        }

        const userIds = [...new Set(matches.map(m => m.replace(/<@!?|>/g, '')))];
        const doc = await getGlobalMinieraDoc();

        userIds.forEach(uid => {
          doc.activeSession.participants.push({
            userId: uid,
            joinedAt: new Date(),
            isCurrentlyActive: true
          });
        });

        await doc.save();
        return interaction.reply(`⛏️ **Sessione Miniera Avviata!** Partecipanti iniziali: ${userIds.map(id => `<@${id}>`).join(', ')}`);
      }

      // --- MINIERA STOP MODAL ---
      if (customId === 'modal_stop_miniera_minerals') {
        const doc = await getGlobalMinieraDoc();

        const legno = parseInt(fields.getTextInputValue('Legno')) || 0;
        const pietra = parseInt(fields.getTextInputValue('Pietra')) || 0;
        const carbone = parseInt(fields.getTextInputValue('Carbone')) || 0;
        const ferro = parseInt(fields.getTextInputValue('Ferro')) || 0;
        const altriStr = fields.getTextInputValue('Altri') || '0,0,0,0,0';
        
        const [argento, rubino, oro, smeraldo, diamante] = altriStr.split(',').map(v => parseInt(v.trim()) || 0);

        doc.stockpile.Legno = (doc.stockpile.Legno || 0) + legno;
        doc.stockpile.Pietra = (doc.stockpile.Pietra || 0) + pietra;
        doc.stockpile.Carbone = (doc.stockpile.Carbone || 0) + carbone;
        doc.stockpile.Ferro = (doc.stockpile.Ferro || 0) + ferro;
        doc.stockpile.Argento = (doc.stockpile.Argento || 0) + argento;
        doc.stockpile.Rubino = (doc.stockpile.Rubino || 0) + rubino;
        doc.stockpile.Oro = (doc.stockpile.Oro || 0) + oro;
        doc.stockpile.Smeraldo = (doc.stockpile.Smeraldo || 0) + smeraldo;
        doc.stockpile.Diamante = (doc.stockpile.Diamante || 0) + diamante;

        await doc.save();
        return interaction.reply('🛑 **Sessione Miniera conclusa e stockpile aggiornato con successo!**');
      }

      // --- MODIFICA MINERALI MODAL ---
      if (customId === 'modal_modifica_minerali') {
        const name = fields.getTextInputValue('mineral_name').trim();
        const qty = parseInt(fields.getTextInputValue('mineral_qty')) || 0;

        const doc = await getGlobalMinieraDoc();
        
        // Find exact key ignoring case
        const matchedKey = Object.keys(ITEM_PRICES).find(k => k.toLowerCase() === name.toLowerCase());
        if (!matchedKey) {
          return interaction.reply({ content: `Minerale non riconosciuto. Usa uno tra: ${Object.keys(ITEM_PRICES).join(', ')}`, ephemeral: true });
        }

        doc.stockpile[matchedKey] = qty;
        await doc.save();

        return interaction.reply(`✅ Stockpile per **${matchedKey}** aggiornato a **${qty}**.`);
      }
    }

  } catch (err) {
    console.error('Error handling interaction:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Si è verificato un errore durante l\'esecuzione del comando.', ephemeral: true }).catch(() => {});
    }
  }
});

// Client Login
client.login(process.env.DISCORD_TOKEN);
