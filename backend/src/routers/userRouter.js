const router = require('express').Router();
const db = require('../db/connection.js');


router.post('/add', async (req, res) => {
  console.log(req.body);
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

module.exports = router
