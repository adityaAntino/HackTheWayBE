const mongoose = require('mongoose');
const config = require('./../env/config');
const env = require('dotenv');
env.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_STRING, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        });
        console.log('MongoDB Connected...')
    } catch (err) {
        console.error(err.message);
        //Exit process with failure.
        process.exit(1);
    }
};
module.exports = connectDB;

// This will be your local URL
//mongodb://localhost:27017/yourDBName