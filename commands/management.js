// --- SEZIONE MINIERA (CHI HA PORTATO COSA) ---
        else if (selezione === 'lista_miniera') {
          await i.deferUpdate();

          const registrazioni = await Miniera.find().sort({ date: -1, createdAt: -1 }).limit(10).lean();

          if (!registrazioni || registrazioni.length === 0) {
            return await interaction.editReply({ content: '⛏️ **Lista Miniera:** Nessuna consegna registrata.', components: [] });
          }

          let testo = '⛏️ **Ultime Consegne Miniera (Chi ha portato cosa):**\n\n';

          registrazioni.forEach((m, index) => {
            const rawDate = m.date || m.createdAt || new Date();
            const timestampSec = Math.floor(new Date(rawDate).getTime() / 1000);
            const dateDisplay = isNaN(timestampSec) ? '' : `<t:${timestampSec}:R>`;
            
            const userId = m.executorId || m.userId || m.user || m.taggedUser || m.authorId;
            const utenteTag = userId ? `<@${userId}>` : 'Sconosciuto';

            // Formattazione tempo in miniera
            let tempoMinieraStr = 'N/D';
            if (m.durationSeconds !== undefined && m.durationSeconds > 0) {
              const min = Math.floor(m.durationSeconds / 60);
              const sec = m.durationSeconds % 60;
              tempoMinieraStr = min > 0 ? `${min}m ${sec}s` : `${sec}s`;
            }

            // Partecipanti
            let partecipantiStr = utenteTag;
            if (m.participants && m.participants.length > 0) {
              partecipantiStr = m.participants.map(id => `<@${id}>`).join(', ');
            }

            // Estrazione oggetti
            const itemsObj = m.items || {};
            const dettagli = [];
            const listaMateriali = ['legno', 'pietra', 'carbone', 'ferro', 'argento', 'rubino', 'oro', 'smeraldo', 'diamante'];
            
            for (const mat of listaMateriali) {
              const qta = Number(itemsObj[mat]) || 0;
              if (qta > 0) {
                const nomeMat = mat.charAt(0).toUpperCase() + mat.slice(1);
                dettagli.push(`- ${nomeMat}: ${qta}`);
              }
            }

            const elencoOggetti = dettagli.length > 0 ? dettagli.join('\n') : '- Nessun dettaglio';

            testo += `**${index + 1}.** Chiuso da ${utenteTag} (Data: ${dateDisplay})\n`;
            testo += `⏱️ **Tempo in miniera:** ${tempoMinieraStr}\n`;
            testo += `👥 **Partecipanti:** ${partecipantiStr}\n`;
            testo += `┗ 📦 **Ha portato:**\n${elencoOggetti}\n\n`;
          });

          await interaction.editReply({ content: testo, components: [] });
        }
