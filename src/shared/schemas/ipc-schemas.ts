import { z } from 'zod';

/**
 * The complete, allowlisted IPC surface (section 14). Every channel name
 * used anywhere in main/preload/renderer must appear here -- no dynamic
 * channel names are permitted.
 */
export const IPC_CHANNELS = {
  GAME_STATE_CHANGED: 'advisor:game-state-changed',
  GET_SETTINGS: 'advisor:get-settings',
  UPDATE_SETTINGS: 'advisor:update-settings',
  SET_CLICK_THROUGH: 'advisor:set-click-through',
  START_MOCK_MATCH: 'advisor:start-mock-match',
  STOP_MOCK_MATCH: 'advisor:stop-mock-match',
} as const;

export const OverlayShortcutsSchema = z.object({
  toggleOverlay: z.string().min(1),
  toggleClickThrough: z.string().min(1),
});

export const AppSettingsSchema = z.object({
  overlayPosition: z.object({ x: z.number(), y: z.number() }),
  overlaySize: z.object({ width: z.number(), height: z.number() }),
  shortcuts: OverlayShortcutsSchema,
  strategyPreference: z.enum(['BALANCED', 'SAFER', 'AGGRESSIVE']),
  onboardingCompleted: z.boolean(),
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

export const SettingsPatchSchema = AppSettingsSchema.partial();
export type AppSettingsPatch = z.infer<typeof SettingsPatchSchema>;

export const SetClickThroughSchema = z.object({ enabled: z.boolean() });

export const StartMockMatchSchema = z.object({ scenarioId: z.string().min(1) });

const ReasonCodeSchema = z.enum([
  'FITS_CHAMPION_KIT',
  'MATCHES_DAMAGE_PROFILE',
  'COUNTERS_ENEMY_PHYSICAL_DAMAGE',
  'COUNTERS_ENEMY_MAGIC_DAMAGE',
  'COUNTERS_ENEMY_HEALING',
  'COUNTERS_ENEMY_SHIELDING',
  'COUNTERS_ENEMY_HARD_CC',
  'COUNTERS_ENEMY_BURST',
  'COUNTERS_ENEMY_TANKS',
  'FULLY_AFFORDABLE_NOW',
  'AFFORDABLE_COMPONENT_NOW',
  'COMPLEMENTS_CURRENT_ITEMS',
  'STRONG_IN_CURRENT_PHASE',
  'SMOOTH_BUILD_PATH',
  'FILLS_TEAM_UTILITY_GAP',
]);

const TradeoffCodeSchema = z.enum([
  'DELAYS_DAMAGE_SPIKE',
  'DELAYS_DEFENSIVE_SPIKE',
  'EXPENSIVE_RIGHT_NOW',
  'OVERLAPS_EXISTING_STATS',
  'NARROW_BUILD_PATH',
  'LOWER_TEAM_UTILITY',
  'REACTIVE_ONLY_ITEM',
]);

const RecommendationLabelSchema = z.enum([
  'best_overall',
  'safer_defense',
  'earlier_spike',
  'higher_damage',
  'team_utility',
]);

const ItemRecommendationSchema = z.object({
  itemId: z.number(),
  score: z.number(),
  label: RecommendationLabelSchema,
  reasons: z.array(ReasonCodeSchema).min(1),
  tradeoffs: z.array(TradeoffCodeSchema).min(1),
  goldNeeded: z.number(),
  componentPath: z.array(z.number()),
  factorScores: z.record(z.string(), z.number()),
});

export const RecommendationSetSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('ok'),
    snapshotHash: z.string(),
    generatedAt: z.number(),
    primary: ItemRecommendationSchema,
    alternatives: z.tuple([ItemRecommendationSchema, ItemRecommendationSchema]),
  }),
  z.object({
    status: z.literal('unsupported_champion'),
    snapshotHash: z.string(),
    generatedAt: z.number(),
    championName: z.string(),
  }),
  z.object({
    status: z.literal('no_valid_candidates'),
    snapshotHash: z.string(),
    generatedAt: z.number(),
  }),
]);

export const PublicGameStateSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('waiting') }),
  z.object({
    status: z.literal('active'),
    championName: z.string(),
    currentGold: z.number(),
    gameTimeSeconds: z.number(),
    recommendations: RecommendationSetSchema,
    dataVersion: z.string().optional(),
  }),
  z.object({ status: z.literal('ended') }),
]);
export type PublicGameState = z.infer<typeof PublicGameStateSchema>;

export const DEFAULT_SETTINGS: AppSettings = {
  overlayPosition: { x: 80, y: 80 },
  overlaySize: { width: 380, height: 210 },
  shortcuts: {
    toggleOverlay: 'CommandOrControl+Shift+Space',
    toggleClickThrough: 'CommandOrControl+Shift+O',
  },
  strategyPreference: 'BALANCED',
  onboardingCompleted: false,
};
