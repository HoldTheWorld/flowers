#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
// const { logInfo, logWarn, logError } = require('../src/utils/logger');

const logDir = path.join(__dirname, '../logs');
const today = new Date().toISOString().split('T')[0];

console.log('🌱 Просмотр логов Flowers API');
console.log('=============================');
console.log(`📅 Дата: ${today}`);
console.log(`📁 Директория логов: ${logDir}`);
console.log('');

if (!fs.existsSync(logDir)) {
  console.error('❌ Директория логов не найдена. Запустите приложение для создания логов.');
  process.exit(1);
}

function showLastLines(filename, lines = 50) {
  const filepath = path.join(logDir, filename);
  
  if (!fs.existsSync(filepath)) {
    console.warn(`⚠️ Файл ${filename} не найден`);
    return;
  }

  console.log(`\n📄 Последние ${lines} строк из ${filename}:`);
  console.log('='.repeat(60));
  
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const allLines = content.split('\n').filter(line => line.trim());
    const lastLines = allLines.slice(-lines);
    
    lastLines.forEach((line, index) => {
      try {
        const log = JSON.parse(line);
        const timestamp = log.timestamp || 'N/A';
        const level = log.level || 'INFO';
        const message = log.message || 'N/A';
        
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
        console.log(`📝 ${line}`);
      }
    });
    
      } catch (error) {
      console.error(`❌ Ошибка чтения файла ${filename}:`, error.message);
    }
}

function showStats() {
  console.log('\n📈 Статистика логов:');
  console.log('====================');
  
  const files = fs.readdirSync(logDir);
  const todayFiles = files.filter(file => file.includes(today));
  
  if (todayFiles.length === 0) {
    console.log('📭 Логи за сегодня не найдены');
    return;
  }
  
  todayFiles.forEach(file => {
    const filepath = path.join(logDir, file);
    const stats = fs.statSync(filepath);
    const size = (stats.size / 1024).toFixed(2);
    
    console.log(`📄 ${file}: ${size} KB`);
  });
  
  console.log('');
}

function searchLogs(query, filename = null) {
  console.log(`🔍 Поиск по запросу: "${query}"`);
  if (filename) {
    console.log(`📄 В файле: ${filename}`);
  }
  console.log('====================');
  
  const files = filename ? [filename] : fs.readdirSync(logDir).filter(file => file.includes(today));
  
  files.forEach(file => {
    const filepath = path.join(logDir, file);
    if (!fs.existsSync(filepath)) return;
    
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      const lines = content.split('\n');
      
      let found = false;
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          if (!found) {
            console.log(`\n📄 Результаты в ${file}:`);
            found = true;
          }
          
          try {
            const log = JSON.parse(line);
            const timestamp = log.timestamp || 'N/A';
            const level = log.level || 'INFO';
            const message = log.message || 'N/A';
            
            console.log(`   [${timestamp}] [${level}] ${message}`);
          } catch (e) {
            console.log(`   Строка ${index + 1}: ${line}`);
          }
        }
      });
      
      if (!found) {
        console.log(`📭 В файле ${file} ничего не найдено`);
      }
      
    } catch (error) {
      console.error(`❌ Ошибка чтения файла ${file}:`, error.message);
    }
  });
  
  console.log('');
}

// Основное меню
function showMenu() {
  console.log('🎯 Доступные команды:');
  console.log('====================');
  console.log('1. Показать последние логи (все)');
  console.log('2. Показать последние ошибки');
  console.log('3. Показать статистику');
  console.log('4. Поиск по логам');
  console.log('5. Выход');
  console.log('');
}

const args = process.argv.slice(2);

if (args.length > 0) {
  const command = args[0];
  
  switch (command) {
    case 'all':
      showLastLines(`combined-${today}.log`, args[1] ? parseInt(args[1]) : 50);
      break;
      
    case 'errors':
      showLastLines(`error-${today}.log`, args[1] ? parseInt(args[1]) : 50);
      break;
      
    case 'stats':
      showStats();
      break;
      
    case 'search':
      if (args[1]) {
        searchLogs(args[1], args[2]);
      } else {
        console.error('❌ Укажите поисковый запрос: node view-logs.js search "запрос"');
      }
      break;
      
    default:
      console.error('❌ Неизвестная команда. Используйте: all, errors, stats, search');
      break;
  }
  
  process.exit(0);
}

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

showMenu();

rl.on('line', (input) => {
  const choice = input.trim();
  
  switch (choice) {
    case '1':
      showLastLines(`combined-${today}.log`, 50);
      showMenu();
      break;
      
    case '2':
      showLastLines(`error-${today}.log`, 50);
      showMenu();
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
});

rl.on('SIGINT', () => {
  console.log('\n👋 До свидания!');
  process.exit(0);
});

console.log('💡 Введите номер команды для продолжения...');
