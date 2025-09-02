import { Telegraf, Markup  } from 'telegraf';
import * as dotenv from 'dotenv';
import { addUser, addPlant, getUserId, getPlants, getPlant, waterPlantByPlantId, waterPlantByUserId, updateFrequency, deletePlant, updStatus, getActiveUsers, deactivateUser } from "./requests.js";
import moment from 'moment';
import { logError, logInfo, logWarn } from './logger.js';

dotenv.config();

const token = process.env.BOT_TOKEN;
if (!token) {
  logError(new Error('BOT_TOKEN не найден в переменных окружения'), {
    operation: 'bot_startup',
    context: 'environment_check'
  });
  process.exit(1);
}

const bot = new Telegraf(token);

const WATCH_FREQUENCY = moment.duration({ 'days': 1 });
const MAX_PLANT_NAME_LENGTH = 50;
const MAX_WATERING_FREQUENCY = 365;
const MIN_WATERING_FREQUENCY = 1;

const activeIntervals = new Map();

const PRESET_MESSAGES = {
  NEW_PLANT: 'Введите название растения и частоту полива в днях (через пробел)',
  INCORRECT_INPUT: 'Введены некорректные значения! Попробуйте снова. Например "Антуриум 7"',
  EDIT_PLANT: 'Введите новую частоту полива (в днях одним числом) для растения '
};

const mainKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Добавить растения', 'addPlant')],
  [Markup.button.callback('Полить растение', 'waterPlant')],
  [Markup.button.callback('Полить все растения', 'waterAllPlants')],
  [Markup.button.callback('Изменить частоту полива', 'editPlant')],
  [Markup.button.callback('Удалить растение', 'deletePlant')],
]).resize();

bot.telegram.setMyCommands([
  { command: 'start', description: 'Запустить отслеживание полива' },
  { command: 'menu', description: 'Главное меню' },
  { command: 'help', description: 'Помощь' },
  { command: 'stop', description: 'Остановить отслеживание' },
]);

bot.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date().getTime() - start.getTime();
  logInfo(`Response time: ${ms}ms`, {
    operation: 'telegram_request',
    updateType: ctx.updateType,
    duration: ms
  });
});

bot.catch((err, ctx) => {
  logError(err, {
    operation: 'telegram_request',
    updateType: ctx.updateType,
    context: 'bot_catch'
  });
  ctx.reply('Произошла ошибка. Попробуйте позже или обратитесь к администратору.');
});

async function restoreIntervals() {
  try {
    logInfo('Восстанавливаем интервалы для активных пользователей...', {
      operation: 'restore_intervals'
    });
    const activeUsers = await getActiveUsers();
    
    for (const user of activeUsers) {
      if (user.chat_id && user.is_active) {
        logInfo(`Восстанавливаем интервал для пользователя ${user.name} (ID: ${user.id})`, {
          operation: 'restore_interval',
          user_id: user.id,
          username: user.name
        });
        await startWatch(user.id, user.chat_id);
      }
    }
    
    logInfo(`Восстановлено ${activeUsers.length} активных пользователей`, {
      operation: 'restore_intervals_complete',
      count: activeUsers.length
    });
  } catch (error) {
    logError(error, {
      operation: 'restore_intervals',
      context: 'restore_intervals_error'
    });
  }
}

