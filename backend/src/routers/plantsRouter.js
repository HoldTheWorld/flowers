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
    let query = `
      SELECT *
      FROM plants
      WHERE USER_ID = ${userid} 
    `;
    // if (exceptions) {
    //   const exceptionList = exceptions.split(',').map(exception => `'${exception.trim()}'`).join(', ');
    //   query += ` AND ID NOT IN (${exceptionList})`;
    // }
    const result = await db.query(query);
    // const result = await db.query(`
    //   SELECT *
    //   FROM plants
    //   WHERE USER_ID = '${userid}'
    // `);
  
    res.status(200).json(result[0]);
  } catch (err) {
    console.error('Internal server error: ' + err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/water', async (req, res) => {
  try {
    const plantId = req.query.plantid;
    const time = req.query.time;

    let query = `
      UPDATE plants p SET 
      last_watered = ${time},
      is_fine = true 
      WHERE p.id = ${plantId}
    `

    await db.query(query);
    res.status(200).json();
  } catch(err) {
    console.log(err);
    res.status(502).json();
  }
})

router.put('/waterall', async (req, res) => {
  try {
    const userId = req.query.userid;
    const time = req.query.time;

    let query = `
      UPDATE plants p SET 
      last_watered = ${time},
      is_fine = true 
      WHERE p.user_id = ${userId}
    `
    await db.query(query);
    res.status(200).json();
  } catch(err) {
    console.log(err);
    res.status(502).json();
  }
})

module.exports = router
