const router = require('express').Router();
const { Plant, User } = require('../db/models');
const { logError, logInfo, logWarn } = require('../utils/logger');

const validatePlantData = (req, res, next) => {
  const { user_id, plant_name, watering_frequency, last_watered, is_fine } = req.body;
  
  if (!user_id || isNaN(parseInt(user_id)) || parseInt(user_id) <= 0) {
    logWarn('Валидация ID пользователя не пройдена', {
      user_id,
      reason: 'invalid_user_id',
      endpoint: '/plant/add'
    });
    return res.status(400).json({ error: 'Некорректный ID пользователя' });
  }
  
  if (!plant_name || typeof plant_name !== 'string' || plant_name.trim().length === 0) {
    logWarn('Валидация названия растения не пройдена', {
      plant_name,
      reason: 'empty_or_invalid_type',
      endpoint: '/plant/add'
    });
    return res.status(400).json({ error: 'Некорректное название растения' });
  }
  
  if (plant_name.length > 100) {
    logWarn('Валидация названия растения не пройдена', {
      plant_name,
      reason: 'too_long',
      endpoint: '/plant/add'
    });
    return res.status(400).json({ error: 'Название растения слишком длинное' });
  }
  
  if (!watering_frequency || isNaN(parseFloat(watering_frequency)) || parseFloat(watering_frequency) <= 0) {
    logWarn('Валидация частоты полива не пройдена', {
      watering_frequency,
      reason: 'invalid_frequency',
      endpoint: '/plant/add'
    });
    return res.status(400).json({ error: 'Некорректная частота полива' });
  }
  
  if (!last_watered || isNaN(parseInt(last_watered))) {
    logWarn('Валидация времени последнего полива не пройдена', {
      last_watered,
      reason: 'invalid_time',
      endpoint: '/plant/add'
    });
    return res.status(400).json({ error: 'Некорректное время последнего полива' });
  }
  
  if (typeof is_fine !== 'boolean') {
    logWarn('Валидация статуса растения не пройдена', {
      is_fine,
      reason: 'invalid_status',
      endpoint: '/plant/add'
    });
    return res.status(400).json({ error: 'Некорректный статус растения' });
  }
  
  req.body.plant_name = plant_name.trim();
  next();
};

router.post('/add', validatePlantData, async (req, res) => {
  try {
    await Plant.create({
      user_id: parseInt(req.body.user_id),
      plant_name: req.body.plant_name,
      watering_frequency: parseFloat(req.body.watering_frequency),
      last_watered: parseInt(req.body.last_watered),
      is_fine: req.body.is_fine
    });
    
    logInfo('Растение добавлено', {
      operation: 'add_plant',
      user_id: req.body.user_id,
      plant_name: req.body.plant_name,
      watering_frequency: req.body.watering_frequency,
      endpoint: '/plant/add'
    });
    
    res.status(200).json({ message: 'Растение добавлено' });
  } catch (err) {
    logError(err, {
      operation: 'add_plant',
      user_id: req.body.user_id,
      plant_name: req.body.plant_name,
      endpoint: '/plant/add'
    });
    res.status(500).json({ error: 'Ошибка добавления растения' });
  }
});

