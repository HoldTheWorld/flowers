const router = require('express').Router();
const db = require('../db/connection.js');


router.post('/add', async (req, res) => {
  try {
    await db.query(`
    INSERT INTO users (NAME)
    VALUES ('` + req.body.user_name + `')
    `)
    res.status(200).json()
  } catch(err) {
    console.error('user NOT added: '+ err);

    if (err.name == 'SequelizeUniqueConstraintError') {
      return res.status(200).json()
    } else {
      console.error('Internal server error: ' + err.name);
      res.status(500).json()
    }
  }
});

router.get('/getuser', async (req, res) => {
  try {
    const username = req.query.username;
    if (!username) {
      return res.status(400).json({ error: 'Ошибка' });
    }
    const result = await db.query(`
      SELECT ID
      FROM users
      WHERE NAME = '${username}'
    `);

    if (result[0].length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const userId = result[0][0].id;

    res.status(200).json({ user_id: userId });
  } catch (err) {
    console.error('Internal server error: ' + err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/updint', async (req, res ) => {
  try {
    const interval = req.query.interval
    const user_id = req.query.userid

    let query = `
      UPDATE users 
      SET interval = ${interval}
    `
    if (user_id !== '0') {
      query += `WHERE ID = ${user_id}`
    }

    const result = await db.query(query);

    // if (result[0].length === 0) {
    //   return res.status(404).json({ error: 'Пользователь не найден' });
    // }
    // const userId = result[0][0].id;

    res.status(200).json()
  } catch (err) {
    console.error('Internal server error: ' + err);
    res.status(500).json({ error: 'Internal server error' });
  }
})




module.exports = router
