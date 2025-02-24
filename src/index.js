import dotenv from 'dotenv';
import connectDB from './db/Mongodb.js';
import {connectPgdb, testConnection} from './db/postgres.js';
import { app } from './app.js';
dotenv.config({
    path:'./env'
});
import { sequelize } from './db/postgres.js';
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
        sequelize.sync({force : false}).then(()=>{
            console.log("All models are synchronized with database");
        });
        const PORT = process.env.PORT || 8000;
        app.listen(PORT , () =>{
            console.log("Server is running on port", PORT);
        });
    }
    catch(error){
        console.log("Database connection failed, Error while starting server", error);
        process.exit(1);
    }
}

app.get('/', (req, res) => {
    res.send("Welcome to the homepage!");
});

startServer();