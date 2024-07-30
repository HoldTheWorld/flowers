import { Telegraf, Markup  } from 'telegraf';
import * as dotenv from 'dotenv';
import { addUser, addPlant, getUserId, getPlants, getPlant, waterPlantByPlantId, waterPlantByUserId, updateFrequency, deletePlant, updStatus, setIntId } from "./requests.js";
import moment from 'moment';
import cron from 'node-cron'
import http  from 'http';
import https  from 'https';
import fetch from 'node-fetch'

dotenv.config();
const token = process.env.BOT_TOKEN;
const bot = new Telegraf(token);
const watchFreq = moment.duration({ 'days': 1 }); // check

const presetNewPlant = 'Введите название растения и частоту полива в днях (через пробел)'
const presetIncorrect = 'Введены некорректные значения! Попробуйте снова. Например "Антуриум 7"'
const presetEditPlant = 'Введите новую частоту полива (в днях одним числом) для растения '

const mainKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Добавить растения', 'addPlant')],
  [Markup.button.callback('Полить растение', 'waterPlant')],
  [Markup.button.callback('Полить все растения', 'waterAllPlants')], // возможно убрать
  [Markup.button.callback('Изменить частоту полива', 'editPlant')],
  [Markup.button.callback('Удалить растение', 'deletePlant')],
  [Markup.button.callback('Список растений ', 'getPlants')],
]).resize();

bot.telegram.setMyCommands([
  { command: 'start', description: 'Запустить отслеживание полива' },
  { command: 'menu', description: 'Главное меню' },
]);

//https://github.com/znezniV/iad-telegram-plantbot
//https://github.com/telegraf/telegraf/issues/705
// session middleware

// bot.action(['yes', 'no'], ctx => {
//   if (ctx.callbackQuery.data === 'yes') {
//   } else {
//       ctx.deleteMessage()
//   }
// })

bot.start(async (ctx) => {
    const result = await addUser(ctx.message.from.username)
    if (result) {
      ctx.reply(`Добро пожаловать, ${ctx.message.from.username}!`, mainKeyboard);
      // начинается наблюдение за цветаами
      const user_id = await getUserId(ctx.message.from.username);
      
      let res = await startWatch(user_id, ctx.chat.id)
      if (!res) {
        ctx.reply(`Ошибка запуска бота. Обратитесь к администратору`);
      }
    } else {
      ctx.reply(`Ошибка. Пожалуйста, попробуйте позднее.`);
    }
});



bot.command('menu', (ctx) => {
  ctx.reply('Главное меню', mainKeyboard);
});

// function stopInterval(id) {
//   clearInterval(id);
// }


async function startWatch(user_id, chat_id) {
  cron.schedule('0 9 * * *', () => {
    console.log('trying to schedule');
  });
  return true
}
  



// async function startWatch(user_id, chat_id) {
//     let interval = setInterval(async () => {
//       let result = await checkplants(user_id)
//       if (result.length > 0 ) {
//         bot.telegram.sendMessage(chat_id, result, { reply_markup: mainKeyboard });
//       }
//     }, watchFreq);
//     return await setIntId(user_id, interval)
// }

async function checkplants(user_id) {
  let currentDate = moment.utc().format('YYYY-MM-DD');
  let result = 'Сегодня нужно полить: \n';
  let needToWater = false;
  const plants = await getPlants(user_id)
  
  for (let plant of plants) {
    let nextWateringDate = moment
                          .utc(parseInt(plant.last_watered))
                          .add(parseInt(plant.watering_frequency), 'days')
                          .format('YYYY-MM-DD');
                          
    if (moment(currentDate).isSameOrAfter(nextWateringDate)) {
      result += plant.plant_name + '\n';
      needToWater = true;
    }
  }
  return needToWater ? result : '';
}

// Обработчик для добавления цветка
bot.action('addPlant', async (ctx) => {
  const messageDateTime = ctx.update.callback_query.message.date * 1000
  if ( checkMessage(messageDateTime)) {
    await ctx.deleteMessage();
  }
  const user_id = await getUserId(ctx.update.callback_query.from.username);
  if (user_id > 0) {
    await ctx.replyWithHTML(presetNewPlant, {
      reply_markup: {
          force_reply: true,
      },
    });
  } else {
    ctx.reply('Ошибка пользователя');
  }
});