bot.start(async (ctx) => {
  try {
    const username = ctx.message.from.username;
    if (!username) {
      return ctx.reply('Для использования бота необходимо иметь username в Telegram.');
    }

    const chat_id = ctx.chat.id;
    
    const result = await addUser(username, chat_id);
    
    if (result) {
      const user_id = result.user_id;
      
      if (result.is_new) {
        const res = await startWatch(user_id, chat_id);
        if (res) {
          ctx.reply(`Добро пожаловать, ${username}!`, mainKeyboard);
        } else {
          ctx.reply('Ошибка запуска бота. Обратитесь к администратору');
        }
      } else {
        if (activeIntervals.has(user_id)) {
          clearInterval(activeIntervals.get(user_id));
          activeIntervals.delete(user_id);
          logInfo(`Остановлен старый интервал для пользователя ${username} (ID: ${user_id})`, {
            operation: 'clear_old_interval',
            user_id: user_id,
            username: username
          });
        }
        
        const res = await startWatch(user_id, chat_id);
        if (res) {
          ctx.reply(`С возвращением, ${username}! Отслеживание полива перезапущено.`, mainKeyboard);
        } else {
          ctx.reply('Ошибка перезапуска бота. Обратитесь к администратору');
        }
      }
    } else {
      ctx.reply('Ошибка регистрации. Пожалуйста, попробуйте позднее.');
    }
  } catch (error) {
    logError(error, {
      operation: 'bot_start_command',
      username: username,
      context: 'start_command_error'
    });
    ctx.reply('Произошла ошибка при запуске бота.');
  }
});

bot.command('menu', (ctx) => {
  ctx.reply('Главное меню', mainKeyboard);
});

bot.command('help', (ctx) => {
  const helpText = `
🤖 *Помощь по использованию бота*

*Команды:*
/start - Запустить бота
/menu - Главное меню
/help - Эта справка
/stop - Остановить отслеживание

*Функции:*
• Добавление растений с указанием частоты полива
• Автоматические напоминания о поливе
• Ручной полив отдельных растений или всех сразу
• Изменение частоты полива
• Удаление растений

*Формат добавления растения:*
Название растения + пробел + частота полива в днях
Пример: "Антуриум 7"

*Ограничения:*
• Название растения: до ${MAX_PLANT_NAME_LENGTH} символов
• Частота полива: от ${MIN_WATERING_FREQUENCY} до ${MAX_WATERING_FREQUENCY} дней
  `;
  ctx.reply(helpText, { parse_mode: 'Markdown' });
});

bot.command('stop', async (ctx) => {
  try {
    const username = ctx.message.from.username;
    if (!username) {
      return ctx.reply('Для использования бота необходимо иметь username в Telegram.');
    }

    const user_id = await getUserId(username);
    if (user_id > 0) {
      if (activeIntervals.has(user_id)) {
        clearInterval(activeIntervals.get(user_id));
        activeIntervals.delete(user_id);
        logInfo(`Остановлен интервал для пользователя ${username} (ID: ${user_id})`, {
          operation: 'stop_user_interval',
          user_id: user_id,
          username: username
        });
      }
      
      const deactivated = await deactivateUser(user_id);
      if (deactivated) {
        ctx.reply('Отслеживание полива остановлено. Используйте /start для возобновления.', mainKeyboard);
      } else {
        ctx.reply('Ошибка остановки отслеживания. Обратитесь к администратору.');
      }
    } else {
      ctx.reply('Пользователь не найден.');
    }
  } catch (error) {
    logError(error, {
      operation: 'bot_stop_command',
      username: username,
      context: 'stop_command_error'
    });
    ctx.reply('Произошла ошибка при остановке бота.');
  }
});

async function startWatch(user_id, chat_id) {
  try {
    const interval = setInterval(async () => {
      try {
        const result = await checkplants(user_id);
        if (result.length > 0) {
          await bot.telegram.sendMessage(chat_id, result, { reply_markup: mainKeyboard });
        }
      } catch (error) {
        logError(error, {
          operation: 'check_plants_interval',
          user_id: user_id,
          context: 'check_plants_error'
        });
      }
    }, WATCH_FREQUENCY.asMilliseconds());
    
    activeIntervals.set(user_id, interval);
    
    return true;
  } catch (error) {
    logError(error, {
      operation: 'start_watch',
      user_id: user_id,
      context: 'start_watch_error'
    });
    return false;
  }
}

