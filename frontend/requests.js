import fetch from "node-fetch";
import dns from 'node:dns';
import * as dotenv from 'dotenv';
import { logError, logInfo, logWarn } from './logger.js';

dotenv.config();
dns.setDefaultResultOrder('ipv4first');

const API_BASE_URL = `http://${process.env.DB_HOST}:${process.env.DB_PORT}`;
const REQUEST_TIMEOUT = 10000;

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Превышено время ожидания запроса');
    }
    throw error;
  }
};

const validateUsername = (username) => {
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    throw new Error('Некорректное имя пользователя');
  }
  if (username.length > 50) {
    throw new Error('Имя пользователя слишком длинное');
  }
  return username.trim();
};

const validateUserId = (userId) => {
  if (!userId || isNaN(parseInt(userId)) || parseInt(userId) <= 0) {
    throw new Error('Некорректный ID пользователя');
  }
  return parseInt(userId);
};

const validatePlantData = (plantData) => {
  const { user_id, plant_name, watering_frequency, last_watered, is_fine } = plantData;
  
  if (!user_id || isNaN(parseInt(user_id)) || parseInt(user_id) <= 0) {
    throw new Error('Некорректный ID пользователя');
  }
  
  if (!plant_name || typeof plant_name !== 'string' || plant_name.trim().length === 0) {
    throw new Error('Некорректное название растения');
  }
  
  if (plant_name.length > 100) {
    throw new Error('Название растения слишком длинное');
  }
  
  if (!watering_frequency || isNaN(parseFloat(watering_frequency)) || parseFloat(watering_frequency) <= 0) {
    throw new Error('Некорректная частота полива');
  }
  
  if (!last_watered || isNaN(parseInt(last_watered))) {
    throw new Error('Некорректное время последнего полива');
  }
  
  if (typeof is_fine !== 'boolean') {
    throw new Error('Некорректный статус растения');
  }
  
  return {
    user_id: parseInt(user_id),
    plant_name: plant_name.trim(),
    watering_frequency: parseFloat(watering_frequency),
    last_watered: parseInt(last_watered),
    is_fine
  };
};

const addUser = async function(user_name, chat_id) {
  try {
    const validatedUsername = validateUsername(user_name);
    
    if (!chat_id || isNaN(parseInt(chat_id))) {
      throw new Error('Некорректный chat_id');
    }
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/user/add`, {
      method: 'POST', 
      credentials: 'include',
      body: JSON.stringify({ 
        user_name: validatedUsername,
        chat_id: parseInt(chat_id)
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logError(new Error('Ошибка добавления пользователя'), {
        operation: 'add_user',
        user_name: user_name,
        errorData: errorData,
        context: 'api_response_error'
      });
      return false;
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    logError(err, {
      operation: 'add_user',
      user_name: user_name,
      context: 'add_user_error'
    });
    return false;
  }
};

const getUserId = async function(user_name) {
  try {
    const validatedUsername = validateUsername(user_name);
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/user/getuser?username=${encodeURIComponent(validatedUsername)}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      return data.user_id || -1;
    } else {
      const errorData = await response.json().catch(() => ({}));
      logError(new Error('Ошибка получения ID пользователя'), {
        operation: 'get_user_id',
        user_name: user_name,
        errorData: errorData,
        context: 'api_response_error'
      });
      return -1;
    }
  } catch (err) {
    logError(err, {
      operation: 'get_user_id',
      user_name: user_name,
      context: 'get_user_id_error'
    });
    return -1;
  }
};

const getActiveUsers = async function() {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/user/active`, {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } else {
      const errorData = await response.json().catch(() => ({}));
      logError(new Error('Ошибка получения активных пользователей'), {
        operation: 'get_active_users',
        errorData: errorData,
        context: 'api_response_error'
      });
      return [];
    }
  } catch (err) {
    logError(err, {
      operation: 'get_active_users',
      context: 'get_active_users_error'
    });
    return [];
  }
};

const deactivateUser = async function(user_id) {
  try {
    const validatedUserId = validateUserId(user_id);
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/user/deactivate?user_id=${validatedUserId}`, {
      method: 'PUT',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logError(new Error('Ошибка деактивации пользователя'), {
        operation: 'deactivate_user',
        user_id: user_id,
        errorData: errorData,
        context: 'api_response_error'
      });
      return false;
    }
    
    return true;
  } catch (err) {
    logError(err, {
      operation: 'deactivate_user',
      user_id: user_id,
      context: 'deactivate_user_error'
    });
    return false;
  }
};

const addPlant = async function(plantData) {
  try {
    const validatedPlantData = validatePlantData(plantData);
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/plant/add`, {
      method: 'POST', 
      credentials: 'include',
      body: JSON.stringify(validatedPlantData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logError(new Error('Ошибка добавления растения'), {
        operation: 'add_plant',
        plantData: plantData,
        errorData: errorData,
        context: 'api_response_error'
      });
      return false;
    }
    
    return true;
  } catch (err) {
    logError(err, {
      operation: 'add_plant',
      plantData: plantData,
      context: 'add_plant_error'
    });
    return false;
  }
};

const getPlants = async function(user_id) {
  try {
    const validatedUserId = validateUserId(user_id);
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/plant/getplants?userid=${validatedUserId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } else {
      const errorData = await response.json().catch(() => ({}));
      logError(new Error('Ошибка получения растений'), {
        operation: 'get_plants',
        user_id: user_id,
        errorData: errorData,
        context: 'api_response_error'
      });
      return [];
    }
  } catch (err) {
    logError(err, {
      operation: 'get_plants',
      user_id: user_id,
      context: 'get_plants_error'
    });
    return [];
  }
};

const getPlant = async function(plant_id, plant_name) {
  try {
    let url;
    
    if (plant_id) {
      if (isNaN(parseInt(plant_id)) || parseInt(plant_id) <= 0) {
        throw new Error('Некорректный ID растения');
      }
      url = `${API_BASE_URL}/plant/getplant?id=${parseInt(plant_id)}`;
    } else if (plant_name) {
      if (!plant_name || typeof plant_name !== 'string' || plant_name.trim().length === 0) {
        throw new Error('Некорректное название растения');
      }
      url = `${API_BASE_URL}/plant/getplant?name=${encodeURIComponent(plant_name.trim())}`;
    } else {
      throw new Error('Необходимо передать параметр plant_id или plant_name');
    }
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      
      return data;
    } else {
      const errorData = await response.json().catch(() => ({}));
      logError(new Error('Ошибка получения растения'), {
        operation: 'get_plant',
        plant_id: plant_id,
        plant_name: plant_name,
        errorData: errorData,
        context: 'api_response_error'
      });
      return [];
    }
  } catch (err) {
    logError(err, {
      operation: 'get_plant',
      plant_id: plant_id,
      plant_name: plant_name,
      context: 'get_plant_error'
    });
    return [];
  }
};

