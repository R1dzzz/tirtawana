export const GAME_CONFIG = {
  TILE_SIZE: 16,
  CHUNK_SIZE: 64,
  DAY_LENGTH_MINUTES: 10,      // real minutes per in-game day
  DAY_START_HOUR: 6,
  DAY_END_HOUR: 26,            // 2 AM next day (exhaustion threshold)
  PLAYER_SPEED: 120,
  PLAYER_SPRINT_MULT: 1.6,
  INTERACT_RADIUS: 32,
  DB_NAME: 'tirtawana_db',
  DB_VERSION: 1
} as const;
