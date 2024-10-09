const { error } = require('console');
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const app = express();
require('./bot/bot');

app.use(express.json());

async function dev() {
    try{
        await mongoose.connect(process.env.MONGO_URL, {})
        .then(() => { console.log('MongoDB start')})
        .catch((error) => console.log(error));
        app.listen(process.env.PORT||5005, () => {
            console.log(`Server ${process.env.PORT} - portda ishlamoqda`);
        })
    }catch(error) {
        console.log(error);
    }
}


dev();