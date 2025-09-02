#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
// const { logInfo, logWarn, logError } = require('../src/utils/logger');

const logDir = path.join(__dirname, '../logs');
const today = new Date().toISOString().split('T')[0];

console.log('🌱 Мониторинг логов Flowers API');
console.log('================================');
console.log(`📅 Дата: ${today}`);
console.log(`📁 Директория логов: ${logDir}`);
console.log('');

if (!fs.existsSync(logDir)) {
  console.error('❌ Директория логов не найдена. Запустите приложение для создания логов.');
  process.exit(1);
}

function monitorFile(filename, label) {
  const filepath = path.join(logDir, filename);
  
  if (!fs.existsSync(filepath)) {
    console.warn(`⚠️ Файл ${filename} не найден`);
    return;
  }

  console.log(`📊 Мониторинг ${label}: ${filename}`);
  
  const tail = require('tail').Tail;
  const logTail = new tail(filepath);
  
  logTail.on('line', (data) => {
    try {
      const log = JSON.parse(data);
      const timestamp = log.timestamp || new Date().toISOString();
      const level = log.level || 'INFO';
      const message = log.message || 'Нет сообщения';
      
      let color = '\x1b[37m';
      switch (level.toUpperCase()) {
        case 'ERROR':
          color = '\x1b[31m';
          break;
        case 'WARN':
          color = '\x1b[33m';
          break;
        case 'INFO':
          color = '\x1b[36m';
          break;
        case 'DEBUG':
          color = '\x1b[32m';
          break;
      }
      
      console.log(`${color}[${timestamp}] [${level}] ${message}\x1b[0m`);
      
      if (level.toUpperCase() === 'ERROR' && log.error) {
        console.log(`   🔍 Детали: ${log.error.message}`);
        if (log.context && log.context.endpoint) {
          console.log(`   📍 Эндпоинт: ${log.context.endpoint}`);
        }
      }
      
    } catch (e) {
      console.log(`📝 ${data}`);
    }
  });
  
  logTail.on('error', (error) => {
    console.error(`❌ Ошибка мониторинга ${filename}:`, error.message);
  });
}

function showStats() {
  console.log('\n📈 Статистика логов:');
  console.log('====================');
  
  const files = fs.readdirSync(logDir);
  const todayFiles = files.filter(file => file.includes(today));
  
  todayFiles.forEach(file => {
    const filepath = path.join(logDir, file);
    const stats = fs.statSync(filepath);
    const size = (stats.size / 1024).toFixed(2);
    
    console.log(`📄 ${file}: ${size} KB`);
  });
  
  console.log('');
}

function searchLogs(query) {
  console.log(`🔍 Поиск по запросу: "${query}"`);
  console.log('====================');
  
  const files = fs.readdirSync(logDir);
  const todayFiles = files.filter(file => file.includes(today));
  
  todayFiles.forEach(file => {
    const filepath = path.join(logDir, file);
    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(query.toLowerCase())) {
        try {
          const log = JSON.parse(line);
          const timestamp = log.timestamp || 'N/A';
          const level = log.level || 'INFO';
          const message = log.message || 'N/A';
          
                  console.log(`📄 ${file}:${index + 1} [${timestamp}] [${level}] ${message}`);
      } catch (e) {
        console.log(`📄 ${file}:${index + 1} ${line}`);
      }
      }
    });
  });
  
  console.log('');
}

function showMenu() {
  console.log('🎯 Доступные команды:');
  console.log('====================');
  console.log('1. Мониторинг всех логов в реальном времени');
  console.log('2. Мониторинг только ошибок');
  console.log('3. Показать статистику');
  console.log('4. Поиск по логам');
  console.log('5. Выход');
  console.log('');
}

function handleInput(input) {
  const choice = input.trim();
  
  switch (choice) {
    case '1':
      console.log('\n🔄 Запуск мониторинга всех логов...');
      monitorFile(`combined-${today}.log`, 'всех логов');
      break;
      
    case '2':
      console.log('\n🚨 Запуск мониторинга ошибок...');
      monitorFile(`error-${today}.log`, 'ошибок');
      break;
      
    case '3':
      showStats();
      showMenu();
      break;
      
    case '4':
      rl.question('🔍 Введите поисковый запрос: ', (query) => {
        searchLogs(query);
        showMenu();
      });
      return;
      
    case '5':
      console.log('👋 До свидания!');
      process.exit(0);
      break;
      
    default:
      console.warn('❌ Неверный выбор. Попробуйте снова.');
      showMenu();
      break;
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

showMenu();

rl.on('line', (input) => {
  handleInput(input);
});


rl.on('SIGINT', () => {
  console.log('\n👋 До свидания!');
  process.exit(0);
});

console.log('💡 Введите номер команды для продолжения...');
