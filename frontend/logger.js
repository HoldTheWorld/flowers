// Простой логгер для frontend
// В production можно заменить на полноценный логгер

const logError = (error, context = {}) => {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message: error.message || error,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    context,
    service: 'flowers-bot',
    environment: process.env.NODE_ENV || 'development'
  };
  
  console.error(JSON.stringify(logData, null, 2));
};

const logInfo = (message, meta = {}) => {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message,
    ...meta,
    service: 'flowers-bot',
    environment: process.env.NODE_ENV || 'development'
  };
  
  console.log(JSON.stringify(logData, null, 2));
};

const logWarn = (message, meta = {}) => {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'WARN',
    message,
    ...meta,
    service: 'flowers-bot',
    environment: process.env.NODE_ENV || 'development'
  };
  
  console.warn(JSON.stringify(logData, null, 2));
};

const logDebug = (message, meta = {}) => {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'DEBUG',
    message,
    ...meta,
    service: 'flowers-bot',
    environment: process.env.NODE_ENV || 'development'
  };
  
  console.log(JSON.stringify(logData, null, 2));
};

export {
  logError,
  logInfo,
  logWarn,
  logDebug
};
