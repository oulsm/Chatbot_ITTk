//#region -------------------------------------------------------------Vairable init-------------------------------------------------------------

// Express base varirable init
const express = require('express');
const app = express();
const port = 3001;
const cors = require('cors');
const bodyParser = require('body-parser');
var comparer = require('./class_function/compareAI');
var reportapi = require('./class_function/reportApi');

// Express message varirable init
const flash = require('connect-flash');
const message = require('express-message');

// Express session/ passport varirable init
const uuid = require('uuid');
const apireq = require('request');
const https = require('https');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var expressValidator = require('express-validator');
var s = uuid.v4();

// Testing varirable init

//#endregion

//#region -------------------------------------------------------------Express app setup-------------------------------------------------------------
app.set('view engine', 'ejs');
app.use(express.urlencoded({
  extended:true
}));
app.use(cookieParser(s));
app.use(cors());
app.use(session({
  secret : s,
  resave : true,
  saveUninitialized : true,
  cookie: {maxAge:600000}
}));
app.use(flash());
app.use(function(req,res,next) {
  res.locals.message = message(req,res);
  res.locals.username = "tim";
  next();
});
app.use(bodyParser.json())
// Static files path init
app.use(express.static(__dirname + '/stylesheets'));
app.use(express.static(__dirname + '/font'));
app.use(express.static(__dirname + '/images'));
//#endregion

//#region -------------------------------------------------------------Firebase connection setup-------------------------------------------------------------
var dbControl = require('./class_function/dbControl.js');
var admin = require("firebase-admin");
var serviceAccount = require("./keys/test-firebase-ixxw-firebase-adminsdk-t7owz-57b1759de4.json");
try{
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
}catch(e){
  console.log("Connection to Firebase Unsuccessful");
}
var db = admin.firestore();
//#endregion


//#region -------------------------------------------------------------Express app application-------------------------------------------------------------
app.get('/', (req, res) => {
  res.render('index',{info: req.flash('info'),error: req.flash('error')})
});

//#region -------------------------------------------------------------CV form function-------------------------------------------------------------
app.get('/cvform', (req, res) => {
  let resumes = [];
  //username = req.signedCookies.username
  dbControl.getFromDB(db,"Resume","it",function(doc){
    if(doc.exists){
      resumes.push(doc.data())
      //console.log(resumes);
      res.render('cvform_user',{resume : resumes})
    } else {
      res.render('cvform',{resume : ''})
    }
  });
});

app.post('/submit-form', (req, res) => {
  //username = req.signedCookies.username

  dbControl.addResume(db,"ben",req)
  req.flash('info','Your resume is saved, go to "Start an new interview" to have your interview')
  res.redirect('/');
});

//#endregion

//#region -------------------------------------------------------------Create account and login/logout function-------------------------------------------------------------
/*
app.get('/login', (req, res) => {
  res.render('login',{error:req.flash('error')})
});

app.post('/login', (req,res)=>{
  username = req.body.username;
  dbControl.getFromDB(db,"Users",username,function(doc){
    if(doc.exists){
      res.cookie('username',req.body.username,{signed:true,maxAge:600000});
      req.flash('info','Login successful')
      res.redirect('/')
    } else {
      req.flash('error','Login unsuccessful, please check your username is correct')
      res.redirect('/login')
    }
  });
});

app.get('/logout', (req,res)=>{
  res.clearCookie('username');
  req.flash('info','Logout successful')
  res.redirect('/')
});

app.get('/create_account', (req,res) => {
  res.render('register')
});

app.post('/register',(req,res) => {
  dbControl.addUsers(db,req)
  req.flash('info','register successful, please login')
  res.redirect('/')
});
*/
//#endregion

// Interview function
app.get('/start_interview', (req, res) => {
  //username = req.signedCookies.username;
  dbControl.getFromDB(db,"Resume","tim", function(doc){
    if(doc.exists){
      res.render('job_des')
    } else {
      req.flash('error','You have not yet input your resume, please go to the "Your Resume" to update your resume')
      res.redirect('/')
    }
  });
});

app.get('/interview',(req,res) => {
    apireq("https://interviewsimulator.azurewebsites.net/start", (r) => {
        res.render('interview');
    });
});

// Job description post function

