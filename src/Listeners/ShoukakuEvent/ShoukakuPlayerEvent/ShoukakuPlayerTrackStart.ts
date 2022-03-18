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
        const queue = this.client.shoukaku.queue.get(player.connection.guildId);
        if (queue) {
            const getGuildDatabase = await queue.getGuildDatabase;
            if (queue.playerMessage.lastPlayerMessage) {
                queue.playerMessage.lastPlayerMessage.delete().catch(() => null);
            }
            if (getGuildDatabase?.guildPlayer?.channelId) {
                await queue.shoukaku.updateGuildPlayerEmbed(queue.getGuild);
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
                        .setStyle(queue.previous ? "PRIMARY" : "SECONDARY")
                        .setCustomId(this.client.utils.encodeDecodeBase64String("Player_LAST-TRACK"))
                        .setDisabled(!queue.previous),
                    // Skip
                    new MessageButton()
                        .setLabel("NEXT")
                        .setEmoji(":next_track:891234301864202241")
                        .setStyle("PRIMARY")
                        .setCustomId(this.client.utils.encodeDecodeBase64String("Player_NEXT-TRACK")),
                    // Repeat
                    new MessageButton()
                        .setLabel(queue.queueRepeat ? "TRACK" : queue.trackRepeat ? "DISABLE" : "QUEUE")
                        .setEmoji(queue.queueRepeat ? ":repeat_one:924117419960725534" : queue.trackRepeat ? ":no_repeat:941342881845768282" : ":repeat:891234382097031168")
                        .setStyle("PRIMARY")
                        .setCustomId(this.client.utils.encodeDecodeBase64String("Player_REPEAT"))
                );
                const lastMusicMessageId = await queue.getText?.send({
                    components: [playerButton],
                    embeds: [
                        createEmbed("info")
                            .setAuthor({ name: `${queue.current!.info.title!} (${queue.current!.durationFormated!})` })
                            .setThumbnail(queue.current?.thumbnail ?? "")
                    ]
                }).catch(() => null);
                queue.playerMessage.lastPlayerMessage = lastMusicMessageId ?? null;
                if (queue._isFromPrev) {
                    queue._isFromPrev = false;
                }
            }
        }
    }
}
