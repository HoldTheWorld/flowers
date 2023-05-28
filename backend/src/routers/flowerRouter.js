const router = require('express').Router();
const db = require('../db/connection');


router.get

router.post('/register', async (req, res) => {
  try {
    const newUser = await db.query()
  } catch(err) {
    console.log(err);
    res.status(500)
  }
});

module.exports = router
