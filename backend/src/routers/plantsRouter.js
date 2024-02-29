const router = require('express').Router();
const db = require('../db/connection');


router.post('/add', async (req, res) => {
  console.log(req.body);
  try {
    await db.query(`
      INSERT INTO plants (USER_ID, PLANT_NAME, WATERING_FREQUENCY, LAST_WATERED, IS_FINE )
      VALUES (`+ req.body.user_id+ `, '
      `+ req.body.plant_name+ `', 
      `+ req.body.watering_frequency+ `, 
      `+ req.body.last_watered+`, 
      `+ req.body.is_fine+ `)
    `);
    res.status(200).json();
  } catch (err) {
    console.log(err);
    // console.error('Internal server error: ' + err.name);
    res.status(502).json();
  }
});

router.get('/getplants', async (req, res) => {
  try {
    const userid = req.query.userid;
    if (!userid) {
      return res.status(400).json({ error: 'Ошибка' });
    }
    const result = await db.query(`
      SELECT *
      FROM plants
      WHERE USER_ID = '${userid}'
    `);
  
    res.status(200).json(result[0]);
  } catch (err) {
    console.error('Internal server error: ' + err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router
