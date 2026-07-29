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

        // Mappa dei nomi puliti
        const rawOptions = [
          { name: 'TV', qty: interaction.options.getInteger('tv') ?? 0 },
          { name: 'Stampante', qty: interaction.options.getInteger('stampante') ?? 0 },
          { name: 'Microonde', qty: interaction.options.getInteger('microonde') ?? 0 },
          { name: 'Caffettiera', qty: interaction.options.getInteger('caffettiera') ?? 0 },
          { name: 'Laptop', qty: interaction.options.getInteger('laptop') ?? 0 },
          { name: 'Audio System', qty: interaction.options.getInteger('audio_system') ?? 0 },
          { name: 'Music Dock', qty: interaction.options.getInteger('music_dock') ?? 0 },
          { name: 'Monitor', qty: interaction.options.getInteger('monitor') ?? 0 },
          { name: 'Asciugacapelli', qty: interaction.options.getInteger('asciugacapelli') ?? 0 },
          { name: 'Console', qty: interaction.options.getInteger('console') ?? 0 },
          { name: 'Audio Mp3', qty: interaction.options.getInteger('audio_mp3') ?? 0 },
          { name: 'Tostapane', qty: interaction.options.getInteger('tostapane') ?? 0 },
          { name: 'Telescopio', qty: interaction.options.getInteger('telescopio') ?? 0 },
          { name: 'Digital Scales', qty: interaction.options.getInteger('digital_scales') ?? 0 },
          { name: 'Stand Mixer', qty: interaction.options.getInteger('stand_mixer') ?? 0 },
          { name: 'Bollitore', qty: interaction.options.getInteger('bollitore') ?? 0 },
          { name: 'VHS', qty: interaction.options.getInteger('vhs') ?? 0 }
        ];

        // Trasformiamo la lista nel formato richiesto dal DB: Array di { name, quantity }
        const itemsArray = rawOptions.map(item => ({
          name: item.name,
          quantity: item.qty
        }));

        // Calcolo del totale dei pezzi rubati
        const totaleOggetti = itemsArray.reduce((acc, curr) => acc + curr.quantity, 0);

        // Salvataggio nel DB con l'Array corretto
        await Furto.create({
          executorId: interaction.user.id,
          taggedUser: targetUser.id,
          items: itemsArray,
          totalItems: totaleOggetti,
          date: new Date()
        });

        // Stringa di riepilogo solo con gli oggetti > 0 per pulizia visiva
        const oggettiRubati = itemsArray.filter(i => i.quantity > 0);
        let riepilogo = oggettiRubati
          .map(i => `• **${i.name}:** x${i.quantity}`)
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