router.get('/getplants', async (req, res) => {
  try {
    const userid = req.query.userid;
    
    if (!userid || isNaN(parseInt(userid)) || parseInt(userid) <= 0) {
      logWarn('Валидация ID пользователя не пройдена', {
        userid,
        reason: 'invalid_user_id',
        endpoint: '/plant/getplants'
      });
      return res.status(400).json({ error: 'Некорректный ID пользователя' });
    }
    
    const plants = await Plant.findAll({
      where: { user_id: parseInt(userid) }
    });
  
    logInfo('Растения пользователя получены', {
      operation: 'get_plants',
      user_id: userid,
      count: plants.length,
      endpoint: '/plant/getplants'
    });
    
    res.status(200).json(plants);
  } catch (err) {
    logError(err, {
      operation: 'get_plants',
      user_id: userid,
      endpoint: '/plant/getplants'
    });
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.get('/getplant', async (req, res) => {
  try {
    const { id, name } = req.query;
    let plant;

    if (id) {
      if (isNaN(parseInt(id)) || parseInt(id) <= 0) {
        logWarn('Валидация ID растения не пройдена', {
          id,
          reason: 'invalid_plant_id',
          endpoint: '/plant/getplant'
        });
        return res.status(400).json({ error: 'Некорректный ID растения' });
      }
      
      plant = await Plant.findByPk(parseInt(id), {
        attributes: ['plant_name']
      });
    } else if (name) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        logWarn('Валидация названия растения не пройдена', {
          name,
          reason: 'empty_or_invalid_type',
          endpoint: '/plant/getplant'
        });
        return res.status(400).json({ error: 'Некорректное название растения' });
      }
      
      plant = await Plant.findOne({
        where: { plant_name: name.trim() },
        attributes: ['id']
      });
    } else {
      logWarn('Отсутствуют обязательные параметры', {
        reason: 'missing_params',
        endpoint: '/plant/getplant'
      });
      return res.status(400).json({ error: 'Необходимо передать параметр id или name' });
    }
    
    if (!plant) {
      logWarn('Растение не найдено', {
        operation: 'get_plant',
        id,
        name,
        endpoint: '/plant/getplant'
      });
      return res.status(404).json({ error: 'Растение не найдено' });
    }
    
    logInfo('Растение найдено', {
      operation: 'get_plant',
      id,
      name,
      endpoint: '/plant/getplant'
    });
    
    res.status(200).json(plant);
  } catch (err) {
    logError(err, {
      operation: 'get_plant',
      id,
      name,
      endpoint: '/plant/getplant'
    });
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.put('/water', async (req, res) => {
  try {
    const { plantid, time } = req.query;
    
    if (!plantid || isNaN(parseInt(plantid)) || parseInt(plantid) <= 0) {
      logWarn('Валидация ID растения не пройдена', {
        plantid,
        reason: 'invalid_plant_id',
        endpoint: '/plant/water'
      });
      return res.status(400).json({ error: 'Некорректный ID растения' });
    }
    
    if (!time || isNaN(parseInt(time))) {
      logWarn('Валидация времени полива не пройдена', {
        time,
        reason: 'invalid_time',
        endpoint: '/plant/water'
      });
      return res.status(400).json({ error: 'Некорректное время полива' });
    }

    const plant = await Plant.findByPk(parseInt(plantid));
    
    if (!plant) {
      logWarn('Растение не найдено для полива', {
        operation: 'water_plant',
        plantid,
        endpoint: '/plant/water'
      });
      return res.status(404).json({ error: 'Растение не найдено' });
    }

    await plant.update({
      last_watered: parseInt(time),
      is_fine: true
    });

    logInfo('Растение полито', {
      operation: 'water_plant',
      plantid,
      time,
      endpoint: '/plant/water'
    });

    res.status(200).json({ message: 'Растение полито' });
  } catch(err) {
    logError(err, {
      operation: 'water_plant',
      plantid,
      time,
      endpoint: '/plant/water'
    });
    res.status(500).json({ error: 'Ошибка полива растения' });
  }
});

router.put('/waterall', async (req, res) => {
  try {
    const { userid, time } = req.query;
    
    if (!userid || isNaN(parseInt(userid)) || parseInt(userid) <= 0) {
      logWarn('Валидация ID пользователя не пройдена', {
        userid,
        reason: 'invalid_user_id',
        endpoint: '/plant/waterall'
      });
      return res.status(400).json({ error: 'Некорректный ID пользователя' });
    }
    
    if (!time || isNaN(parseInt(time))) {
      logWarn('Валидация времени полива не пройдена', {
        time,
        reason: 'invalid_time',
        endpoint: '/plant/waterall'
      });
      return res.status(400).json({ error: 'Некорректное время полива' });
    }
    
    const result = await Plant.update({
      last_watered: parseInt(time),
      is_fine: true
    }, {
      where: { user_id: parseInt(userid) }
    });
    
    if (result[0] === 0) {
      logWarn('Растения пользователя не найдены', {
        operation: 'water_all_plants',
        userid,
        endpoint: '/plant/waterall'
      });
      return res.status(404).json({ error: 'Растения не найдены' });
    }
    
    logInfo('Все растения пользователя политы', {
      operation: 'water_all_plants',
      userid,
      time,
      affected_plants: result[0],
      endpoint: '/plant/waterall'
    });
    
    return res.status(200).json({ message: 'Все растения политы' });
  } catch(err) {
    logError(err, {
      operation: 'water_all_plants',
      userid,
      time,
      endpoint: '/plant/waterall'
    });
    return res.status(500).json({ error: 'Ошибка полива растений' });
  }
});

router.put('/updfreq', async (req, res) => {
  try {
    const { plantid, newfreq } = req.query;
    
    if (!plantid || isNaN(parseInt(plantid)) || parseInt(plantid) <= 0) {
      logWarn('Валидация ID растения не пройдена', {
        plantid,
        reason: 'invalid_plant_id',
        endpoint: '/plant/updfreq'
      });
      return res.status(400).json({ error: 'Некорректный ID растения' });
    }
    
    if (!newfreq || isNaN(parseFloat(newfreq)) || parseFloat(newfreq) <= 0) {
      logWarn('Валидация частоты полива не пройдена', {
        newfreq,
        reason: 'invalid_frequency',
        endpoint: '/plant/updfreq'
      });
      return res.status(400).json({ error: 'Некорректная частота полива' });
    }
    
    const plant = await Plant.findByPk(parseInt(plantid));
    
    if (!plant) {
      logWarn('Растение не найдено для обновления частоты', {
        operation: 'update_frequency',
        plantid,
        endpoint: '/plant/updfreq'
      });
      return res.status(404).json({ error: 'Растение не найдено' });
    }
    
    await plant.update({
      watering_frequency: parseFloat(newfreq)
    });
    
    logInfo('Частота полива растения обновлена', {
      operation: 'update_frequency',
      plantid,
      new_frequency: newfreq,
      endpoint: '/plant/updfreq'
    });
    
    res.status(200).json({ message: 'Частота полива обновлена' });
  } catch(err) {
    logError(err, {
      operation: 'update_frequency',
      plantid,
      newfreq,
      endpoint: '/plant/updfreq'
    });
    res.status(500).json({ error: 'Ошибка обновления частоты полива' });
  }
});

router.put('/updstatus', async (req, res) => {
  try {
    const { plantid } = req.query;
    
    if (!plantid || isNaN(parseInt(plantid)) || parseInt(plantid) <= 0) {
      logWarn('Валидация ID растения не пройдена', {
        plantid,
        reason: 'invalid_plant_id',
        endpoint: '/plant/updstatus'
      });
      return res.status(400).json({ error: 'Некорректный ID растения' });
    }
    
    const plant = await Plant.findByPk(parseInt(plantid));
    
    if (!plant) {
      logWarn('Растение не найдено для обновления статуса', {
        operation: 'update_status',
        plantid,
        endpoint: '/plant/updstatus'
      });
      return res.status(404).json({ error: 'Растение не найдено' });
    }
    
    await plant.update({
      is_fine: !plant.is_fine
    });
    
    logInfo('Статус растения обновлен', {
      operation: 'update_status',
      plantid,
      endpoint: '/plant/updstatus'
    });
    
    res.status(200).json({ message: 'Статус растения обновлен' });
  } catch (err) {
    logError(err, {
      operation: 'update_status',
      plantid,
      endpoint: '/plant/updstatus'
    });
    res.status(500).json({ error: 'Ошибка обновления статуса' });
  }
});

router.delete('/delete', async (req, res) => {
  try {
    const plantId = req.query.plantid;
    
    if (!plantId || isNaN(parseInt(plantId)) || parseInt(plantId) <= 0) {
      logWarn('Валидация ID растения не пройдена', {
        plantId,
        reason: 'invalid_plant_id',
        endpoint: '/plant/delete'
      });
      return res.status(400).json({ error: 'Некорректный ID растения' });
    }
    
    const plant = await Plant.findByPk(parseInt(plantId));
    
    if (!plant) {
      logWarn('Растение не найдено для удаления', {
        operation: 'delete_plant',
        plantId,
        endpoint: '/plant/delete'
      });
      return res.status(404).json({ error: 'Растение не найдено' });
    }
    
    await plant.destroy();
    
    logInfo('Растение удалено', {
      operation: 'delete_plant',
      plantId,
      endpoint: '/plant/delete'
    });
    
    res.status(200).json({ message: 'Растение удалено' });
  } catch (err) {
    logError(err, {
      operation: 'delete_plant',
      plantId,
      endpoint: '/plant/delete'
    });
    res.status(500).json({ error: 'Ошибка удаления растения' });
  }
});

module.exports = router;
