const { SlashCommandBuilder } = require('discord.js');
const Furto = require('../Models /Furto.js');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('furto')
      .setDescription('Registra un furto specificando la quantità per ogni oggetto')
      .addUserOption(opt => 
        opt.setName('utente')
           .setDescription('Utente che ha subito il furto')
           .setRequired(true))
      .addIntegerOption(opt => opt.setName('tv').setDescription('Quantità di TV').setRequired(true))
      .addIntegerOption(opt => opt.setName('stampante').setDescription('Quantità di Stampanti').setRequired(true))
      .addIntegerOption(opt => opt.setName('microonde').setDescription('Quantità di Microonde').setRequired(true))
      .addIntegerOption(opt => opt.setName('caffettiera').setDescription('Quantità di Caffettiere').setRequired(true))
      .addIntegerOption(opt => opt.setName('laptop').setDescription('Quantità di Laptop').setRequired(true))
      .addIntegerOption(opt => opt.setName('audio_system').setDescription('Quantità di Audio System').setRequired(true))
      .addIntegerOption(opt => opt.setName('music_dock').setDescription('Quantità di Music Dock').setRequired(true))
      .addIntegerOption(opt => opt.setName('monitor').setDescription('Quantità di Monitor').setRequired(true))
      .addIntegerOption(opt => opt.setName('asciugacapelli').setDescription('Quantità di Asciugacapelli').setRequired(true))
      .addIntegerOption(opt => opt.setName('console').setDescription('Quantità di Console').setRequired(true))
      .addIntegerOption(opt => opt.setName('audio_mp3').setDescription('Quantità di Audio Mp3').setRequired(true))
      .addIntegerOption(opt => opt.setName('tostapane').setDescription('Quantità di Tostapane').setRequired(true))
      .addIntegerOption(opt => opt.setName('telescopio').setDescription('Quantità di Telescopi').setRequired(true))
      .addIntegerOption(opt => opt.setName('digital_scales').setDescription('Quantità di Digital scales').setRequired(true))
      .addIntegerOption(opt => opt.setName('stand_mixer').setDescription('Quantità di Stand Mixer').setRequired(true))
      .addIntegerOption(opt => opt.setName('bollitore').setDescription('Quantità di Bollitori dell\'acqua').setRequired(true))
      .addIntegerOption(opt => opt.setName('vhs').setDescription('Quantità di VHS').setRequired(true)),

    async execute(interaction) {
      await interaction.deferReply();
      
      const targetUser = interaction.options.getUser('utente');

      // Raccolta di tutti i valori inseriti
      const items = {
        tv: interaction.options.getInteger('tv'),
        stampante: interaction.options.getInteger('stampante'),
        microonde: interaction.options.getInteger('microonde'),
        caffettiera: interaction.options.getInteger('caffettiera'),
        laptop: interaction.options.getInteger('laptop'),
        audioSystem: interaction.options.getInteger('audio_system'),
        musicDock: interaction.options.getInteger('music_dock'),
        monitor: interaction.options.getInteger('monitor'),
        asciugacapelli: interaction.options.getInteger('asciugacapelli'),
        console: interaction.options.getInteger('console'),
        audioMp3: interaction.options.getInteger('audio_mp3'),
        tostapane: interaction.options.getInteger('tostapane'),
        telescopio: interaction.options.getInteger('telescopio'),
        digitalScales: interaction.options.getInteger('digital_scales'),
        standMixer: interaction.options.getInteger('stand_mixer'),
        bollitore: interaction.options.getInteger('bollitore'),
        vhs: interaction.options.getInteger('vhs'),
      };

      // Calcolo totale oggetti rubati
      const totaleOggetti = Object.values(items).reduce((acc, curr) => acc + curr, 0);

      // Salvataggio su MongoDB
      await Furto.create({
        executorId: interaction.user.id,
        taggedUser: targetUser.id,
        items: items,
        totalItems: totaleOggetti,
        date: new Date()
      });

      // Creazione del riepilogo testuale per la risposta
      let riepilogo = Object.entries(items)
        .filter(([_, qty]) => qty > 0)
        .map(([name, qty]) => `• **${name}:** x${qty}`)
        .join('\n');

      if (!riepilogo) riepilogo = '_Nessun oggetto rubato (tutti a 0)_';

      await interaction.editReply({ 
        content: `🕵️ **Furto registrato per ${targetUser}!**\n\n**Riepilogo oggetti (Totale: ${totaleOggetti}):**\n${riepilogo}` 
      });
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