async function checkplants(user_id) {
  try {
    const currentDate = moment.utc().format('YYYY-MM-DD');
    let result = 'Сегодня нужно полить: \n';
    let needToWater = false;
    
    const plants = await getPlants(user_id);
    if (!plants || !Array.isArray(plants)) {
      logError(new Error('Ошибка получения растений для пользователя'), {
        operation: 'check_plants',
        user_id: user_id,
        context: 'get_plants_error'
      });
      return '';
    }
    
    for (let plant of plants) {
              if (!plant.last_watered || !plant.watering_frequency) {
          logWarn('Растение с некорректными данными', {
            operation: 'check_plants',
            user_id: user_id,
            plant: plant,
            context: 'invalid_plant_data'
          });
          continue;
        }
      
      const nextWateringDate = moment
        .utc(parseInt(plant.last_watered))
        .add(parseInt(plant.watering_frequency), 'days')
        .format('YYYY-MM-DD');
                        
      if (moment(currentDate).isSameOrAfter(nextWateringDate)) {
        result += `🌱 ${plant.plant_name}\n`;
        needToWater = true;
      }
    }
    
    return needToWater ? result : '';
  } catch (error) {
    logError(error, {
      operation: 'check_plants',
      user_id: user_id,
      context: 'check_plants_main_error'
    });
    return '';
  }
}

bot.action('addPlant', async (ctx) => {
  const messageDateTime = ctx.update.callback_query.message.date * 1000
  if ( checkMessage(messageDateTime)) {
    await ctx.deleteMessage();
  }
  const user_id = await getUserId(ctx.update.callback_query.from.username);
  if (user_id > 0) {
    await ctx.replyWithHTML(PRESET_MESSAGES.NEW_PLANT, {
      reply_markup: {
          force_reply: true,
      },
    });
  } else {
    ctx.reply('Ошибка пользователя');
  }
});

bot.action('editPlant', async(ctx) => {
  let user_id = await getUserId(ctx.update.callback_query.from.username);
  let keyWord = 'edit'
  if (user_id > 0) {
    let plants = await getPlants(user_id)
    if (plants.length) {
      let moreButtons = [{name:'Отмена', id: keyWord+'_0'}]
      ctx.reply('Выберите растение', await plantListButtons(plants, keyWord, moreButtons));
    } else {
      ctx.reply(`Вы не добавили ни одного растения`, mainKeyboard)
    }
  } else {
    ctx.reply('Ошибка пользователя');
  }
})

bot.action('deletePlant', async(ctx) => {
  let user_id = await getUserId(ctx.update.callback_query.from.username);
  let keyWord = 'delete'  
  if (user_id > 0) {
    let plants = await getPlants(user_id)
    if (plants.length) {
      let moreButtons = [{name:'Отмена', id: keyWord+'_0'}]
      ctx.reply('Выберите растение', await plantListButtons(plants, keyWord, moreButtons));
    } else {
      ctx.reply(`Вы не добавили ни одного растения`, mainKeyboard)
    }
  } else {
    ctx.reply('Ошибка пользователя');
  }
})

function checkMessage(messageDateTime) {
  const now = moment.now()
  const hoursDifference = (now - messageDateTime) / (1000 * 60 * 60);
  return  hoursDifference <= 48
}

bot.action('waterPlant', async(ctx) => {
  const messageDateTime = ctx.update.callback_query.message.date * 1000
  if ( checkMessage(messageDateTime)) {
    await ctx.deleteMessage();
  }
  let user_id = await getUserId(ctx.update.callback_query.from.username);
  let keyWord = 'water'
  if (user_id > 0) {
    let plants = await getPlants(user_id, [])
    if (plants.length) {
      let moreButtons = [{name:'Полить все', id: 'water_0'}]

      ctx.reply('Выберите растение для полива', await plantListButtons(plants, keyWord, moreButtons));
    } else {
      ctx.reply('В вашем списке нет растений', mainKeyboard);
    }
  } else {
    ctx.reply('Ошибка пользователя');
  }
})

bot.action('waterAllPlants', async(ctx) => {
  const messageDateTime = ctx.update.callback_query.message.date * 1000
  if ( checkMessage(messageDateTime)) {
    await ctx.deleteMessage();
  }
  let user_id = await getUserId(ctx.update.callback_query.from.username);
  if (user_id > 0) {
    let waterRes = await waterPlant(0, user_id)
    waterRes ? ctx.reply(`Все растения политы`, mainKeyboard) : ctx.reply(`Ошибка при обновлении данных по растениям`, mainKeyboard);
  } else {
    ctx.reply('Ошибка пользователя');
  }

})