app.post('/post_jobdes', (req, res) => {
  //username = req.signedCookies.username;
  getName(req, function(name){
    dbControl.addJobdescription(db,name,req);
    getCVtojobReport(name, function(result){
        dbControl.addToDB(db,result,name,"CVtojobReport");
        res.redirect('/interview');
    });
  });
  
});

//#endregion

//#region -------------------------------------------------------------RESTFUL API function-------------------------------------------------------------

//#region -------------------------------------------------------------Complete non-change API-------------------------------------------------------------

// Get user
/*
app.get('/api/user', (req, res) => {
  username = req.signedCookies.username;
  if(username){
    res.send({username : username});
  } else {
    res.send("No user in this webpage");
  }
});
*/

// Get CV
app.get('/api/CV', (req,res) => {
  //username = req.params.user;
  dbControl.getFromDB(db,"Resume","tim", function(doc){
    if(doc.exists){
      res.send(doc.data());
    } else {
      res.send("doc not exsist");
    }
  });
});

app.get('/api/CV/:userdata/', (req,res) => {
  userdata = req.params.userdata;
  dbControl.getFromDB(db,"Resume",userdata, function(doc){
    if(doc.exists){     
      res.send(doc.data());
    } else {
      res.send("doc not exsist");
    }
    
  });
});

// Get Job description
app.get('/api/jobdes', (req,res) => {
  //username = req.params.user;
  dbControl.getFromDB(db,"Job","tim", function(doc){
    if(doc.exists){
      res.send(doc.data());
    } else {
      res.send("doc not exsist");
    }
  });
});

app.get('/api/jobdes/:userdata/', (req,res) => {
  userdata = req.params.userdata;
  dbControl.getFromDB(db,"Job",userdata, function(doc){
    if(doc.exists){        
      res.send(doc.data());
    } else {
      res.send("doc not exsist");
    }
  });
});

//#region Comparsion in separate fields
// Get JSON on comparsion of programming languages requirements
app.get('/api/compare/codelang', (req,res) => {
  //username = req.params.user;
  dbControl.getFromMulit(db,["Resume","Job"],"tim",function(docs){
    user = docs[0].data().Pro_language;
    job = docs[1].data().pro_language_req;
    comparer.compareArray(user,job,function(diff){
      res.send(diff);
    });
  });
});

// Get JSON on comparsion of languages requirements
app.get('/api/compare/lang', (req,res) => {
  //username = req.params.user;
  dbControl.getFromMulit(db,["Resume","Job"],"tim",function(docs){
    user = docs[0].data().language;
    job = docs[1].data().language_req;
    comparer.compareArray(user,job,function(diff){
      res.send(diff);
    });
  });
});
//#endregion

// Analysis of CV and job description
app.get('/api/analysis/CVtojob', (req,res) => {
  res.send("receive");
  getName(req, function(name){
    getCVtojobReport(name, function(result){
        dbControl.addToDB(db,result,name,"CVtojobReport");
        console.log("add to DB");
    });
  });
});

// Get JSON on analysis of CV and job description
app.get('/api/CVtojob', (req,res) => {
    getName(req, function(name){
        dbControl.getFromDB(db,"CVtojobReport",name,function(doc){
            if(doc.exists){
              res.send(doc.data());
            } else {
              res.send("doc not exsist");
            }
        });
    });
});

// Post JSON for analysis of introduction
app.post('/api/analysis/intro', (req,res) => {
    res.send("receive");
    getName(req, function(name){
        getIntroReport(req, name, function(result){
            dbControl.addToDB(db,result,name,"IntroReport");
            console.log("add to DB");
        });
    });
});

// Post JSON for analysis of introduction and return result
app.post('/api/analysis/intro/return', (req,res) => {
    getName(req, function(name){
        getIntroReport(req, name, function(result){
            dbControl.addToDB(db,result,name,"IntroReport");
            res.send(result);
        });
    });
});

// Get the question set back
app.get('/api/quesset', (req,res) =>{
    dbControl.getFromDB(db,"QuestionSet","tim",function(doc){
      if(doc.exists){
        res.send(doc.data());
      } else {
        res.send("doc not exsist");
      }
    });
});

// Post the question set to the database
app.post('/api/post/quesset', (req,res) => {
    var questionset = req.body;
    dbControl.addToDB(db,questionset,"tim","QuestionSet");
    res.send("receive");
});

