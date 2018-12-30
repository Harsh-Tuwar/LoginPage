const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const clientSession = require('client-sessions');

const HTTP_PORT = process.env.PORT || 8080;


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
const user = { 
    username: "sampleuser",
    password: "samplepass",
    email: "email@sample.com" 
}

//setting up the route for redirecting the user to the login page
app.get("/",function(req,res){
    res.redirect("/login");
});


//setting the route to show the login page
app.get("/login", function(req,res){
    res.render("login",{ });
});

//now adding the user to the session if the creaditials are correct
app.post("/login", function(req,res){
    const username = req.body.username;
    const password = req.body.password;

    //check if the username or password field is empty or not
    if(username === "" && password === ""){
        return  res.render("login", {errorMsg: "Missing credentials"});
    }

    //check if the username and password are correct
    if(username === user.username && password === user.password){
        
        req.session.user = {
            username : user.username,
            email: user.email
         }
         //if the password and username are correct, then redirect the user to the dashboard
         res.redircet("/dashboard");

    }//otherwise show the error msg
    else {
        res.render("/login", {errorMsg: "Incorrect username or password"});
    }
});

//setting the route for the logout
//so when the user will logut, the session will be reseted and user will be redirected to the login page
app.get("/logout", function(req,res){
    req.session.reset();
    res.redircet("/login");
})

app.listen(HTTP_PORT, onHttpStartup);


//adding the middleware function to check for the authorization

app.get("/dashboard", ensureLogin, function(req,res){
    res.render("dashboard", {user: req.session.user});
});

function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect("/login");
    } else {
      next();
    }
  }