-- Migration number: 0001 	 2024-11-19T00:22:01.283Z

CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  screen_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notes_screen_id ON notes (screen_id);
