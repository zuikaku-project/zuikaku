import { ShoukakuPlayer } from "shoukaku";
import { ShoukakuHandler } from "../ShoukakuHandler";

export class Filter extends Set {
    public player!: ShoukakuPlayer;
    public constructor(player: ShoukakuPlayer) {
        super();
        Object.defineProperty(this, "player", { value: player });
    }

    public setNightcore(active = true): ShoukakuPlayer {
        if (active) {
            this.updateSet(this.has("daycore") ? "daycore" : undefined, "nightcore");
            this.player.setTimescale({ pitch: 1.3, speed: 1.2, rate: 1 });
        } else {
            if (this.has("nightcore")) this.player.setTimescale({});
            this.updateSet("nightcore");
        }
        return this.updatePlayerFilterWithSeeking();
    }

    public setDaycore(active = true): ShoukakuPlayer {
        if (active) {
            this.updateSet(this.has("nightcore") ? "nightcore" : undefined, "daycore");
            this.player.setTimescale({ speed: 1, rate: 1, pitch: 0.9 });
        } else {
            if (this.has("daycore")) this.player.setTimescale({});
            this.updateSet("daycore");
        }
        return this.updatePlayerFilterWithSeeking();
    }

    public setVaporwave(active = true): ShoukakuPlayer {
        if (active) {
            this.updateSet(["pop", "soft", "treblebass", "earrape"], "vaporwave");
            this.player.setEqualizer([{ band: 1, gain: 0.3 }, { band: 0, gain: 0.3 }]).setTimescale({ pitch: 0.9 }).setTremolo({ depth: 0.3, frequency: 14 });
        } else {
            if (this.has("vaporwave")) this.player.setEqualizer([]).setTimescale({}).setTremolo({});
            this.updateSet("vaporwave");
        }
        return this.updatePlayerFilterWithSeeking();
    }

    public setPop(active = true): ShoukakuPlayer {
        if (active) {
            this.updateSet(["vaporwave", "soft", "treblebass", "earrape"], "pop");
            this.player.setEqualizer([
                { band: 0, gain: 0.65 },
                { band: 1, gain: 0.45 },
                { band: 2, gain: -0.45 },
                { band: 3, gain: -0.65 },
                { band: 4, gain: -0.35 },
                { band: 5, gain: 0.45 },
                { band: 6, gain: 0.55 },
                { band: 7, gain: 0.6 },
                { band: 8, gain: 0.6 },
                { band: 9, gain: 0.6 },
                { band: 10, gain: 0 },
                { band: 11, gain: 0 },
                { band: 12, gain: 0 },
                { band: 13, gain: 0 }
            ]);
        } else {
            if (this.has("pop")) this.player.setEqualizer([]);
            this.updateSet("pop");
        }
        return this.updatePlayerFilterWithSeeking();
    }

    public setSoft(active = true): ShoukakuPlayer {
        if (active) {
            this.updateSet(["vaporwave", "pop", "treblebass", "earrape"], "soft");
            this.player.setEqualizer([
                { band: 0, gain: 0 },
                { band: 1, gain: 0 },
                { band: 2, gain: 0 },
                { band: 3, gain: 0 },
                { band: 4, gain: 0 },
                { band: 5, gain: 0 },
                { band: 6, gain: 0 },
                { band: 7, gain: 0 },
                { band: 8, gain: -0.25 },
                { band: 9, gain: -0.25 },
                { band: 10, gain: -0.25 },
                { band: 11, gain: -0.25 },
                { band: 12, gain: -0.25 },
                { band: 13, gain: -0.25 }
            ]);
        } else {
            if (this.has("soft")) this.player.setEqualizer([]);
            this.updateSet("soft");
        }
        return this.updatePlayerFilterWithSeeking();
    }