// обработчик для вывода списка к редактированию
bot.action('editPlant', async(ctx) => {
  let user_id = await getUserId(ctx.update.callback_query.from.username);
  let keyWord = 'edit'
  if (user_id > 0) {
    let plants = await getPlants(user_id) // array
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

bot.action('getPlants', async(ctx) => {
  let user_id = await getUserId(ctx.update.callback_query.from.username);
  if (user_id > 0) {
    let plants = await getPlants(user_id); // array

    if (plants.length) {
      let maxNameLength = Math.max(...plants.map(item => item.plant_name.length));
      let maxDateLength = 19; // Длина для формата даты YYYY-MM-DD HH:mm:ss
      let maxFrequencyLength = Math.max(...plants.map(item => item.watering_frequency.toString().length));
      
      // Формируем заголовок
      let header = `Растение`.padEnd(maxNameLength + 2, ' ') + `Последний полив`.padEnd(maxDateLength + 2, ' ') + `Частота\n`;

      // Функция для склонения слова "день" в зависимости от частоты
      const getFrequencyString = (frequency) => {
        if (frequency % 10 === 1 && frequency % 100 !== 11) return `${frequency} день`;
        if ([2, 3, 4].includes(frequency % 10) && ![12, 13, 14].includes(frequency % 100)) return `${frequency} дня`;
        return `${frequency} дней`;
      };

      // Формируем список растений с выравненными столбцами
      let plantList = plants.reduce((acc, item) => {
        let name = item.plant_name.padEnd(maxNameLength + 2, ' '); // добавляем 2 пробела для отступа
        let date = moment(parseInt(item.last_watered)).format('YYYY-MM-DD HH:mm:ss').padEnd(maxDateLength + 2, ' '); // добавляем 2 пробела для отступа
        let frequency = getFrequencyString(item.watering_frequency).padEnd(maxFrequencyLength + 2, ' '); // добавляем 2 пробела для отступа
        return acc + `${name}${date}${frequency}\n`;
      }, '');

      // Используем форматирование кода в Telegram для моноширинного шрифта
      let formattedPlantList = `\`\`\`\n${header}${plantList}\`\`\``;
      
      ctx.reply(`Информация о ваших растениях:\n${formattedPlantList}`, { parse_mode: 'Markdown' });
    } else {
      ctx.reply(`Вы не добавили ни одного растения`, mainKeyboard);
    }
  }
});

// обработчик для вывода списка к удалению
bot.action('deletePlant', async(ctx) => {
  let user_id = await getUserId(ctx.update.callback_query.from.username);
  let keyWord = 'delete'  
  if (user_id > 0) {
    let plants = await getPlants(user_id) // array
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

// обработчик для вывода списка к поливу
bot.action('waterPlant', async(ctx) => {
  const messageDateTime = ctx.update.callback_query.message.date * 1000
  if ( checkMessage(messageDateTime)) {
    await ctx.deleteMessage();
  }
  let user_id = await getUserId(ctx.update.callback_query.from.username);
  let keyWord = 'water'
  if (user_id > 0) {
    let plants = await getPlants(user_id, []) // array
    if (plants.length) {
      let moreButtons = [{name:'Полить все', id: 'water_0'}]

      ctx.reply('Выберите растение для полива', await plantListButtons(plants, keyWord, moreButtons));
      // при выборе растения  - функция обновляет is_fine = true и время полива на moment.now()
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

// обработчик кнопок редактирования
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
      if (plantName.length) {
        await ctx.replyWithHTML(presetEditPlant + plantName[0].plant_name.trim(), {
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

// обработчик кнопок удаления
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
      if (plantName.length) { 
        const result = await deletePlant(plantId)
        if (result) {
          ctx.reply(`Растение "${plantName[0].plant_name.trim()}" ,было удалено.`, mainKeyboard);
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
    ctx.reply(`Непредвиденная ошибка`, mainKeyboard)
  }
})

// обработчик кнопок полива
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
    waterRes ? ctx.reply(`Растение ${plantName[0].plant_name} полито`, mainKeyboard) : ctx.reply(`Ошибка при обновлении данных по растению ${plantName}`, mainKeyboard);
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
      // добавление нового растения 
      if (repliedText === presetNewPlant || repliedText === presetIncorrect) { 
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
          await ctx.replyWithHTML(presetIncorrect, {
            reply_markup: {
              force_reply: true,
            },
          });
        }
      // редактирование частоты полива 
      } else if (new RegExp("^" + presetEditPlant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ".*").test(repliedText)) {
        input = ctx.message.text.trim() // new watering frequency 
        let plantName = repliedText.replace(new RegExp("^" + presetEditPlant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), '')
        if (isNaN(parseFloat(input)) || !plantName.length ) {
          ctx.reply('Непредвиденная ошибка', mainKeyboard);
        } else {
          let plantId = await getPlant(null, plantName)
          if (!plantId) {
            ctx.reply('Непредвиденная ошибка', mainKeyboard);
          } else {
            let result = await updateFrequency(plantId[0].id, parseFloat(input));
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

// the function start watering one plant or all plants depending on function arguments
async function waterPlant(plantId, userId) {
  if (plantId === 0) {
    return waterPlantByUserId(userId, moment.now())
  } else {
    return waterPlantByPlantId(plantId, moment.now())
  }
}

//функция для получения списка растений в виде кнопок + доп кнопки при необходимости 
async function plantListButtons(plants, key, moreButtons) {
  const keyPlantList = Markup.inlineKeyboard(
    plants.map((plant) => [Markup.button.callback(plant.plant_name.trim(), key+`_${plant.id}`)])
  );
  if (moreButtons.length) {
    moreButtons.map((button) => keyPlantList.reply_markup.inline_keyboard.push([Markup.button.callback(button.name, button.id)]))
  }
  return keyPlantList
}

// функция преобразует входящую строку "имя растения частота полива " в объект Имя: имя, частота: частота (число), либо возвращает null в случае ошибки 
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
        console.log("Ошибка при парсинге частоты полива");
        return null
    }
  } else {
    console.log("Некорректный ввод");
    return null
  }
  return plantData
}

bot.launch();


const performRequest = async () => {
    try {
        const response = await fetch(`http://${process.env.DB_HOST}:${process.env.DB_PORT}/user/updint?userid=${0}&interval=${0}`, {
            method: 'PUT',
        });

        if (response.ok) {
            const data = await response.text(); // Получаем текст ответа
            return data;
        } else {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    } catch (error) {
        throw error;
    }
};

process.on('SIGINT', async () => {
    console.log('SIGINT received. Shutting down...');
    const maxRetries = 5;
    let attempt = 0;
    let success = false;

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
