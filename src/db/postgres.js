import pg from 'pg';
import {DB_postgressName} from "../constants.js"
import { Sequelize, DataTypes } from 'sequelize';
const {Pool} = pg;
const pool = new Pool(
    {
        user: process.env.POSTGRES_USER,
        host: process.env.POSTGRES_HOST,
        database: DB_postgressName,
        password : process.env.POSTGRES_PASSWORD,
        port: process.env.POSTGRES_PORT,
    }
)

const connectPgdb = async() =>{
    try{
        const connectionInstance = await pool.connect();
        console.log('Connection is Established');
        connectionInstance.release();
    }
    catch(error){
        console.log("Postgres connection Failed: ", error);
        process.exit(1);
    }
}
// export const executeQuery = async (query,param) => {
//     try{
//         const result = await pool.query(query,param);
//         console.log("Query executed successfully");
//         return result.rows;
//     }
//     catch(error){
//         console.log("Error in the Database",error.message);
//         return null
//     }
// }

const sequelize = new Sequelize(DB_postgressName, process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, { host : process.env.POSTGRES_HOST,dialect: 'postgres',logging: false });
async function testConnection() {
    try {
      await sequelize.authenticate();
      console.log('Database connected successfully! with sequelize');
    } catch (error) {
      console.error('Unable to connect to the database with sequelize:', error);
    }
  }

export  {connectPgdb, testConnection}
export {pool,sequelize}