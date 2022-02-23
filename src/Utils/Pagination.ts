import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu } from "discord.js";
import { createEmbed } from "./GenerateEmbed";

export default class Pagination {
    public constructor(public ctx: CommandContext, public embed: MessageEmbed[]) { }

    public async Pagination(): Promise<void> {
        const row = new MessageActionRow()
            .addComponents([
                new MessageButton()
                    .setCustomId(this.ctx.client.utils.encodeDecodeBase64String(`${this.ctx.author.id}_deleteButton`))
                    .setEmoji("<:trash:851270257501929472>")
                    .setStyle("DANGER")
            ]);
        if (this.embed.length >= 2) {
            row.components.push(
                new MessageButton()
                    .setCustomId("firstPage")
                    .setLabel("First")
                    .setStyle("PRIMARY"),
                new MessageButton()
                    .setCustomId("previousPage")
                    .setLabel("Previous")
                    .setStyle("PRIMARY"),
                new MessageButton()
                    .setCustomId("nextPage")
                    .setLabel("Next")
                    .setStyle("PRIMARY"),
                new MessageButton()
                    .setCustomId("lastPage")
                    .setLabel("Last")
                    .setStyle("PRIMARY")
            );
        }
        let index = 0;
        const send = await this.ctx.send({
            embeds: [this.embed[index]],
            components: [row]
        });
        const collector = send.createMessageComponentCollector<2>({
            time: 180_000
        });
        collector.on("collect", async int => {
            if (int.customId === this.ctx.client.utils.encodeDecodeBase64String(`${this.ctx.author.id}_deleteButton`)) {
                if (int.user.id === this.ctx.author.id) collector.stop();
                return undefined;
            }
            if (int.user.id !== this.ctx.author.id) {
                return int.reply({
                    embeds: [
                        createEmbed("info", `**Sorry, but this interaction only for ${this.ctx.author.toString()}**`)
                    ],
                    ephemeral: true
                });
            }
            await int.deferUpdate();
            if (int.customId === "previousPage") {
                index--;
            } else if (int.customId === "nextPage") {
                index++;
            } else if (int.customId === "firstPage") {
                index = this.embed.length - this.embed.length;
            } else {
                index = this.embed.length - 1;
            }
            const something = index % this.embed.length;
            index = (something + this.embed.length) % this.embed.length;
            await send.edit({ embeds: [this.embed[index]] }).catch(() => null);
        });
        collector.on("end", async (_, reason) => {
            if (reason === "time") {
                const messageRow = send.components;
                messageRow[0].components
                    .filter(x => x.customId !== this.ctx.client.utils.encodeDecodeBase64String(`${this.ctx.author.id}_deleteButton`))
                    .map(x => (x as MessageButton).setDisabled().setStyle("SECONDARY"));
                await send.edit({ components: messageRow }).catch(() => null);
            }
        });
    }

    public async shortPagination(): Promise<void> {
        const row = new MessageActionRow()
            .addComponents([
                new MessageButton()
                    .setCustomId(this.ctx.client.utils.encodeDecodeBase64String(`${this.ctx.author.id}_deleteButton`))
                    .setEmoji("<:trash:851270257501929472>")
                    .setStyle("DANGER")
            ]);
        if (this.embed.length >= 2) {
            row.components.push(
                new MessageButton()
                    .setCustomId("previousPage")
                    .setLabel("Previous")
                    .setStyle("PRIMARY"),
                new MessageButton()
                    .setCustomId("nextPage")
                    .setLabel("Next")
                    .setStyle("PRIMARY")
            );
        }
        let index = 0;
        const send = await this.ctx.send({
            embeds: [this.embed[index]],
            components: [row]
        });
        const collector = send.createMessageComponentCollector<2>({
            time: 180_000
        });
        collector.on("collect", async int => {
            if (int.customId === this.ctx.client.utils.encodeDecodeBase64String(`${this.ctx.author.id}_deleteButton`)) {
                if (int.user.id === this.ctx.author.id) collector.stop();
                return undefined;
            }
            if (int.user.id !== this.ctx.author.id) {
                return int.reply({
                    embeds: [
                        createEmbed("info", `**Sorry, but this interaction only for ${this.ctx.author.toString()}**`)
                    ],
                    ephemeral: true
                });
            }
            await int.deferUpdate();
            if (int.customId === "previousPage") {
                index--;
            } else {
                index++;
            }
            const something = index % this.embed.length;
            index = (something + this.embed.length) % this.embed.length;
            await send.edit({ embeds: [this.embed[index]] }).catch(() => null);
        });
        collector.on("end", async (_, reason) => {
            if (reason === "time") {
                const messageRow = send.components;
                messageRow[0].components
                    .filter(x => x.customId !== this.ctx.client.utils.encodeDecodeBase64String(`${this.ctx.author.id}_deleteButton`))
                    .map(x => (x as MessageButton).setDisabled().setStyle("SECONDARY"));
                await send.edit({ components: messageRow }).catch(() => null);
            }
        });
    }

    public async selectMenuPagination(label: string[], placeHolder?: string): Promise<void> {
        const selectMenus = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId("selectMenu")
                    .setOptions(label.map((x, i) => ({ label: x, value: `${i++}` })))
                    .setPlaceholder(placeHolder ?? label[0])
            );
        const deleteButton = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(this.ctx.client.utils.encodeDecodeBase64String(`${this.ctx.author.id}_deleteButton`))
                    .setEmoji("<:trash:851270257501929472>")
                    .setStyle("DANGER")
            );
        let index = 0;
        const send = await this.ctx.send({
            embeds: [this.embed[index]],
            components: [selectMenus, deleteButton]
        });
        const collector = send.createMessageComponentCollector({
            time: 180_000
        });
        collector.on("collect", async int => {
            if (int.customId === this.ctx.client.utils.encodeDecodeBase64String(`${this.ctx.author.id}_deleteButton`)) {
                if (int.user.id === this.ctx.author.id) collector.stop();
                return undefined;
            }
            if (int.user.id !== this.ctx.author.id) {
                return int.reply({
                    embeds: [
                        createEmbed("info", `**Sorry, but this interaction only for ${this.ctx.author.toString()}**`)
                    ],
                    ephemeral: true
                });
            }
            await int.deferUpdate();
            if (int.isSelectMenu()) {
                index = int.values[0] as unknown as number;
                const messageRow = send.components;
                messageRow.find(x => x.components.find(y => y.type === "SELECT_MENU"))?.components
                    .map(x => (x as MessageSelectMenu).setPlaceholder(label[index]));
                await send.edit({ embeds: [this.embed[index]], components: messageRow }).catch(() => null);
            }
        });
        collector.on("end", async (_, reason) => {
            if (reason === "time") {
                const messageRow = send.components;
                messageRow.find(x => x.components.find(y => y.type === "SELECT_MENU"))?.components
                    .map(x => (x as MessageSelectMenu)
                        .setDisabled()
                        .setPlaceholder("This interaction has been disabled due to no respond"));
                await send.edit({ components: messageRow }).catch(() => null);
            }
        });
    }
}
