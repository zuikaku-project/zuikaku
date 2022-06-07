import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { ZuikakuListener } from "#zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "#zuikaku/types";
import { createEmbed } from "#zuikaku/Utils";
import { Message, MessageEmbed } from "discord.js";

@ZuikakuDecorator<IListenerComponent>({
    name: "ZuikakuMessageDelete",
    event: "messageDelete",
    emitter: "client"
})
export default class ZuikakuMessageDelete extends ZuikakuListener {
    public async execute(message: Message): Promise<void> {
        if (message.author.bot || message.channel.type === "DM") return;
        const snipes = this.client.snipe.get(message.channel.id) ?? [];
        const arrayEmbed: MessageEmbed[] = [];
        const snipeEmbed = createEmbed(
            "info",
            await this.parseSnipeMessage(message)
        )
            .setAuthor({
                name: message.author.tag,
                iconURL: message.author.displayAvatarURL({ dynamic: true })
            })
            .setURL(message.url);

        if (message.attachments.size) {
            const attachments = [...message.attachments.values()];
            const attachmentImage = attachments.filter(
                x => x.contentType?.split("/")[0] === "image"
            );
            const attachmentAudio = attachments.filter(
                x => x.contentType?.split("/")[0] === "audio"
            );
            if (attachmentImage.length) {
                snipeEmbed.addField(
                    "Attachment's Image(s)",
                    `${attachmentImage
                        .map(({ name, url }) => `[${name ?? ""}](<${url}>)`)
                        .join("\n")}`
                );
                if (attachmentImage.length === 1) {
                    snipeEmbed.setImage(attachmentImage[0].url);
                } else if (attachments.length > 1) {
                    arrayEmbed.push(
                        ...(await Promise.all(
                            attachmentImage.slice(0, 4).map(async x =>
                                createEmbed(
                                    "info",
                                    await this.parseSnipeMessage(message)
                                )
                                    .setImage(x.url)
                                    .setURL(message.url)
                            )
                        ))
                    );
                }
            }
            if (attachmentAudio.length) {
                snipeEmbed.addField(
                    "Attachment's Audio(s)",
                    `${attachmentAudio
                        .map(({ name, url }) => `[${name ?? ""}](<${url}>)`)
                        .join("\n")}`
                );
            }
        }
        snipeEmbed.addField(
            "Date",
            `<t:${this.generateMesageTimestamp()}:F> (<t:${this.generateMesageTimestamp()}:R>)`
        );
        arrayEmbed.unshift(snipeEmbed);
        snipes.unshift(arrayEmbed);
        snipes.splice(10);
        this.client.snipe.set(message.channel.id, snipes);
    }

    private generateMesageTimestamp(): string {
        return (new Date().getTime() / 1000).toFixed(0);
    }

    private async parseSnipeMessage(message: Message): Promise<string> {
        return message.reference
            ? `([**\`Replied to ${
                  (
                      await message.channel.messages.fetch(
                          message.reference.messageId!,
                          {
                              cache: false,
                              force: true
                          }
                      )
                  ).author.username
              }\`**]` +
                  `(${
                      (
                          await message.channel.messages.fetch(
                              message.reference.messageId!,
                              {
                                  cache: false,
                                  force: true
                              }
                          )
                      ).url
                  }))\n${message.content}`
            : message.content;
    }
}
