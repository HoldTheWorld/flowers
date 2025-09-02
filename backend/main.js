
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { logger, requestLogger, errorLogger, logInfo } = require('./src/utils/logger');

// Импортируем модели для инициализации базы данных
require('./src/db/models');

const PORT = process.env.PORT || 3006;
const userRouter = require('./src/routers/userRouter');
const plantsRouter = require('./src/routers/plantsRouter');

const app = express();

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Слишком много запросов с этого IP, попробуйте позже.'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(requestLogger);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Flowers API работает!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.use('/plant', plantsRouter);
app.use('/user', userRouter);

app.use('*', (req, res) => {
  logger.warn('Маршрут не найден', { 
    method: req.method, 
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress
  });
  res.status(404).json({ error: 'Маршрут не найден' });
});

app.use(errorLogger);

app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS ошибка' });
  }
  
  res.status(500).json({ 
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Что-то пошло не так'
  });
});

app.listen(PORT, () => {
  logInfo('Сервер запущен', { 
    port: PORT, 
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});
