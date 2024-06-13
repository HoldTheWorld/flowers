const db = require('./connection');

async function createTables() {
  try {
    let result = await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(30) NOT NULL UNIQUE,
        interval INTEGER
      );
      CREATE TABLE IF NOT EXISTS plants (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
        plant_name VARCHAR(30) NOT NULL,
        watering_frequency INTEGER,
        last_watered BIGINT,
        is_fine BOOLEAN
      );
    `)
    console.log('TABLES WERE CREATED');
  } catch (err) {
    console.log('ERROR WHILE CREATING TABLES');
    console.log(err);
  }
}

createTables()

      // CREATE TABLE IF NOT EXISTS schedules (
      //   id SERIAL PRIMARY KEY,
      //   flower_id INTEGER REFERENCES flowers (id) ON DELETE CASCADE,
      //   last_watered INTEGER,
      //   is_mutted BOOLEAN,
      //   is_fine BOOLEAN
      // );
