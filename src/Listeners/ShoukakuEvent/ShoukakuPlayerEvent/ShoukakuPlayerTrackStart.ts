/* eslint-disable no-nested-ternary */
import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { MessageActionRow, MessageButton } from "discord.js";
import { ShoukakuPlayer } from "shoukaku";

@ZuikakuDecorator<IListenerComponent>({
    name: "ShoukakuPlayerTrackStart",
    event: "playerTrackStart",
    emitter: "shoukaku"
})
export default class ShoukakuPlayerTrackStart extends ZuikakuListener {
    public async execute(player: ShoukakuPlayer): Promise<void> {
        const dispatcher = this.client.shoukaku.dispatcher.get(player.connection.guildId);
        if (dispatcher) {
            const getGuildDatabase = await dispatcher.getGuildDatabase;
            if (dispatcher.queueMessage.lastPlayerMessage) {
                dispatcher.queueMessage.lastPlayerMessage.delete().catch(() => null);
            }
            if (getGuildDatabase?.guildPlayer?.channelId) {
                await dispatcher.shoukaku.updateGuildPlayerEmbed(dispatcher.getGuild);
            } else {
                const playerButton = new MessageActionRow().addComponents(
                    // Stop
                    new MessageButton()
                        .setLabel("STOP")
                        .setEmoji(":stop:891234533834383391")
                        .setStyle("PRIMARY")
                        .setCustomId(this.client.utils.encodeDecodeBase64String("Player_STOP")),
                    // Pause-resume
                    new MessageButton()
                        .setLabel("PAUSE")
                        .setEmoji(":pause:941343422017581086")
                        .setStyle("PRIMARY")
                        .setCustomId(this.client.utils.encodeDecodeBase64String("Player_PLAY-PAUSE")),
                    // Previous
                    new MessageButton()
                        .setLabel("BACK")
                        .setEmoji(":last_track:940768883554525235")
                        .setStyle(dispatcher.queue.previous ? "PRIMARY" : "SECONDARY")
                        .setCustomId(this.client.utils.encodeDecodeBase64String("Player_LAST-TRACK"))
                        .setDisabled(!dispatcher.queue.previous),
                    // Skip
                    new MessageButton()
                        .setLabel("NEXT")
                        .setEmoji(":next_track:891234301864202241")
                        .setStyle("PRIMARY")
                        .setCustomId(this.client.utils.encodeDecodeBase64String("Player_NEXT-TRACK")),
                    // Repeat
                    new MessageButton()
                        .setLabel(dispatcher.queueRepeat ? "TRACK" : dispatcher.trackRepeat ? "DISABLE" : "QUEUE")
                        .setEmoji(dispatcher.queueRepeat ? ":repeat_one:924117419960725534" : dispatcher.trackRepeat ? ":no_repeat:941342881845768282" : ":repeat:891234382097031168")
                        .setStyle("PRIMARY")
                        .setCustomId(this.client.utils.encodeDecodeBase64String("Player_REPEAT"))
                );
                const lastMusicMessageId = await dispatcher.getText?.send({
                    components: [playerButton],
                    embeds: [
                        createEmbed("info")
                            .setAuthor({ name: `${dispatcher.queue.current!.info.title!} (${dispatcher.queue.current!.durationFormated!})` })
                            .setThumbnail(dispatcher.queue.current?.thumbnail ?? "")
                    ]
                }).catch(() => null);
                dispatcher.queueMessage.lastPlayerMessage = lastMusicMessageId ?? null;
                if (dispatcher.queueChecker._isFromPrevious) {
                    dispatcher.queueChecker._isFromPrevious = false;
                }
            }
        }
    }
}
