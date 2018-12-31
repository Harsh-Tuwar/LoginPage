const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const clientSession = require('client-sessions');
const Sequelize = require('sequelize');

const HTTP_PORT = process.env.PORT || 8080;


//connecting the database
var sequelize = new Sequelize('d1o992bq6j1rgr', 'snmqextqqlhfsl', '57968a6cdca59a8a22975c0d02cec63fb7100a5c7fd75fdc51e2376d47c0df98', {
    host: 'ec2-54-235-178-189.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: '5432',
    dialectOptions: {
        ssl: true
    }
});

sequelize.authenticate().then(function(){
    console.log("Connectio has been established sucessfully");
}).catch(function(err){
    console.log("Unable to connect to the database: " ,err);
});


//creating the table for storing the information of the students 
const User = sequelize.define("User", {
    fName: Sequelize.STRING,
    lName: Sequelize.STRING,
    userName: Sequelize.STRING,
    pass: Sequelize.TEXT,
    occupation: Sequelize.STRING,
    age: Sequelize.INTEGER
});

app.use(bodyParser.urlencoded({ extended: true }));


//creating middleware to set up the client-sessions
app.engine(".hbs", exphbs({ extname: ".hbs" }));
app.set("view engine", ".hbs");


//setting up the static folder for extra files
app.use(express.static("static"));

//setting up the client-session
app.use(clientSession({
    cookieName: "session",
    secret: "cookie-practice",
    //setting up the time for the session
    duration: 2*60*1000,// 120,000 ms i.e 2 min 
    activeDuration: 100*60
}))

app.use(bodyParser.urlencoded({extended:false}));

//coding the login route handler

function onHttpStartup(){
    console.log("Express server is listening on "+ HTTP_PORT);
}

//hardcoding the user for this purticular example
/* const user = { 
    username: "sampleuser",
    password: "samplepass",
    email: "email@sample.com" 
} */

//setting up the route for redirecting the user to the login page
app.get("/",function(req,res){
    res.redirect("/signup");
});

//setting up the route to show the signup page
app.get("/signup", function(req,res){
    User.create({
        fName: req.body.fName,
        lName: req.body.lName,
        userName: req.body.userName,
        pass: req.body.pass,
        occupation:req.body.occupation,
        age: req.body.age
    }).then(function(){
        console.log("User has been created successfully!!");
        res.redirect("/login");
    });
});

//setting the route to show the login page
app.get("/login", function(req,res){
    res.render("login",{ });
});

//now adding the user to the session if the creaditials are correct
app.post("/login", function(req,res){
    const username = req.body.userName;
    const password = req.body.pass;

    //check if the username or password field is empty or not
    if(username === "" && password === ""){
        return  res.render("login", {errorMsg: "Missing credentials"});
    }

    //check if the username and password are correct
    if(username === User.userName && password === User.pass){
        
        req.session.User = {
            username : User.userName,
            occupation: User.occupation
         }
         //if the password and username are correct, then redirect the user to the dashboard
         res.redirect("/dashboard");

    }//otherwise show the error msg
    else {
        res.render("login", {errorMsg: "Incorrect username or password"});
    }
});

//setting the route for the logout
//so when the user will logut, the session will be reseted and user will be redirected to the login page
app.get("/logout", function(req,res){
    req.session.reset();
    res.redirect("/login");
})

app.listen(HTTP_PORT, onHttpStartup);


//adding the middleware function to check for the authorization

app.get("/dashboard", ensureLogin, function(req,res){
    res.render("dashboard", {User: req.session.User});
});

function ensureLogin(req, res, next) {
    if (!req.session.User) {
      res.redirect("/login");
    } else {
      next();
    }
  }