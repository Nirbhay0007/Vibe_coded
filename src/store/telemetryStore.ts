import { create } from 'zustand';

/**
 * Telemetry entity as received from the WebSocket payload.
 * Coordinates are in WGS84 Geodetic Degrees (system.md constraint).
 */
export interface TelemetryEntity {
    entity_id: string;
    domain: 'aviation' | 'maritime' | 'osint_alert';
    latitude: number;
    longitude: number;
    altitude: number;
    velocity: number;
    heading: number;
    dark_ship?: boolean;
    jitter?: number; // Phase 3c: Velocity jitter for jamming heuristic
    nic?: number;    // Phase 3c: Navigation Integrity Category
}

interface TelemetryState {
    /** Dictionary of all active entities keyed by entity_id */
    entities: Record<string, TelemetryEntity>;
    /** Currently selected (clicked) entity ID */
    selectedEntityId: string | null;
    /** Whether the system is in live‑streaming mode */
    isLive: boolean;

    // Phase 5: Jamming Layer Controls
    showJammingLayer: boolean;
    jammingOpacity: number;
    jammingTimeWindow: number; // minutes

    /** Merge incoming batch into the store */
    updateEntities: (incoming: TelemetryEntity[]) => void;
    /** Set the clicked target */
    selectEntity: (id: string | null) => void;
    /** Toggle live / playback mode */
    setLive: (live: boolean) => void;

    /** Phase 5 Actions */
    toggleJammingLayer: () => void;
    setJammingOpacity: (opacity: number) => void;
    setJammingTimeWindow: (minutes: number) => void;
}

export const useTelemetryStore = create<TelemetryState>((set: any) => ({
    entities: {},
    selectedEntityId: null,
    isLive: true,
    showJammingLayer: true,
    jammingOpacity: 0.5,
    jammingTimeWindow: 60, // Default to 1 hour window

    updateEntities: (incoming: TelemetryEntity[]) =>
        set(() => {
            const next: Record<string, TelemetryEntity> = {};
            for (const entity of incoming) {
                next[entity.entity_id] = entity;
            }
            return { entities: next };
        }),

    selectEntity: (id: string | null) => set({ selectedEntityId: id }),
    setLive: (live: boolean) => set({ isLive: live }),

    toggleJammingLayer: () => set((state: TelemetryState) => ({ showJammingLayer: !state.showJammingLayer })),
    setJammingOpacity: (opacity: number) => set({ jammingOpacity: opacity }),
    setJammingTimeWindow: (minutes: number) => set({ jammingTimeWindow: minutes }),

}));
