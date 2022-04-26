/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { MessageInteractionAction } from "@zuikaku/types/core";
import { InteractionTypes, MessageComponentTypes } from "@zuikaku/types/enum";
import { Utils } from "@zuikaku/Utils";
import {
    ButtonInteraction,
    Collection,
    CommandInteraction,
    CommandInteractionOptionResolver,
    ContextMenuInteraction,
    GuildMember,
    Interaction,
    InteractionReplyOptions,
    Message,
    MessageActionRow,
    MessageAttachment,
    MessageButton,
    MessageMentions,
    MessageOptions,
    MessagePayload,
    SelectMenuInteraction,
    TextBasedChannel,
    User
} from "discord.js";
import { ZuikakuClient } from "./ZuikakuClient";

export class CommandContext {
    public additionalArgs: Collection<string, any> = new Collection();
    public channel: TextBasedChannel | null = this.context.channel;
    public guild = this.context.guild;
    public activateCollector = false;
    public constructor(
        public client: ZuikakuClient,
        public readonly context:
            | CommandInteraction
            | ContextMenuInteraction
            | Interaction
            | Message
            | SelectMenuInteraction,
        public args: string[] = []
    ) {}

    public setAdditionalArgs(key: string, value: any): this {
        this.additionalArgs.set(key, value);
        return this;
    }

    public async deferReply(ephemeral = false): Promise<void> {
        if (this.isInteraction()) {
            return (this.context as CommandInteraction).deferReply({
                ephemeral
            });
        }
        return Promise.resolve(undefined);
    }

    public async send(
        options:
            | InteractionReplyOptions
            | MessageOptions
            | MessagePayload
            | string
            | { deleteButton?: { reference: string } },
        type: MessageInteractionAction = "editReply"
    ): Promise<Message> {
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setEmoji("<:trash:851270257501929472>")
                .setStyle("DANGER")
        );
        if ((options as any).deleteButton) {
            row.components[0].setCustomId(
                Utils.encodeDecodeBase64String(
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    `${(options as any).deleteButton.reference}_deleteButton`
                )
            );
            if ((options as InteractionReplyOptions).components) {
                (
                    options as InteractionReplyOptions
                ).components![0].components.unshift(row.components[0]);
            } else {
                (options as InteractionReplyOptions).components = [row];
            }
        }
        if (this.isInteraction()) {
            (options as InteractionReplyOptions).fetchReply = true;
            const msg = (await (this.context as CommandInteraction)[type](
                options as any
            )) as Message;
            const channel = this.context.channel;
            const res = await channel!.messages.fetch(msg.id).catch(() => null);
            return res ?? msg;
        }
        if ((options as InteractionReplyOptions).ephemeral) {
            throw new Error(
                "Cannot send ephemeral message in a non-interaction context"
            );
        }
        return this.context.channel!.send(options as any);
    }

    public async react(emojis: string[] | string): Promise<void> {
        if (Array.isArray(emojis)) {
            for (const emoji of emojis) {
                await (this.context as Message).react(emoji);
            }
        } else {
            await (this.context as Message).react(emojis);
        }
    }

    public get attachments(): Collection<string, MessageAttachment> | null {
        return this.context instanceof Message
            ? this.context.attachments
            : null;
    }

    public get deferred(): boolean {
        return this.context instanceof Interaction
            ? (this.context as CommandInteraction).deferred
            : false;
    }

    public get options(): CommandInteractionOptionResolver | null {
        return this.context instanceof Interaction
            ? ((this.context as CommandInteraction)
                  .options as CommandInteractionOptionResolver)
            : null;
    }

    public get author(): User {
        return this.context instanceof Interaction
            ? this.context.user
            : this.context.author;
    }

    public get member(): GuildMember | null {
        return this.guild!.members.resolve(this.author.id);
    }

    public get mentions(): MessageMentions | null {
        return this.context instanceof Message ? this.context.mentions : null;
    }

    public isInteraction(): boolean {
        return (
            this.isCommand() ||
            this.isContextMenu() ||
            this.isMessageComponent() ||
            this.isButton() ||
            this.isSelectMenu()
        );
    }

    public isCommand(): boolean {
        return (
            InteractionTypes[(this.context as Interaction).type] ===
                InteractionTypes.APPLICATION_COMMAND &&
            typeof (this.context as any).targetId === "undefined"
        );
    }

    public isContextMenu(): boolean {
        return (
            InteractionTypes[(this.context as Interaction).type] ===
                InteractionTypes.APPLICATION_COMMAND &&
            typeof (this.context as any).targetId !== "undefined"
        );
    }

    public isMessageComponent(): boolean {
        return (
            InteractionTypes[(this.context as Interaction).type] ===
            InteractionTypes.MESSAGE_COMPONENT
        );
    }

    public isButton(): boolean {
        return (
            InteractionTypes[(this.context as Interaction).type] ===
                InteractionTypes.MESSAGE_COMPONENT &&
            MessageComponentTypes[
                (this.context as ButtonInteraction).componentType
            ] === MessageComponentTypes.BUTTON
        );
    }

    public isSelectMenu(): boolean {
        return (
            InteractionTypes[(this.context as Interaction).type] ===
                InteractionTypes.MESSAGE_COMPONENT &&
            MessageComponentTypes[
                (this.context as SelectMenuInteraction).componentType
            ] === MessageComponentTypes.SELECT_MENU
        );
    }
}
