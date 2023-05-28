
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const PORT = process.env.DB_PORT ?? 3006;
const userRouter = require('./src/routers/userRouter');
const flowerRouter = require('./src/routers/flowerRouter');
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: true,
  credentials: true,
}));

app.get('/', (req, res) => {
  res.send('hello ! ')
})

http://numbersapi.com/#42

app.use('/flower', flowerRouter);
app.use('/user', userRouter);
// app.use('/timings', timingRouter)

app.listen(PORT, () => {
  console.log(`Server up on port ${PORT}`);
});
