/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-condition */
import { MessageInteractionAction } from "#zuikaku/types/core";
import { Utils } from "#zuikaku/Utils";
import {
    ButtonInteraction,
    Collection,
    CommandInteraction,
    CommandInteractionOptionResolver,
    ContextMenuInteraction,
    Guild,
    GuildMember,
    Interaction,
    InteractionReplyOptions,
    InteractionType,
    Message,
    MessageActionRow,
    MessageAttachment,
    MessageButton,
    MessageMentions,
    MessageOptions,
    MessagePayload,
    ModalSubmitFieldsResolver,
    ModalSubmitInteraction,
    SelectMenuInteraction,
    TextBasedChannel,
    User
} from "discord.js";
import { ZuikakuClient } from "./ZuikakuClient";

export class CommandContext {
    public activateCollector = false;
    public constructor(
        public client: ZuikakuClient,
        public readonly context:
            | CommandInteraction
            | ContextMenuInteraction
            | Interaction
            | Message
            | ModalSubmitInteraction
            | SelectMenuInteraction,
        public args: string[] = []
    ) {}

    public get id(): string {
        return this.context.id;
    }

    public get channel(): TextBasedChannel | null {
        return this.context.channel;
    }

    public get author(): User {
        return this.context instanceof Interaction
            ? this.context.user
            : this.context.author;
    }

    public get guild(): Guild | null {
        return this.context.guild;
    }

    public get createdAt(): Date {
        return this.context.createdAt;
    }

    public get member(): GuildMember {
        return this.context.member as GuildMember;
    }

    public get guildId(): string | null {
        return this.context.guildId;
    }

    public get channelId(): string | null {
        return this.context.channelId;
    }

    public get type(): InteractionType {
        return this.context.type as InteractionType;
    }

    public get attachments(): Collection<string, MessageAttachment> | null {
        return this.context instanceof Message
            ? this.context.attachments
            : null;
    }

    public get deferred(): boolean {
        return this.context instanceof CommandInteraction
            ? this.context.deferred
            : false;
    }

    public get options(): CommandInteractionOptionResolver | null {
        return this.context instanceof CommandInteraction
            ? (this.context.options as CommandInteractionOptionResolver)
            : null;
    }

    public get fields(): ModalSubmitFieldsResolver | null {
        return this.context instanceof ModalSubmitInteraction
            ? this.context.fields
            : null;
    }

    public get mentions(): MessageMentions | null {
        return this.context instanceof Message ? this.context.mentions : null;
    }

    public isInteraction(): boolean {
        return this.context instanceof Interaction;
    }

    public isCommand(): boolean {
        return this.context instanceof CommandInteraction;
    }

    public isContextMenu(): boolean {
        return this.context instanceof ContextMenuInteraction;
    }

    public isButton(): boolean {
        return this.context instanceof ButtonInteraction;
    }

    public isSelectMenu(): boolean {
        return this.context instanceof SelectMenuInteraction;
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
            const msg = (await (
                this.context as CommandInteraction | ContextMenuInteraction
            )[type](options as any)) as Message;
            const res = await this.channel!.messages.fetch(msg.id).catch(
                () => null
            );
            return res ?? msg;
        }
        if ((options as InteractionReplyOptions).ephemeral) {
            throw new Error(
                "Cannot send ephemeral message in a non-interaction context"
            );
        }
        return this.channel!.send(options as any);
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
}
