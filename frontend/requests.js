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


const addFlower = async function({user_id, flower_name, watering_frequency}) {
  try {
    const response = await fetch(`http://${process.env.DB_HOST}:${process.env.DB_PORT}/flower/add`, {
      method: 'POST', 
      credentials: 'include',
      headers: {
       'Content-Type': 'application/json',
       },
       body: JSON.stringify({ 
        user_id,
        flower_name,
        watering_frequency
      })
    })
    return response.ok
  } catch (err) {
    console.error(err);
  }
  return false
} 

const getFlowers = async function() {
  console.log('hello from getFlowers');
  return ['Цветок 1', 'Цветок 2', 'Цветок 3', 'Цветок 4', 'Цветок 5', 'Цветок 6', 'Цветок 7', 'Цветок 8', 'Цветок 9', 'Цветок 10'];
}

const updateFrequency = async function() {
  console.log('hello from updateFrequency');

}
const deleteFlower = async function() {
  console.log('hello from deleteFlower');

}
const updShedule = async function() {
  console.log('hello from updShedule');

}
const getTodaysWateringList = async function() {
  console.log('hello from getTodaysWateringList');

}

const disableReminder = async function() {
  console.log('hello from disableReminder');

}


export { addUser, addFlower, getUserId, getFlowers, updateFrequency, deleteFlower, disableReminder, updShedule, getTodaysWateringList  }
