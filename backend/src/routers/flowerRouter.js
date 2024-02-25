const router = require('express').Router();
const db = require('../db/connection');


router.post('/add', async (req, res) => {
  console.log(req.body);
  // try {
  //   await db.query(`
  //     INSERT INTO flowers (USER_ID, FLOWER_NAME, WATERING_FREQUENCY)
  //     VALUES (?, ?, ?)
  //   `, [req.body.user_id, req.body.flower_name, req.body.watering_frequency]);
  //   res.status(200).json();
  // } catch (err) {
  //   console.error('Internal server error: ' + err.name);
  //   res.status(502).json();
  // }
});


module.exports = router
