const { SlashCommandBuilder } = require('discord.js');
const Rapina = require('../Models /Rapina.js');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('rapina')
      .setDescription('Registra una nuova rapina')
      .addIntegerOption(opt => 
        opt.setName('totale')
           .setDescription('Importo totale della rapina')
           .setRequired(true))
      .addIntegerOption(opt => 
        opt.setName('partecipanti')
           .setDescription('Numero di persone che hanno partecipato')
           .setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const totale = interaction.options.getInteger('totale');
      const persone = interaction.options.getInteger('partecipanti');
      
      // Calcolo quota applicando il -70% diviso per i partecipanti
      const totaleNetto = totale * 0.30;
      const splitAmount = persone > 0 ? totaleNetto / persone : totaleNetto;

      await Rapina.create({ 
        executorId: interaction.user.id,
        totalAmount: totale,
        splitAmountPerUser: splitAmount,
        date: new Date()
      });

      await interaction.editReply({ 
        content: `💰 **Rapina salvata!**\n• Totale: **$${totale.toLocaleString()}**\n• Partecipanti: **${persone}**\n• Quota a testa (-70%): **$${splitAmount.toFixed(2)}**` 
      });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('cancella')
      .setDescription('Elimina una registrazione tramite ID')
      .addStringOption(opt => 
        opt.setName('id')
           .setDescription('L\'ID del record da eliminare')
           .setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const id = interaction.options.getString('id');
      
      const deleted = await Rapina.findByIdAndDelete(id);
      if (!deleted) return await interaction.editReply({ content: `❌ Voce \`${id}\` non trovata.` });
      
      await interaction.editReply({ content: `🗑️ Voce \`${id}\` eliminata con successo.` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('rapinareset')
      .setDescription('Azzera tutti i dati delle rapine'),
    async execute(interaction) {
      await interaction.deferReply();
      await Rapina.deleteMany({});
      await interaction.editReply({ content: '🔄 Tutti i dati delle **Rapine** sono stati azzerati!' });
    }
  }
];
