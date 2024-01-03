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

const checkUser = async function(user_name) {
  try {
    const response = await fetch(`http://${process.env.DB_HOST}:${process.env.DB_PORT}/check/${user_name}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log(result.exists ? 'User exists' : 'User does not exist');
    } else {
      console.log('Failed to check user existence. Status:', response.status);
    }
  } catch (err) {
    console.error('Error checking user existence:', err);
  }
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
    console.log(response);
  } catch(err) {
    console.log(err);
  }
} 

export { addFlower, addUser, checkUser }
