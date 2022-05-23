/* eslint-disable @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access */
import { Node, Player, VoiceChannelOptions } from "shoukaku";
import { OPCodes } from "shoukaku/dist/src/Constants";

export class ShoukakuPlayer extends Player {
    public constructor(node: Node, options: VoiceChannelOptions) {
        super(node, options);
    }

    public onLavalinkMessage(json: any): void {
        if (json.op === OPCodes.PLAYER_UPDATE) {
            this.position = json.state.position;
            this.node.manager.emit("playerUpdate", this, json);
        } else if (json.op === OPCodes.EVENT) {
            this.extendOnPlayerEvent(json);
        } else {
            this.node.emit(
                "debug",
                this.node.name,
                `[Player] -> [Node] : Unknown Message OP ${json.op} | Guild: ${this.connection.guildId}`
            );
        }
    }

    public extendOnPlayerEvent(json: any): void {
        switch (json.type) {
            case "TrackStartEvent":
                this.position = 0;
                this.node.manager.emit("playerTrackStart", this, json);
                break;
            case "TrackEndEvent":
            case "TrackStuckEvent":
                this.node.manager.emit("playerTrackEnd", this, json);
                break;
            case "TrackExceptionEvent":
                this.node.manager.emit("playerException", this, json);
                break;
            case "WebSocketClosedEvent":
                if (!this.connection.reconnecting) {
                    if (this.connection.moved) {
                        this.connection.moved = false;
                    } else {
                        this.node.manager.emit("playerClosed", this, json);
                    }
                }
                break;
            default:
                this.node.manager.emit(
                    "debug",
                    this.node.name,
                    `[Player] -> [Node] : Unknown Player Event Type ${json.type} | Guild: ${this.connection.guildId}`
                );
        }
    }
}
