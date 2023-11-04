const router = require('express').Router();
const passport = require('passport');
const genPassword = require('../lib/passwordUtils').genPassword;
const connection = require('../config/database')
const User = connection.models.User;
const posts=connection.models.posts;
const chats=connection.models.chats;
const isAuth=require('./authMiddleware').isAuth;
const isAdmin=require('./authMiddleware').isAdmin;
const axios=require("axios");
const { application } = require('express');
const { connect } = require('mongoose');

/**
 * -------------- POST ROUTES ----------------
 */

 // TODO
 router.post('/login',passport.authenticate('local', {
    successRedirect: '/posts',
    failureRedirect: '/login',
  }),(req,res,next)=>{
    console.log(req.user);
  });

 // TODO
 router.post('/register', (req, res, next) => {
    const saltHash=genPassword(req.body.password);
    const salt=saltHash.salt;
    const hash=saltHash.hash;
    const newUser= new User({
        username: req.body.username,
        hash: hash, 
        salt:salt,
        admin:false,
    });

   newUser.save()
    .then((user)=>{
        console.log(user);
    })
   
    res.redirect("/login");
 });

 router.post('/register-admin',(req,res,next)=>{
    const saltHash=genPassword(req.body.password);
    const salt=saltHash.salt;
    const hash=saltHash.hash;
    const newUser= new User({
        username: req.body.username,
        hash: hash, 
        salt:salt,
        admin:true,
    });

   newUser.save()
    .then((user)=>{
        console.log(user);
    })
  
    res.redirect("/login");
 })

 /**
 * -------------- GET ROUTES ----------------
 */

router.get('/', async(req, res, next) => {

    res.send('<h1>Home</h1><p>Please <a href="/register">register</a> ,<a href="/register-admin">register as admin</a>,<a href="/login">login</a> </p>');
   
    

});

// When you visit http://localhost:3000/login, you will see "Login Page"
router.get('/login',  (req, res, next) => {
   
    // const form = '<h1>Login Page</h1><form method="POST" action="/login">\
    // Enter Username:<br><input type="text" name="username">\
    // <br>Enter Password:<br><input type="password" name="password">\
    // <br><br><input type="submit" value="Submit"></form> <a href="/register">register</a>';
    // res.send(form);
    res.render("register_login.ejs",{
        type:"login"
    });
});

// When you visit http://localhost:3000/register, you will see "Register Page"
router.get('/register', (req, res, next) => {

    // const form = '<h1>Register Page</h1><form method="post" action="register">\
    //                 Enter Username:<br><input type="text" name="username">\
    //                 <br>Enter Password:<br><input type="password" name="password">\
    //                 <br><br><input type="submit" value="Submit"></form>';

    // res.send(form);
    res.render("register_login.ejs",{
        type:"register"
    });

});
router.get("/register-admin",(req,res,next)=>{
//     const form = '<h1>Register Page</h1><form method="post" action="register-admin">\
//     Enter Username:<br><input type="text" name="username">\
//     <br>Enter Password:<br><input type="password" name="password">\
//     <br><br><input type="submit" value="Submit"></form>';
// res.send(form);
    res.render("register_login.ejs",{
        type:"register-admin"
    })
})
/**
 * Lookup how to authenticate users on routes with Local Strategy
 * Google Search: "How to use Express Passport Local Strategy"
 * 
 * Also, look up what behaviour express session has without a maxage set
 */
router.get('/protected-route',isAuth, (req, res, next) => {
    
    // This is how you check if a user is authenticated and protect a route.  You could turn this into a custom middleware to make it less redundant
    // if (req.isAuthenticated()) {
    //     // if(req.session.passport.user property exist then user will be authenticated otherwise not)
    //     res.send('<h1>You are authenticated</h1><p><a href="/logout">Logout and reload</a></p>');
    // } else {
    //     res.send('<h1>You are not authenticated</h1><p><a href="/login">Login</a></p>');
    // }
});
router.get('/admin-route',isAdmin,(req,res,next)=>{

})

// Visiting this route logs the user out
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/login');
      });
});

router.get('/login-success', (req, res, next) => {
    res.send('<p>You successfully logged in. --> <a href="/protected-route">Go to protected route</a></p>');
});

router.get('/login-failure', (req, res, next) => {
    res.send('You entered the wrong password.');
});
// --------------------Blog Routes--------------------------------------

// get posts

router.get('/posts',isAuth,async(req,res,next)=>{
    try{
        // show only if user is authenticated
    const arr=await posts.find();
    
    res.render("index.ejs",{posts:arr,username:req.user.username});
    } catch(err){
        console.log(`error while getting posts`);
    }
})
// new post
router.get('/new',isAuth,async(req,res,next)=>{
    try{
        res.render("modify.ejs",{heading:"New Post",
        submit:"Create Post"});
    } catch(err){
        console.log(`error while creating new post`);
    }
})
// posting a new posting
router.post('/api/posts',isAuth,async(req,res)=>{
    try{
        let post=new posts({
            title: req.body.title,
            content: req.body.content,
            author: req.body.author,
            date: new Date(),
        })
        const result=await post.save();
        res.redirect("/posts");
    } catch(err){
        console.log(`error while posting a new post`);
        console.log(err);
    }
})
// delete a post with given id
router.get('/api/post/delete/:id',isAuth,async(req,res)=>{
    try{
        const result=await posts.deleteOne({_id:req.params.id});
        console.log(result);
        res.redirect("/posts");
    } catch(err){
        console.log(`error while deleting the post`);
    }
})
//edit a given post
router.get('/edit/:id',isAuth,async(req,res)=>{
    try{
        const post=await posts.findOne({_id:req.params.id});

        res.render("modify.ejs",{
            heading:"Edit",
            submit:"Submit",
            post:post,
        })
    } catch(err){
        console.log(`error while showing modify.ejs`);
    }
})
router.post('/api/posts/:id',isAuth,async(req,res)=>{
    try{
        const post=await posts.findOne({_id:req.params.id});
        let updatedPost={
            title:req.body.title||post.title,
            content:req.body.content||post.content,
            author:req.body.author||post.author,
            date:new Date(),
        }
        const result=await posts.updateOne({_id:req.params.id},{$set:updatedPost});
        console.log(result);
        res.redirect("/posts");
    } catch(err){
        console.log(`error while updating the post`);
    }
})
// ---------------------------chat routes----------------------

