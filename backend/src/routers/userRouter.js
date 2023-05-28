const router = require('express').Router();
const db = require('../db/connection.js');


router.post('/add', async (req, res) => {
  console.log(req.body);
  try {
    await db.query(`
    INSERT INTO users (NAME)
    VALUES ('` + req.body.user_name + `')
    `)
    console.log('user added');
     res.status(200)
  } catch(err) {
    console.log('user NOT added');
    if (err.name == 'SequelizeUniqueConstraintError') {
      res.status(200).json()
    } else {
      res.status(500).json()
    }
  }
  return res
});

module.exports = router