    public setTreblebass(active = true): ShoukakuPlayer {
        if (active) {
            this.updateSet(["vaporwave", "pop", "soft", "earrape"], "treblebass");
            this.player.setEqualizer([
                { band: 0, gain: 0.6 },
                { band: 1, gain: 0.67 },
                { band: 2, gain: 0.67 },
                { band: 3, gain: 0 },
                { band: 4, gain: -0.5 },
                { band: 5, gain: 0.15 },
                { band: 6, gain: -0.45 },
                { band: 7, gain: 0.23 },
                { band: 8, gain: 0.35 },
                { band: 9, gain: 0.45 },
                { band: 10, gain: 0.55 },
                { band: 11, gain: 0.6 },
                { band: 12, gain: 0.55 },
                { band: 13, gain: 0 }
            ]);
        } else {
            if (this.has("treblebass")) this.player.setEqualizer([]);
            this.updateSet("treblebass");
        }
        return this.updatePlayerFilterWithSeeking();
    }

    public setEightD(active = true): ShoukakuPlayer {
        if (active) {
            this.updateSet(undefined, "eightd");
            this.player.setRotation({ rotationHz: 0.2 });
        } else {
            if (this.has("eightd")) this.player.setRotation({});
            this.updateSet("eigthd");
        }
        return this.updatePlayerFilterWithSeeking();
    }

    public setKaraoke(active = true): ShoukakuPlayer {
        if (active) {
            this.updateSet(undefined, "karaoke");
            this.player.setKaraoke({ level: 1, monoLevel: 1, filterBand: 220, filterWidth: 100 });
        } else {
            if (this.has("karaoke")) this.player.setKaraoke({});
            this.updateSet("karaoke");
        }
        return this.updatePlayerFilterWithSeeking();
    }

    public setVibrato(active = true): ShoukakuPlayer {
        if (active) {
            this.updateSet(undefined, "vibrato");
            this.player.setVibrato({ depth: 1, frequency: 14 });
        } else {
            if (this.has("vibrato")) this.player.setVibrato({});
            this.updateSet("vibrato");
        }
        return this.updatePlayerFilterWithSeeking();
    }

    public setTremolo(active = true): ShoukakuPlayer {
        if (active) {
            this.updateSet(undefined, "tremolo");
            this.player.setTremolo({ frequency: 2, depth: 0.5 });
        } else {
            if (this.has("tremolo")) this.player.setTremolo({});
            this.updateSet("tremolo");
        }
        return this.updatePlayerFilterWithSeeking();
    }

    public setEarrape(active = true): ShoukakuPlayer {
        if (active) {
            this.updateSet(["vaporwave", "pop", "soft", "treblebass"], "earrape");
            this.player.setEqualizer([...Array(6).fill(0).map((_, i) => ({ band: i, gain: 0.5 }))]);
        } else {
            if (this.has("earrape")) this.player.setEqualizer([]);
            this.updateSet("earrape");
        }
        return this.updatePlayerFilterWithSeeking();
    }

    public setDistortion(active = true): ShoukakuPlayer {
        if (active) {
            this.updateSet(undefined, "distortion");
            this.player.setDistortion({ sinOffset: 0, sinScale: 1, cosOffset: 0, cosScale: 1, tanOffset: 0, tanScale: 1, offset: 0, scale: 1 });
        } else {
            if (this.has("distortion")) this.player.setDistortion({});
            this.updateSet("distortion");
        }
        return this.updatePlayerFilterWithSeeking();
    }

    public clearFilters(): ShoukakuPlayer {
        this.clear();
        this.player.clearFilters();
        return this.updatePlayerFilterWithSeeking();
    }

    public updateSet(deletes: string[] | string | undefined, setup?: string[] | string): this {
        if (deletes) {
            if (Array.isArray(deletes)) {
                deletes.forEach(x => this.delete(x));
            } else {
                this.delete(deletes);
            }
        }
        if (setup) {
            if (Array.isArray(setup)) {
                setup.forEach(x => this.add(x));
            } else {
                this.add(setup);
            }
        }
        return this;
    }

    private updatePlayerFilterWithSeeking(): ShoukakuPlayer {
        if (
            !(this.player.connection.node.shoukaku as ShoukakuHandler).dispatcher
                .get(this.player.connection.guildId)?.queue.current?.info.uri?.startsWith("https://open.spotify.com")
        ) {
            return this.player.seekTo(this.player.position);
        }
        return this.player;
    }
}
