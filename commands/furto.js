const { SlashCommandBuilder } = require('discord.js');
const Furto = require('../Models /Furto.js');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('furto')
      .setDescription('Registra un furto (puoi inserire 0 per gli oggetti non rubati)')
      .addUserOption(opt => 
        opt.setName('utente')
           .setDescription('Utente che ha subito il furto')
           .setRequired(true))
      .addIntegerOption(opt => opt.setName('tv').setDescription('Quantità di TV (metti 0 se nessuno)').setRequired(true))
      .addIntegerOption(opt => opt.setName('stampante').setDescription('Quantità di Stampanti (metti 0 se nessuno)').setRequired(true))
      .addIntegerOption(opt => opt.setName('microonde').setDescription('Quantità di Microonde (metti 0 se nessuno)').setRequired(true))
      .addIntegerOption(opt => opt.setName('caffettiera').setDescription('Quantità di Caffettiere (metti 0 se nessuno)').setRequired(true))
      .addIntegerOption(opt => opt.setName('laptop').setDescription('Quantità di Laptop (metti 0 se nessuno)').setRequired(true))
      .addIntegerOption(opt => opt.setName('audio_system').setDescription('Quantità di Audio System (metti 0 se nessuno)').setRequired(true))
      .addIntegerOption(opt => opt.setName('music_dock').setDescription('Quantità di Music Dock (metti 0 se nessuno)').setRequired(true))
      .addIntegerOption(opt => opt.setName('monitor').setDescription('Quantità di Monitor (metti 0 se nessuno)').setRequired(true))
      .addIntegerOption(opt => opt.setName('asciugacapelli').setDescription('Quantità di Asciugacapelli (metti 0 se nessuno)').setRequired(true))
      .addIntegerOption(opt => opt.setName('console').setDescription('Quantità di Console (metti 0 se nessuno)').setRequired(true))
      .addIntegerOption(opt => opt.setName('audio_mp3').setDescription('Quantità di Audio Mp3 (metti 0 se nessuno)').setRequired(true))
      .addIntegerOption(opt => opt.setName('tostapane').setDescription('Quantità di Tostapane (metti 0 se nessuno)').setRequired(true))
      .addIntegerOption(opt => opt.setName('telescopio').setDescription('Quantità di Telescopi (metti 0 se nessuno)').setRequired(true))
      .addIntegerOption(opt => opt.setName('digital_scales').setDescription('Quantità di Digital scales (metti 0 se nessuno)').setRequired(true))
      .addIntegerOption(opt => opt.setName('stand_mixer').setDescription('Quantità di Stand Mixer (metti 0 se nessuno)').setRequired(true))
      .addIntegerOption(opt => opt.setName('bollitore').setDescription('Quantità di Bollitori dell\'acqua (metti 0 se nessuno)').setRequired(true))
      .addIntegerOption(opt => opt.setName('vhs').setDescription('Quantità di VHS (metti 0 se nessuno)').setRequired(true)),

    async execute(interaction) {
      await interaction.deferReply();
      
      const targetUser = interaction.options.getUser('utente');

      // Accetta qualsiasi numero intero (compreso 0)
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

      // Calcola la somma totale di tutti i pezzi rubati
      const totaleOggetti = Object.values(items).reduce((acc, curr) => acc + curr, 0);

      // Salvataggio nel DB
      await Furto.create({
        executorId: interaction.user.id,
        taggedUser: targetUser.id,
        items: items,
        totalItems: totaleOggetti,
        date: new Date()
      });

      // Filtra solo gli oggetti inseriti con quantità maggiore di 0 per la risposta visiva
      let riepilogo = Object.entries(items)
        .filter(([_, qty]) => qty > 0)
        .map(([name, qty]) => `• **${name}:** x${qty}`)
        .join('\n');

      if (!riepilogo) riepilogo = '_Nessun oggetto rubato (tutti impostati a 0)_';

      await interaction.editReply({ 
        content: `🕵️ **Furto registrato per ${targetUser}!**\n\n**Oggetti Rubati (Totale: ${totaleOggetti}):**\n${riepilogo}` 
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
