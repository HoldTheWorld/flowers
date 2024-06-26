const router = require('express').Router();
const db = require('../db/connection');


router.post('/add', async (req, res) => {
  console.log(req.body);
  let query = `
  INSERT INTO plants (USER_ID, PLANT_NAME, WATERING_FREQUENCY, LAST_WATERED, IS_FINE )
  VALUES (${req.body.user_id}, '${req.body.plant_name}', ${req.body.watering_frequency}, ${req.body.last_watered}, ${req.body.is_fine})
`

  try {
    await db.query(query);
    res.status(200).json();
  } catch (err) {
    console.log(err);
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

router.get('/getplant', async (req, res) => {
  try {
    const { id, name } = req.query;
    let query, result;

    if (id) {
      query = `
        SELECT plant_name
        FROM plants
        WHERE id = ${id}
      `;
      result = await db.query(query);
    } else if (name) {
      query = `
        SELECT id
        FROM plants
        WHERE PLANT_NAME = '${name}'
      `;
      result = await db.query(query);
    } else {
      return res.status(400).json({ error: 'Необходимо передать параметр id или name' });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: 'Растение не найдено' });
    }
    res.status(200).json(result[0]);
  } catch (err) {
    console.error('Internal server error: ' + err);
    res.status(500).json({ error: 'Internal server error' });
  }
})

router.put('/water', async (req, res) => {
  try {
    const {plantid, time} = req.query
    // const plantId = req.query.plantid;
    // const time = req.query.time;

    let query = `
      UPDATE plants p SET 
      last_watered = ${time},
      is_fine = true 
      WHERE p.id = ${plantid}
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
    const {userid, time}= req.query
    let query = `
      UPDATE plants p SET 
      last_watered = ${time},
      is_fine = true
      where user_id = ${userid}
    `
    await db.query(query);
    return res.status(200).json();
  } catch(err) {
    console.log(err);
    return res.status(502).json();
  }
})

router.put('/updfreq', async (req, res) => {
  try {
    const {plantid, newfreq } = req.query
    let query = `
      UPDATE plants p SET 
      watering_frequency = ${newfreq}
      WHERE p.id = ${plantid}
    `
    await db.query(query);
    res.status(200).json();
  } catch(err) {
    console.log(err);
    res.status(502).json();
  }
})


router.put('/updstatus', async (req, res) => {
  try {
    const {plantid } = req.query
    let query = `
      UPDATE plants p 
      SET p.is_fine = CASE 
        WHEN p.is_fine = true THEN false
        ELSE true
        END
      WHERE p.id = ${plantid}
    `
  await db.query(query);
  res.status(200).json();
  } catch (err) {
    console.log(err);
    res.status(502).json();
  }
})

router.delete('/delete', async (req, res) => {
  try {
    const plantId = req.query.plantid
    let query =  `
    DELETE FROM plants 
    WHERE id = ${plantId}
    `
    await db.query(query)
    res.status(200).json();
  } catch (err) {
    console.log(err);
    res.status(502).json();
  }
})


module.exports = router
