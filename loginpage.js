const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const exphbs = require('express-handlebars');
const clientSession = require('client-sessions');
const session = require('express-session');
var cookieParser = require('cookie-parser');

const HTTP_PORT = process.env.PORT || 8080;

function onHttpStart(){
    console.log("Express server is listening on "+ HTTP_PORT);
}

app.use(bodyParser.urlencoded({extended: true}));

app.engine(".hbs", exphbs({extname: ".hbs"}));
app.set("view engine", ".hbs");

//connecting with the database
var sequelize = new Sequelize('d1o992bq6j1rgr', 'snmqextqqlhfsl', '57968a6cdca59a8a22975c0d02cec63fb7100a5c7fd75fdc51e2376d47c0df98', {
    host: 'ec2-54-235-178-189.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: '5432',
    dialectOptions: {
        ssl: true
    }
});

//set up the model and its fields
var user = sequelize.define('users', {
    username:  {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    email:{
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    hooks: {
      beforeCreate: (user) => {
        const salt = bcrypt.genSaltSync();
        user.password = bcrypt.hashSync(user.password, salt);
      }
    },
    instanceMethods: {
      validPassword: function(password) {
        return bcrypt.compareSync(password, this.password);
      }
    }
});

//sync the table
sequelize.sync().then(function(){
    console.log("Table has been created successfully");
}).catch(function(err){
    console.log("This error occured", err);
});


//using cookie-parser middleware
app.use(cookieParser());


//using clientSession middleware
app.use(clientSession({
    cookieName: "session",
    secret: "cookie-practice",
    //setting up the time for the session
    duration: 2*60*1000,// 120,000 ms i.e 2 min 
    activeDuration: 100*60
}));

app.use(session({
    key: 'user_sid',
    secret: 'somerandomstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));

app.use(function(req,res,next){
    if(!req.session.user && !req.session.user_sid){
        res.clearCookie('user_sid')
    }
    next();
});

//use the middleware to check the logged in user
var sessionCheck = function(req,res,next){
    if(req.session.user){
        res.redirect('/dashboard');
    } else{
        next();
    }
};

//setting the route for the home-page
app.get('/', sessionCheck, function(req,res){
    res.redirect('/login');
});

//route for signup page
app.route('/signup').get(sessionCheck,function(req,res){
    res.sendFile(__dirname + '/public/signup.html');
}).post(function(req,res){
    user.create({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    }).then(function(user){
        req.session.user = user.dataValues;
        res.redirect('/dashboard');
    }).catch(function(err){
        res.redirect('/signup');
    });
});

//dashboard route
app.get('/dashboard', function(req,res){
    if(req.session.user && req.body.password){
        res.sendfile(__dirname + '/public/dashboard.html');
    }else {
        res.redirect('/login');
    }
});

//login route
app.route('/login').get(sessionCheck, function(req,res){
    res.sendFile(__dirname + '/public/login.html');
}).post(function(req,res){
    var username = req.body.username;
    var password = req.body.password;

    user.findOne({where: {username: username }}).then(function(user){
        if(!user){
            res.redirect('/login');
        } else if(!user.validPassword(password)){
            res.redirect('/login');
        } else{
            req.session.user = user.dataValues;
            res.redirect('/dashboard');
        }
    });
});

//logout route
app.get('/logout', function(req,res){
    if(req.session.user && req.cookies.user_sid){
        res.clearCookie('user_sid');
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

app.listen(HTTP_PORT,onHttpStart);



