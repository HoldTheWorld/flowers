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
    console.log(response.status ? 'ok' : 'Nok');

  } catch (err) {
    console.log(err);
  }
}


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

export { addFlower, addUser }
