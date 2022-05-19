import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { ZuikakuListener } from "#zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "#zuikaku/types";
import { Message } from "discord.js";

@ZuikakuDecorator<IListenerComponent>({
    name: "ZuikakuMessageDelete",
    event: "messageDelete",
    emitter: "client"
})
export default class ZuikakuMessageDelete extends ZuikakuListener {
    public async execute(message: Message): Promise<void> {
        if (message.author.bot || message.channel.type === "DM") return;
        const snipes = this.client.snipe.get(message.channel.id) ?? [];
        snipes.unshift({
            date: (new Date().getTime() / 1000).toFixed(0),
            author: message.author,
            content: message.reference
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
                : message.content,
            attachments: message.attachments.map(
                ({ name, url }) => `[${name ?? ""}](<${url}>)`
            )
        });
        snipes.splice(10);
        this.client.snipe.set(message.channel.id, snipes);
    }
}
