const { SlashCommandBuilder } = require('discord.js');
const Rapina = require('../Models /Rapina.js');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('rapina')
      .setDescription('Registra una rapina e calcola la divisione delle quote')
      .addNumberOption(opt => 
        opt.setName('totale')
           .setDescription('Importo totale della rapina ($)')
           .setRequired(true))
      .addUserOption(opt => 
        opt.setName('partecipante1')
           .setDescription('Primo partecipante (obbligatorio)')
           .setRequired(true))
      .addUserOption(opt => 
        opt.setName('partecipante2')
           .setDescription('Secondo partecipante (opzionale)')
           .setRequired(false))
      .addUserOption(opt => 
        opt.setName('partecipante3')
           .setDescription('Terzo partecipante (opzionale)')
           .setRequired(false))
      .addUserOption(opt => 
        opt.setName('partecipante4')
           .setDescription('Quarto partecipante (opzionale)')
           .setRequired(false))
      .addUserOption(opt => 
        opt.setName('partecipante5')
           .setDescription('Quinto partecipante (opzionale)')
           .setRequired(false)),

    async execute(interaction) {
      await interaction.deferReply();

      try {
        const totalAmount = interaction.options.getNumber('totale');

        // Raccolta dinamica di tutti i partecipanti inseriti (senza duplicati)
        const participants = [];
        for (let i = 1; i <= 5; i++) {
          const user = interaction.options.getUser(`partecipante${i}`);
          if (user && !participants.some(p => p.id === user.id)) {
            participants.push(user);
          }
        }

        const numParticipants = participants.length;
        const splitAmount = totalAmount / numParticipants;

        // Salvataggio nel database con la lista completa dei partecipanti
        await Rapina.create({
          executorId: interaction.user.id,
          totalAmount: totalAmount,
          participants: participants.map(u => u.id),
          splitAmountPerUser: splitAmount,
          date: new Date()
        });

        const listaPartecipanti = participants.map(u => `<@${u.id}>`).join(', ');

        await interaction.editReply({
          content: `💰 **Rapina Registrata!**\n\n` +
                   `• **Importo Totale:** $${totalAmount.toLocaleString()}\n` +
                   `• **Partecipanti (${numParticipants}):** ${listaPartecipanti}\n` +
                   `• **Quota a persona:** $${splitAmount.toFixed(2).toLocaleString()}`
        });

      } catch (err) {
        console.error('❌ Errore durante /rapina:', err);
        await interaction.editReply({ 
          content: `❌ Si è verificato un errore durante la registrazione della rapina: \`${err.message}\`` 
        });
      }
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('rapinareset')
      .setDescription('Azzera tutte le registrazioni delle rapine'),
    async execute(interaction) {
      await interaction.deferReply();
      try {
        await Rapina.deleteMany({});
        await interaction.editReply({ content: '🔄 Tutti i dati delle **Rapine** sono stati azzerati!' });
      } catch (err) {
        console.error('❌ Errore durante /rapinareset:', err);
        await interaction.editReply({ content: `❌ Impossibile azzerare i dati: \`${err.message}\`` });
      }
    }
  }
];