bot.action(/edit_/, async(ctx) => {
  const messageDateTime = ctx.update.callback_query.message.date * 1000
  if ( checkMessage(messageDateTime)) {
    await ctx.deleteMessage();
  }
  const plantId = ctx.callbackQuery.data.replace('edit_', '');
  if (!isNaN(parseFloat(plantId))) {
    let userId = await getUserId(ctx.update.callback_query.from.username);
    if (userId > 0) {
      let plantName = await getPlant(plantId)
      console.log(plantId);
      
      if (plantName) {
        await ctx.replyWithHTML(PRESET_MESSAGES.EDIT_PLANT + plantName.plant_name.trim(), {
          reply_markup: {
              force_reply: true,
          },
        });
      } else {
        ctx.reply(`Непредвиденная ошибка`, mainKeyboard)
      }
    } else {
      ctx.reply('Ошибка пользователя');
    }
  } else {
    ctx.reply(`Отменено`, mainKeyboard)
  }
})

bot.action(/delete_/, async(ctx) => {
  const messageDateTime = ctx.update.callback_query.message.date * 1000
  if ( checkMessage(messageDateTime)) {
    await ctx.deleteMessage();
  }
  const plantId = ctx.callbackQuery.data.replace('delete_', '');
  if (!isNaN(parseFloat(plantId))) {
    let userId = await getUserId(ctx.update.callback_query.from.username);
    if (userId > 0) {
      let plantName = await getPlant(plantId)
      if (plantName) { 
        const result = await deletePlant(plantId)
        if (result) {
          ctx.reply(`Растение "${plantName.plant_name.trim()}" ,было удалено.`, mainKeyboard);
        } else {
          ctx.reply('Ошибка удаления растения!');
        }
      } else {
        ctx.reply(`Непредвиденная ошибка`, mainKeyboard)
      }
    } else {
      ctx.reply('Ошибка пользователя');
    }
  } else {
    ctx.reply(`Отменено`, mainKeyboard)
  }
})

bot.action(/water_/, async (ctx) => {
  const messageDateTime = ctx.update.callback_query.message.date * 1000
  if ( checkMessage(messageDateTime)) {
    await ctx.deleteMessage();
  }
  const plantId = ctx.callbackQuery.data.replace('water_', '');
  if (!isNaN(parseFloat(plantId))) {
    let userId = await getUserId(ctx.update.callback_query.from.username);
    let waterRes = await waterPlant(parseFloat(plantId), userId)
    let plantName = await getPlant(plantId)
    plantName = plantName ? plantName.plant_name : ''
    waterRes ? ctx.reply(`Растение ${plantName} полито`, mainKeyboard) : ctx.reply(`Ошибка при обновлении данных по растению ${plantName}`, mainKeyboard);
  } else {
    ctx.reply(`Непредвиденная ошибка`, mainKeyboard)
  }
});