router.post("/send-request",isAuth, async(req,res)=>{
    // console.log(req.body.username);
    // console.log(req.user);
    await User.findOne({username:req.body.username})
    .then((user)=>{
        if(!user){
            console.log(`user doesn't exist`);
        }else{
            const USER_ID=user._id;
            // console.log(req.user);
            User.updateOne({_id:req.user._id},{$push:{"sent_req":{"id":user._id,"username":user.username}}})
             .then((ack)=>{
                console.log(ack);
             })
             .catch((err)=>{
                console.log(err);
             })
             User.updateOne({_id:user._id},{$push:{"pending_req":{"id":req.user._id,"username":req.user.username}}})
             .then((ack)=>{
                console.log(ack);
             })
             .catch((err)=>{
                console.log(err);
             })
             
        }
        res.redirect("/posts");
    })
    .catch((err)=>{
        console.log(`error while sending request`);
    })
})
router.get("/sent-requests",isAuth, async(req,res)=>{
    User.findOne({_id:req.user._id})
    .then((user)=>{
        res.render("requests.ejs",{
            type:"sent-requests",
            users:user.sent_req,
        })
    })
})
router.get("/pending-requests",isAuth,async(req,res)=>{
    User.findOne({_id:req.user._id})
    .then((user)=>{
        res.render("requests.ejs",{
            type:"pending-requests",
            users:user.pending_req,
        })
    })
})


router.get("/accept-request/:id",isAuth, async(req,res)=>{

    User.findOne({_id:req.params.id})
    .then((user)=>{

       User.updateOne({_id:req.user._id},{$push:{"friends":{"id":user._id,"username":user.username}}})
       .then((ack)=>{
        console.log(ack);
       })
 
       User.updateOne({_id:req.user._id},{$pull:{"pending_req":{"id":user._id,"username":user.username}}})
       .then((ack)=>{
        console.log(ack);
       })

       User.updateOne({_id:user._id},{$push:{"friends":{"id":req.user._id,"username":req.user.username}}})
       .then((ack)=>{
        console.log(ack);
       })
       User.updateOne({_id:user._id},{$pull:{"sent_req":{"id":req.user._id,"username":req.user.username}}})
       .then((ack)=>{
        console.log(ack);
       })
    })
    res.redirect("/posts");
})
router.get("/friends",isAuth,async(req,res)=>{
        res.render("requests.ejs",{
            type:"friends",
            users:req.user.friends,
        })
})

router.get("/chats",isAuth, async(req,res)=>{

    // show old chats and then input field
    res.render("requests.ejs",{
        type:"friends",
        users:req.user.friends,
        chat:"yes",
    })
})

// post route to send chat 
router.post("/send-chat/:id",isAuth,async(req,res)=>{
    console.log(req.body.chat_content);
    let id1=req.params.id, id2=req.user._id;
    let temp;
    if(id1>id2){
        temp=id1;
        id1=id2;
        id2=temp;
    }// id1 will contain lexicographically smaller id
  
    User.findOne({_id:id1})
    .then((user1)=>{
        User.findOne({_id:id2})
        .then((user2)=>{
            const filter={
                "user1":{"username":user1.username,_id:user1._id},
                "user2":{"username":user2.username,_id:user2._id},
            };
            const sender={
                "username":req.user.username,
                _id:req.user.id,
            };
            let d=new Date();
            const datetime=d.toLocaleDateString()+' , '+d.toLocaleTimeString();
            chats.updateOne(filter,{$push:{"messages":{"sender":sender,"content":req.body.chat_content,"time":datetime}}},{upsert:true})
            .then((ack)=>{
                console.log(ack);
            })
            .catch((err)=>{
                console.log(`error while updating chats`);
            })

        })
    })
    res.redirect(`/chats/${req.params.id}`);
   

})
//
router.get("/chats/:id",isAuth,async(req,res)=>{
        let id1=req.params.id,id2=req.user._id;
        if(id1>id2){
            let temp=id1;
            id1=id2;
            id2=temp;
        }
        const user1= await User.findOne({_id:id1});
        const user2= await User.findOne({_id:id2});
       
        const u1={"user1":{"username":user1.username,_id:user1._id}};
        const u2={"user2":{"username":user2.username,_id:user2._id}};
        let Chats=await chats.findOne({$and:[u1,u2]});
        if(Chats){
            Chats=Chats.messages;
        }
        res.render("chat_page.ejs",{id:req.params.id,Chats:Chats});
})

module.exports = router;