const mongoose = require('mongoose');

require('dotenv').config();

/**
 * -------------- DATABASE ----------------
 */

/*
 * Connect to MongoDB Server using the connection string in the `.env` file.  To implement this, place the following
 * string into the `.env` file
 * 
 * DB_STRING=mongodb://<user>:<password>@localhost:27017/database_name
 */ 

const conn = process.env.DB_STRING;

const connection = mongoose.createConnection(conn, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Creates simple schema for a User.  The hash and salt are derived from the user's given password when they register
const ObjectId=mongoose.Schema.ObjectId;
const UserSchema = new mongoose.Schema({
    username: {
        type:String,
        unique:true
    },
    hash: String,
    salt: String,
    admin:Boolean,
    friends:[{id:ObjectId,username:String}],
    sent_req:[{id:ObjectId,username:String}],
    pending_req:[{id:ObjectId,username:String}],
});
const PostSchma=new mongoose.Schema({
    title:String,
    content:String,
    author:String,
    date:Date,
});
const ChatSchema=new mongoose.Schema({
   user1:{ username:String,_id:ObjectId},
   user2:{ username:String,_id:ObjectId},
   messages:[{
        sender:{username:String,_id:ObjectId},
        content:String,
        time: String,
   }]
})
const User = connection.model('User', UserSchema);
const posts=connection.model('posts',PostSchma);
const chats=connection.model('chats',ChatSchema);
// Expose the connection
module.exports = connection