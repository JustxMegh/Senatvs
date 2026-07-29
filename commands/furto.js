const { SlashCommandBuilder } = require('discord.js');
const Furto = require('../Models /Furto.js');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('furto')
      .setDescription('Registra un furto')
      .addUserOption(opt => 
        opt.setName('utente')
           .setDescription('Utente che ha subito il furto')
           .setRequired(true))
      .addIntegerOption(opt => opt.setName('tv').setDescription('Quantità TV').setRequired(false))
      .addIntegerOption(opt => opt.setName('stampante').setDescription('Quantità Stampante').setRequired(false))
      .addIntegerOption(opt => opt.setName('microonde').setDescription('Quantità Microonde').setRequired(false))
      .addIntegerOption(opt => opt.setName('caffettiera').setDescription('Quantità Caffettiera').setRequired(false))
      .addIntegerOption(opt => opt.setName('laptop').setDescription('Quantità Laptop').setRequired(false))
      .addIntegerOption(opt => opt.setName('audio_system').setDescription('Quantità Audio System').setRequired(false))
      .addIntegerOption(opt => opt.setName('music_dock').setDescription('Quantità Music Dock').setRequired(false))
      .addIntegerOption(opt => opt.setName('monitor').setDescription('Quantità Monitor').setRequired(false))
      .addIntegerOption(opt => opt.setName('asciugacapelli').setDescription('Quantità Asciugacapelli').setRequired(false))
      .addIntegerOption(opt => opt.setName('console').setDescription('Quantità Console').setRequired(false))
      .addIntegerOption(opt => opt.setName('audio_mp3').setDescription('Quantità Audio Mp3').setRequired(false))
      .addIntegerOption(opt => opt.setName('tostapane').setDescription('Quantità Tostapane').setRequired(false))
      .addIntegerOption(opt => opt.setName('telescopio').setDescription('Quantità Telescopio').setRequired(false))
      .addIntegerOption(opt => opt.setName('digital_scales').setDescription('Quantità Digital scales').setRequired(false))
      .addIntegerOption(opt => opt.setName('stand_mixer').setDescription('Quantità Stand Mixer').setRequired(false))
      .addIntegerOption(opt => opt.setName('bollitore').setDescription('Quantità Bollitore').setRequired(false))
      .addIntegerOption(opt => opt.setName('vhs').setDescription('Quantità VHS').setRequired(false)),

    async execute(interaction) {
      await interaction.deferReply();
      
      try {
        const targetUser = interaction.options.getUser('utente');

        const items = {
          tv: interaction.options.getInteger('tv') ?? 0,
          stampante: interaction.options.getInteger('stampante') ?? 0,
          microonde: interaction.options.getInteger('microonde') ?? 0,
          caffettiera: interaction.options.getInteger('caffettiera') ?? 0,
          laptop: interaction.options.getInteger('laptop') ?? 0,
          audioSystem: interaction.options.getInteger('audio_system') ?? 0,
          musicDock: interaction.options.getInteger('music_dock') ?? 0,
          monitor: interaction.options.getInteger('monitor') ?? 0,
          asciugacapelli: interaction.options.getInteger('asciugacapelli') ?? 0,
          console: interaction.options.getInteger('console') ?? 0,
          audioMp3: interaction.options.getInteger('audio_mp3') ?? 0,
          tostapane: interaction.options.getInteger('tostapane') ?? 0,
          telescopio: interaction.options.getInteger('telescopio') ?? 0,
          digitalScales: interaction.options.getInteger('digital_scales') ?? 0,
          standMixer: interaction.options.getInteger('stand_mixer') ?? 0,
          bollitore: interaction.options.getInteger('bollitore') ?? 0,
          vhs: interaction.options.getInteger('vhs') ?? 0,
        };

        const totaleOggetti = Object.values(items).reduce((acc, curr) => acc + curr, 0);

        await Furto.create({
          executorId: interaction.user.id,
          taggedUser: targetUser.id,
          items: items,
          totalItems: totaleOggetti,
          date: new Date()
        });

        let riepilogo = Object.entries(items)
          .filter(([_, qty]) => qty > 0)
          .map(([name, qty]) => `• **${name}:** x${qty}`)
          .join('\n');

        if (!riepilogo) riepilogo = '_Nessun oggetto specificato (tutti a 0)_';

        await interaction.editReply({ 
          content: `🕵️ **Furto registrato per ${targetUser}!**\n\n**Oggetti Rubati (Totale: ${totaleOggetti}):**\n${riepilogo}` 
        });
      } catch (err) {
        console.error('❌ Errore durante /furto:', err);
        await interaction.editReply({ content: `❌ Impossibile salvare il furto. Errore DB: \`${err.message}\`` });
      }
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