bot.on('text', async (ctx) => {
  const user_id = await getUserId(ctx.message.from.username);
  const regExp = /^.+\s\d+(\.\d+)?$/
  let input
  if (user_id > 0) {
    if (ctx.message.reply_to_message) {
      const repliedText = ctx.message.reply_to_message.text;
      if (repliedText === PRESET_MESSAGES.NEW_PLANT || repliedText === PRESET_MESSAGES.INCORRECT_INPUT) { 
        input = ctx.message.text.trim().replace(/\s{2,}/g, ' ')
        if (regExp.test(input)) {
          let plantData = splitInput(input)
          if (plantData !== null) {
            const newPlant = {
              user_id: user_id, 
              plant_name: plantData.plant_name,
              watering_frequency: plantData.watering_frequency,
              last_watered: moment.now(),
              is_fine: true
            }
            const result = await addPlant(newPlant);
            if (result) {
              ctx.reply(`Растение "${plantData.plant_name}" с частотой полива ${plantData.watering_frequency.toString()} д. успешно добавлено`, mainKeyboard);
            } else {
              ctx.reply('Ошибка добавления растения!');
            }
          }
        } else {
          await ctx.replyWithHTML(PRESET_MESSAGES.INCORRECT_INPUT, {
            reply_markup: {
              force_reply: true,
            },
          });
        }
      } else if (new RegExp("^" + PRESET_MESSAGES.EDIT_PLANT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ".*").test(repliedText)) {
        input = ctx.message.text.trim()
        
        let plantName = repliedText.replace(new RegExp("^" + PRESET_MESSAGES.EDIT_PLANT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), '')
        if (isNaN(parseFloat(input)) || !plantName.length ) {
          ctx.reply('Непредвиденная ошибка', mainKeyboard);
        } else {
          let plantId = await getPlant(null, plantName)
          if (!plantId) {
            ctx.reply('Непредвиденная ошибка', mainKeyboard);
          } else {
            let result = await updateFrequency(plantId.id, parseFloat(input));
            
            if (result) {
              ctx.reply('Данные обновлены', mainKeyboard);
            } else {
              ctx.reply('Непредвиденная ошибка', mainKeyboard);
            }
          }
        }
      } else {
        ctx.reply('Что вы хотите сделать?', mainKeyboard);
      }
    } else {
      ctx.reply('Что вы хотите сделать?', mainKeyboard);
    }
  }
});

async function waterPlant(plantId, userId) {
  if (plantId === 0) {
    return waterPlantByUserId(userId, moment.now())
  } else {
    return waterPlantByPlantId(plantId, moment.now())
  }
}

async function plantListButtons(plants, key, moreButtons) {
  const keyPlantList = Markup.inlineKeyboard(
    plants.map((plant) => [Markup.button.callback(plant.plant_name.trim(), key+`_${plant.id}`)])
  );
  if (moreButtons.length) {
    moreButtons.map((button) => keyPlantList.reply_markup.inline_keyboard.push([Markup.button.callback(button.name, button.id)]))
  }
  return keyPlantList
}

function splitInput(inputString) {
  const regex = /^(.*\S)\s(\d+(\.\d+)?)\s*$/;
  const matches = inputString.match(regex);
  const plantData = {}
  if (matches && matches.length >= 3) {
    plantData.plant_name = matches[1];
    const wateringFrequency = parseFloat(matches[2]);
    if (!isNaN(wateringFrequency)) {
        plantData.watering_frequency = wateringFrequency;
    } else {
        logWarn("Ошибка при парсинге частоты полива", {
          operation: 'split_input',
          input: inputString,
          context: 'watering_frequency_parse_error'
        });
        return null
    }
  } else {
    logWarn("Некорректный ввод", {
      operation: 'split_input',
      input: inputString,
      context: 'invalid_input_format'
    });
    return null
  }
  return plantData
}

process.once('SIGINT', () => {
  logInfo('Остановка бота...', {
    operation: 'bot_shutdown',
    signal: 'SIGINT'
  });
  for (const [userId, interval] of activeIntervals) {
    clearInterval(interval);
    logInfo(`Остановлен интервал для пользователя ${userId}`, {
      operation: 'clear_interval',
      user_id: userId,
      signal: 'SIGINT'
    });
  }
  activeIntervals.clear();
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  logInfo('Остановка бота...', {
    operation: 'bot_shutdown',
    signal: 'SIGTERM'
  });
  for (const [userId, interval] of activeIntervals) {
    clearInterval(interval);
    logInfo(`Остановлен интервал для пользователя ${userId}`, {
      operation: 'clear_interval',
      user_id: userId,
      signal: 'SIGTERM'
    });
  }
  activeIntervals.clear();
  bot.stop('SIGTERM');
});

bot.launch().then(() => {
  logInfo('Бот запущен!', {
    operation: 'bot_launch_success'
  });
  restoreIntervals();
}).catch((error) => {
  logError(error, {
    operation: 'bot_launch',
    context: 'launch_error'
  });
  process.exit(1);
});
