const router = require('express').Router();
const { User } = require('../db/models');
const { logError, logInfo, logWarn } = require('../utils/logger');

const validateUsername = (req, res, next) => {
  const { user_name } = req.body;
  if (!user_name || typeof user_name !== 'string' || user_name.trim().length === 0) {
    logWarn('Валидация имени пользователя не пройдена', {
      user_name,
      reason: 'empty_or_invalid_type',
      endpoint: '/user/add'
    });
    return res.status(400).json({ error: 'Некорректное имя пользователя' });
  }
  if (user_name.length > 50) {
    logWarn('Валидация имени пользователя не пройдена', {
      user_name,
      reason: 'too_long',
      endpoint: '/user/add'
    });
    return res.status(400).json({ error: 'Имя пользователя слишком длинное' });
  }
  req.body.user_name = user_name.trim();
  next();
};

router.post('/add', validateUsername, async (req, res) => {
  const { user_name, chat_id } = req.body;
  
  try {
    logInfo(`Обработка пользователя: ${user_name}`, {
      operation: 'add_user',
      user_name: user_name,
      endpoint: '/user/add'
    });
    
    const existingUser = await User.findOne({
      where: { name: user_name }
    });

    if (existingUser) {
      await existingUser.update({
        chat_id: chat_id,
        is_active: true
      });
      
      logInfo('Пользователь обновлен', {
        operation: 'update_user',
        user_name,
        user_id: existingUser.id,
        chat_id,
        endpoint: '/user/add'
      });
      
      res.status(200).json({ 
        message: 'Пользователь обновлен',
        user_id: existingUser.id,
        is_new: false
      });
    } else {
      const newUser = await User.create({
        name: user_name,
        chat_id: chat_id,
        is_active: true
      });
      
      logInfo('Пользователь добавлен', {
        operation: 'create_user',
        user_name,
        user_id: newUser.id,
        chat_id,
        endpoint: '/user/add'
      });
      
      res.status(200).json({ 
        message: 'Пользователь добавлен',
        user_id: newUser.id,
        is_new: true
      });
    }
  } catch(err) {
    logError(err, {
      operation: 'add_user',
      user_name,
      chat_id,
      endpoint: '/user/add'
    });
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.get('/getuser', async (req, res) => {
  try {
    const username = req.query.username;
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      logWarn('Валидация имени пользователя не пройдена', {
        username,
        reason: 'empty_or_invalid_type',
        endpoint: '/user/getuser'
      });
      return res.status(400).json({ error: 'Некорректное имя пользователя' });
    }

    const user = await User.findOne({
      where: { name: username.trim() }
    });

    if (!user) {
      logWarn('Пользователь не найден', {
        operation: 'get_user',
        username,
        endpoint: '/user/getuser'
      });
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    logInfo('Пользователь найден', {
      operation: 'get_user',
      username,
      user_id: user.id,
      chat_id: user.chat_id,
      is_active: user.is_active,
      endpoint: '/user/getuser'
    });
    
    res.status(200).json({ 
      user_id: user.id,
      chat_id: user.chat_id,
      is_active: user.is_active
    });
  } catch (err) {
    logError(err, {
      operation: 'get_user',
      username,
      endpoint: '/user/getuser'
    });
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.get('/active', async (req, res) => {
  try {
    const activeUsers = await User.findAll({
      where: { 
        is_active: true,
        chat_id: { [require('sequelize').Op.ne]: null }
      },
      attributes: ['id', 'name', 'chat_id']
    });

    logInfo('Активные пользователи получены', {
      operation: 'get_active_users',
      count: activeUsers.length,
      endpoint: '/user/active'
    });
    
    res.status(200).json(activeUsers);
  } catch (err) {
    logError(err, {
      operation: 'get_active_users',
      endpoint: '/user/active'
    });
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.put('/deactivate', async (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id || isNaN(parseInt(user_id)) || parseInt(user_id) <= 0) {
      logWarn('Валидация ID пользователя не пройдена', {
        user_id,
        reason: 'invalid_id',
        endpoint: '/user/deactivate'
      });
      return res.status(400).json({ error: 'Некорректный ID пользователя' });
    }

    const user = await User.findByPk(parseInt(user_id));
    
    if (!user) {
      logWarn('Пользователь не найден для деактивации', {
        operation: 'deactivate_user',
        user_id,
        endpoint: '/user/deactivate'
      });
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    await user.update({ is_active: false });

    logInfo('Пользователь деактивирован', {
      operation: 'deactivate_user',
      user_id,
      endpoint: '/user/deactivate'
    });

    res.status(200).json({ message: 'Пользователь деактивирован' });
  } catch (err) {
    logError(err, {
      operation: 'deactivate_user',
      user_id,
      endpoint: '/user/deactivate'
    });
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
