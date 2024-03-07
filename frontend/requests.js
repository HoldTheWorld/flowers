import fetch from "node-fetch";
import dns from 'node:dns';
import * as dotenv from 'dotenv'
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

const getPlants = async function(user_id, exceptions) {
  let data = []
  try {
    const response = await fetch(`http://${process.env.DB_HOST}:${process.env.DB_PORT}/plant/getplants?userid=${user_id}&exceptions=${exceptions.join(',')}`, {
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

const updateFrequency = async function() {
  console.log('hello from updateFrequency');

}

const deletePlant = async function() {
  console.log('hello from deleteFlower');

}
const updShedule = async function() {
  console.log('hello from updShedule');

}
const getTodaysWateringList = async function() {
  console.log('hello from getTodaysWateringList');

}




export { addUser, addPlant, getUserId, getPlants, updateFrequency, waterPlantByPlantId, waterPlantByUserId, deletePlant, updShedule, getTodaysWateringList  }
