import dotenv from 'dotenv';
import connectDB from './db/Mongodb.js';
import {connectPgdb, testConnection} from './db/postgres.js';
import { httpServer } from './app.js';
import logger from './logger/winston.logger.js'
// import {connect,client} from './db/redis.js'
import {firebase} from "./firebase/firebase_admin.js";
dotenv.config({
    path:'./env'
});

import { sequelize } from './models/chatapp/centeralized.models.js';

const startServer = async () => {
    try{
        // connect to mongodb
        await connectDB();
        console.log("MongoDB connection successfull");
        // connect to postgres
        await connectPgdb();
        console.log("Postgres connection successfull");
        //connect with sequilize to postgres
        await testConnection();
        console.log("Postgres connection successfull with sequelize");
        sequelize.sync({alter : true , force : false}).then(()=>{
            console.log("All models are synchronized with database");
        });
        httpServer.listen(process.env.PORT || 8000,()=>{
            logger.info(
                "Server is running on port: " + process.env.PORT
            )
        })
        // await connect();
        // client.set("test_key", "HomeComing", "EX", 10);
        // client.get("test_key").then((value) => {
        // console.log("Redis test key value:", value);});
        // console.log("Redis connection sucessfull");
    }
    catch(error){
        console.log("Database connection failed, Error while starting server", error);
        logger.error("Database connection failed, Error while starting server", error);
        process.exit(1);
    }
}

// app.get('/', (req, res) => {
//     res.send("Welcome to the homepage!");
// });

startServer();