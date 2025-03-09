import Database from 'better-sqlite3';

const db = new Database('database/game.db', { verbose: console.log });

// Create Player Profiles table
db.exec(`
  CREATE TABLE IF NOT EXISTS player_profiles (
    player_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT,
    total_games_played INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0
  )
`);

// Create Game States table
db.exec(`
  CREATE TABLE IF NOT EXISTS game_states (
    game_id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    player1_id TEXT NOT NULL,
    player2_id TEXT,
    state_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES player_profiles(player_id),
    FOREIGN KEY (player2_id) REFERENCES player_profiles(player_id)
  )
`);

// Create Leaderboard table
db.exec(`
  CREATE TABLE IF NOT EXISTS leaderboard (
    player_id TEXT PRIMARY KEY,
    score INTEGER DEFAULT 0,
    rank INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES player_profiles(player_id)
  )
`);

console.log('Database initialized successfully');
db.close();