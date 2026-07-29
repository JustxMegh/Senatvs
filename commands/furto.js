const { SlashCommandBuilder } = require('discord.js');
const Furto = require('../Models /Furto.js');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('furto')
      .setDescription('Registra un furto a un utente')
      .addUserOption(opt => 
        opt.setName('utente')
           .setDescription('Utente subito il furto')
           .setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply();
      const targetUser = interaction.options.getUser('utente');
      
      await Furto.create({ 
        executorId: interaction.user.id,
        taggedUser: targetUser.id,
        date: new Date()
      });

      await interaction.editReply({ content: `🕵️ **Furto salvato!** Bersaglio: ${targetUser}` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('furtoreset')
      .setDescription('Azzera tutte le registrazioni dei furti'),
    async execute(interaction) {
      await interaction.deferReply();
      await Furto.deleteMany({});
      await interaction.editReply({ content: '🔄 Tutti i dati dei **Furti** sono stati azzerati!' });
    }
  }
];