//#endregion

// Post the answer of the user for analysis
app.post('/api/analysis/question/:key', (req,res) => {
  var key = req.params.key;
  var para = req.body;
  getName(req, function(name) {
    dbControl.getFromMulit(db,["CVtojobReport","QuestionAnalysis"],name,function(docs){
        comparer.analyQuestion(docs[0].data(), key, para, (r) => {
              res.send(r);
              if(docs[1].exists){
                  let add = docs[1].data();
                  let num = Object.keys(add).length;
                  add[num] = r;
                  dbControl.addToDB(db,add,name,"QuestionAnalysis");
              } else {
                  let add = {0:r};
                  dbControl.addToDB(db,add,name,"QuestionAnalysis");
              }
        });
    });
  });
});

// Get keywords from sentence
app.post('/api/getpara' , (req,res) => {
    var lines = req.body.lines;
    getParaWithSyno(lines, (result) => {
      res.send(result);
    });
});

// Set temp name
app.get('/api/setname/:name', (req, res) =>{
    var name = req.params.name;
    dbControl.addToDB(db,{"name": name},"name","SetName");
    res.send("Name set. Now change to " + name);
});

//#region -------------------------------------------------------------Interview Function-------------------------------------------------------------

// Post end interview request
app.post('/api/end/interview', (req,res) => {
  dbControl.addToDB(db,{},"tim","EndCall");
  res.send("EndCall added");
});

// Client check end of interview
app.get('/api/check/end', (req,res) => {
  dbControl.getFromDB(db,"EndCall","tim",function(doc){
    if(doc.exists){
      dbControl.removeFromDB(db,"EndCall","tim");
      res.send({state: 0});
    } else {
      res.send({state: 1});
    }
  });
});

//#endregion

//#endregion

//#region -------------------------------------------------------------Common Function-------------------------------------------------------------

// Create the analysis of CV and job description report
function getCVtojobReport(name, callback){
  dbControl.getFromMulit(db,["Resume","Job"],name,function(docs){
    comparer.analyCVtojob(docs[0].data(),docs[1].data(),function(result){
      callback(result);
    });
  });
};

// Create the analysis of introduction report
function getIntroReport(req, name ,callback){
  dbControl.getFromDB(db,"CVtojobReport",name,function(doc){
    comparer.analyIntro(doc.data(), req.body, function(result){
      callback(result);
    });  
  });
};

// Get the parameter and synonymes from the lines provided
function getParaWithSyno(lines, callback){

    var r = {};
    var i = 0;

    if(typeof(lines) == "string") {
        comparer.getParaWSyno(lines, (result) => {
            r = result;
            callback(r);
        });
    } else {
        lines.forEach(l => {
            comparer.getParaWSyno(l, (result) => {
                r[i] = result;
                i = i + 1;
                if(i == lines.length){
                    callback(r);
                }
            });
        });
    }
}

// Get the name from the database
function getName(req, callback){
    dbControl.getFromDB(db, "SetName", "name", function(doc){
        if(doc.exists){
            callback(doc.data().name);
        } else {
            callback("tim");
        }
    });
}

//#endregion

//#region -------------------------------------------------------------Non useful function-------------------------------------------------------------
app.get('/test', (req, res) => {
  res.render('test')
});
app.get('/test2', (req, res) => {
  let report = []
  //username = req.signedCookies.username
  dbControl.getFromMulit(db,["Resume","Job", "CVtojobReport","IntroReport","QuestionAnalysis"],"tim",function(docs){
    reportapi.analyintrotoreport(docs[0].data(),docs[1].data(), docs[2].data(), docs[3].data(),docs[4].data(),function(result){
      report.push(result);
      //console.log(report);
      //dbControl.addToDB(db,result,"tim","performanceReport");
      res.render('report2',{reports : report})
  }); 
  });
});

// test question
app.get('/ques', (req, res) => {
  res.render('question')
});
// report
app.get('/report', (req, res) => {
  res.render('report')

});

app.post('/post_ques', (req, res) => {
  dbControl.addQuestion(db,req)
  req.flash('info','Question add')
  res.redirect('/');
});
//#endregion

app.listen(port, (err) => {
  if (err) console.log(err)
  console.log(`Listening on http://localhost:${port}`)
});
