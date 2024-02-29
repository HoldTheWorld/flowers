const db = require('./connection');

async function dropper () {
  await db.query(`
  DROP TABLE IF EXISTS schedules;
  DROP TABLE IF EXISTS plants;
  DROP TABLE IF EXISTS users;
  `)
}
dropper();