const waterPlantByPlantId = async function(plant_id, time) {
  try {
    if (!plant_id || isNaN(parseInt(plant_id)) || parseInt(plant_id) <= 0) {
      throw new Error('Некорректный ID растения');
    }
    
    if (!time || isNaN(parseInt(time))) {
      throw new Error('Некорректное время полива');
    }
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/plant/water?plantid=${parseInt(plant_id)}&time=${parseInt(time)}`, {
      method: 'PUT',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logError(new Error('Ошибка полива растения'), {
        operation: 'water_plant_by_id',
        plant_id: plant_id,
        errorData: errorData,
        context: 'api_response_error'
      });
      return false;
    }
    
    return true;
  } catch (err) {
    logError(err, {
      operation: 'water_plant_by_id',
      plant_id: plant_id,
      context: 'water_plant_by_id_error'
    });
    return false;
  }
};

const waterPlantByUserId = async function(user_id, time) {
  try {
    if (!user_id || isNaN(parseInt(user_id)) || parseInt(user_id) <= 0) {
      throw new Error('Некорректный ID пользователя');
    }
    
    if (!time || isNaN(parseInt(time))) {
      throw new Error('Некорректное время полива');
    }
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/plant/waterall?userid=${parseInt(user_id)}&time=${parseInt(time)}`, {
      method: 'PUT',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logError(new Error('Ошибка полива всех растений'), {
        operation: 'water_plant_by_user_id',
        user_id: user_id,
        errorData: errorData,
        context: 'api_response_error'
      });
      return false;
    }
    
    return true;
  } catch (err) {
    logError(err, {
      operation: 'water_plant_by_user_id',
      user_id: user_id,
      context: 'water_plant_by_user_id_error'
    });
    return false;
  }
};

const updateFrequency = async function(plant_id, new_frequency) {
  try {
    if (!plant_id || isNaN(parseInt(plant_id)) || parseInt(plant_id) <= 0) {
      throw new Error('Некорректный ID растения');
    }
    
    if (!new_frequency || isNaN(parseFloat(new_frequency)) || parseFloat(new_frequency) <= 0) {
      throw new Error('Некорректная частота полива');
    }
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/plant/updfreq?plantid=${parseInt(plant_id)}&newfreq=${parseFloat(new_frequency)}`, {
      method: 'PUT',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logError(new Error('Ошибка обновления частоты полива'), {
        operation: 'update_frequency',
        plant_id: plant_id,
        new_frequency: new_frequency,
        errorData: errorData,
        context: 'api_response_error'
      });
      return false;
    }
    
    return true;
  } catch (err) {
    logError(err, {
      operation: 'update_frequency',
      plant_id: plant_id,
      new_frequency: new_frequency,
      context: 'update_frequency_error'
    });
    return false;
  }
};

const deletePlant = async function(plant_id) {
  try {
    if (!plant_id || isNaN(parseInt(plant_id)) || parseInt(plant_id) <= 0) {
      throw new Error('Некорректный ID растения');
    }
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/plant/delete?plantid=${parseInt(plant_id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logError(new Error('Ошибка удаления растения'), {
        operation: 'delete_plant',
        plant_id: plant_id,
        errorData: errorData,
        context: 'api_response_error'
      });
      return false;
    }
    
    return true;
  } catch (err) {
    logError(err, {
      operation: 'delete_plant',
      plant_id: plant_id,
      context: 'delete_plant_error'
    });
    return false;
  }
};

const updStatus = async function(plant_id) {
  try {
    if (!plant_id || isNaN(parseInt(plant_id)) || parseInt(plant_id) <= 0) {
      throw new Error('Некорректный ID растения');
    }
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/plant/updstatus?plantid=${parseInt(plant_id)}`, {
      method: 'PUT',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logError(new Error('Ошибка обновления статуса растения'), {
        operation: 'upd_status',
        plant_id: plant_id,
        errorData: errorData,
        context: 'api_response_error'
      });
      return false;
    }
    
    return true;
  } catch (err) {
    logError(err, {
      operation: 'upd_status',
      plant_id: plant_id,
      context: 'upd_status_error'
    });
    return false;
  }
};

export {
  addUser,
  getUserId,
  getActiveUsers,
  deactivateUser,
  addPlant,
  getPlants,
  getPlant,
  waterPlantByPlantId,
  waterPlantByUserId,
  updateFrequency,
  deletePlant,
  updStatus
};
