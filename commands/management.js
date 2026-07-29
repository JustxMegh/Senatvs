const { SlashCommandBuilder } = require('discord.js');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('player')
      .setDescription('Mostra le statistiche di un giocatore')
      .addUserOption(opt => 
        opt.setName('utente')
           .setDescription('Utente di cui mostrare i dati')
           .setRequired(true)),
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
      .addStringOption(opt =>
        opt.setName('sezione')
           .setDescription('Sezione da aggiornare (es. rapine, furti, generale)')
           .setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const sezione = interaction.options.getString('sezione');
      await interaction.editReply({ content: `🔄 Sezione **${sezione}** aggiornata con successo!` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('reset')
      .setDescription('Reset di un modulo di sistema')
      .addStringOption(opt =>
        opt.setName('modulo')
           .setDescription('Nome del modulo da azzerare')
           .setRequired(true)),
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
      .addStringOption(opt => 
        opt.setName('id')
           .setDescription('ID del record da modificare')
           .setRequired(true))
      .addStringOption(opt => 
        opt.setName('valore')
           .setDescription('Nuovo valore da impostare')
           .setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const id = interaction.options.getString('id');
      const val = interaction.options.getString('valore');
      await interaction.editReply({ content: `✏️ Record \`${id}\` aggiornato a **${val}**.` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('lista')
      .setDescription('Mostra un elenco filtrato di log')
      .addStringOption(opt =>
        opt.setName('categoria')
           .setDescription('Categoria dei log (es. rapine, furti, azioni)')
           .setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const cat = interaction.options.getString('categoria');
      await interaction.editReply({ content: `📋 Mostrando elenco completo per la categoria **${cat}**.` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('calcolo')
      .setDescription('Esegue un calcolo su un totale')
      .addNumberOption(opt => 
        opt.setName('totale')
           .setDescription('Importo su cui effettuare il calcolo')
           .setRequired(true)),
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
