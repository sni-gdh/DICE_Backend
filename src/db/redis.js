import { createClient } from 'redis';

const client = createClient({
    username: `${process.env.REDIS_USERNAME}`,
    password: `${process.env.REDIS_PASSWORD}`,
    socket: {
        host: `${process.env.REDIS_HOST}`,
        port: `${process.env.REDIS_PORT}`
    }
});

client.on('error', err => console.log('Redis Client Error', err));

client.on("connect", () => {
    console.log("Connected to Redis successfully");
  });
const connect = async () =>{
    try {
        await client.connect();
    } catch (error) {
        console.log("Redis connection Failed: ", error);
        process.exit(1);
    }
}
export {client , connect}
