
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const PORT = process.env.DB_PORT ?? 3006;
const userRouter = require('./src/routers/userRouter');
const plantsRouter = require('./src/routers/plantsRouter');
const app = express()
const http = require('http');
const https = require('https');

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

app.use('/plant', plantsRouter);
app.use('/user', userRouter);
// app.use('/timings', timingRouter)

app.listen(PORT, () => {
  console.log(`Server up on port ${PORT}`);
});


process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down...');
  const maxRetries = 5;
  let attempt = 0;
  let success = false;

  // Determine protocol based on the URL
  const protocol = process.env.DB_PORT === '443' ? https : http;

  const requestOptions = {
      method: 'PUT',
      headers: {
          'Content-Type': 'application/json',
      },
  };

  const performRequest = () => {
      return new Promise((resolve, reject) => {
          const req = protocol.request(`http://${process.env.DB_HOST}:${process.env.DB_PORT}/user/updint?userid=${0}&interval=${0}`, requestOptions, (res) => {
              let data = '';

              res.on('data', chunk => {
                  data += chunk;
              });

              res.on('end', () => {
                  if (res.statusCode >= 200 && res.statusCode < 300) {
                      resolve(data);
                  } else {
                      reject(new Error(`HTTP error! Status: ${res.statusCode}`));
                  }
              });
          });

          req.on('error', (err) => {
              reject(err);
          });

          req.end();
      });
  };

  while (attempt < maxRetries && !success) {
      try {
          await performRequest();
          success = true;
          console.log('Intervals cleared successfully');
      } catch (err) {
          console.log(`Attempt ${attempt + 1} failed: ${err}`);
          attempt++;
          if (attempt < maxRetries) {
              console.log('Retrying...');
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
          } else {
              console.log('Max retries reached. Unable to complete the request.');
          }
      }
  }

  process.exit(success ? 0 : 1); // Exit with status code 0 if successful, otherwise 1
});
