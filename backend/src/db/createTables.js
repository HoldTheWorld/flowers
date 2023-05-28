const db = require('./connection');

async function createTables() {
  try {
    let result = await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(30) NOT NULL UNIQUE
      );
      CREATE TABLE IF NOT EXISTS flowers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
        flower_name VARCHAR(30) NOT NULL,
        watering_frequency INTEGER
      );
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        flower_id INTEGER REFERENCES flowers (id) ON DELETE CASCADE,
        remind_time INTEGER,
        is_mutted BOOLEAN
      );
    `)
    console.log(result);
  } catch (err) {
    console.log(err);
  }
}

createTables()
