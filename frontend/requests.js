import fetch from "node-fetch";
import dns from 'node:dns';
import * as dotenv from 'dotenv'
import { log } from 'node:console';
dotenv.config()
dns.setDefaultResultOrder('ipv4first');

const addUser = async function(user_name) {
  try {
    const response = await fetch(`http://${process.env.DB_HOST}:${process.env.DB_PORT}/user/add`, {
      method: 'POST', 
      credentials: 'include',
      headers: {
       'Content-Type': 'application/json',
       },
       body: JSON.stringify({ 
        user_name
      })
    })
    return response.ok
  } catch (err) {
    console.error(err);
  }
  return false
}

const getUserId = async function(user_name) {
  let userId = -1
  try {
    const response = await fetch(`http://${process.env.DB_HOST}:${process.env.DB_PORT}/user/getuser?username=${user_name}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      let data = await response.json()
      userId = data.user_id
    } else {
      const errMsg = await response.json().error;
      console.log(errMsg);
    }
  } catch (err) {
    console.error('Unknown error', err);
  }
  return userId
};

const addPlant = async function({user_id, plant_name, watering_frequency, last_watered, is_fine}) {
  try {
    const response = await fetch(`http://${process.env.DB_HOST}:${process.env.DB_PORT}/plant/add`, {
      method: 'POST', 
      credentials: 'include',
      headers: {
       'Content-Type': 'application/json',
       },
       body: JSON.stringify({ 
        user_id,
        plant_name,
        watering_frequency,
        last_watered,
        is_fine
      })
    })
    return response.ok
  } catch (err) {
    console.error(err);
  }
  return false
} 

const getPlants = async function(user_id) {
  let data = []
  try {
    const response = await fetch(`http://${process.env.DB_HOST}:${process.env.DB_PORT}/plant/getplants?userid=${user_id}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      data = await response.json()
    } else {
      const errMsg = await response.json().error;
      console.log(errMsg);
    }
  } catch(err) {
    console.error(err);
  }
  return data;
}

const waterPlantByPlantId = async function(plantId, waterTime) {
  try {
    const response = await fetch(`http://${process.env.DB_HOST}:${process.env.DB_PORT}/plant/water?plantid=${plantId}&time=${waterTime}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })  
  return response.ok
  } catch(err) {
    console.log(err);
  }
  return false
}

const getPlant = async function(plant_id, plant_name) {
  let url;
  let data = '';
  if (!plant_id && !plant_name) {
    return data;
  }
  try {
    if (plant_id) {
      url = `http://${process.env.DB_HOST}:${process.env.DB_PORT}/plant/getplant?id=${plant_id}`;
    } else {
      url = `http://${process.env.DB_HOST}:${process.env.DB_PORT}/plant/getplant?name=${plant_name}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      data = await response.json();
    } else {
      const errMsg = await response.json().error;
      console.log(errMsg);
    }
  } catch(err) {
    console.log(err);
  }
  return data;
}


const waterPlantByUserId = async function(userId, waterTime) {
  try {
    const response = await fetch(`http://${process.env.DB_HOST}:${process.env.DB_PORT}/plant/waterall?userid=${userId}&time=${waterTime}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })  
  return response.ok
  } catch(err) {
    console.log(err);
  }
  return false
  
}

const updateFrequency = async function(plantId, newFreq) {
  try {
    const response = await fetch(`http://${process.env.DB_HOST}:${process.env.DB_PORT}/plant/updfreq?plantid=${plantId}&newfreq=${newFreq}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })  
  return response.ok
  } catch(err) {
    console.log(err);
  }
  return false
}

const deletePlant = async function(plantId) {
  try {
    const response = await fetch(`http://${process.env.DB_HOST}:${process.env.DB_PORT}/plant/delete?plantid=${plantId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }) 
    return response.ok 
  } catch(err) {
    console.log(err);
  }
  return false
}

const updStatus = async function(plantId) {
  try {
    const response = await fetch(`http://${process.env.DB_HOST}:${process.env.DB_PORT}/plant/updstatus?plantid=${plantId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })  
  return response.ok
  } catch(err) {
    console.log(err);
  }
  return false
}

const setIntId = async function(user_id, interval) {
  try {
    const response = await fetch(`http://${process.env.DB_HOST}:${process.env.DB_PORT}/user/updint?userid=${user_id}&interval=${interval}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })  
  return response.ok
  } catch(err) {
    console.log(err);
  }
  return false
}


export { addUser, addPlant, getUserId, getPlants, getPlant, updateFrequency, waterPlantByPlantId, waterPlantByUserId, deletePlant, updStatus, setIntId }
