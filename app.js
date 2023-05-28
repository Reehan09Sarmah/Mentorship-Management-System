const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const ejsMate = require('ejs-mate')
const methodOverride = require('method-override')
const catchAsync = require('./utils/catchAsync')
const ExpressError = require('./utils/ExpressError')
const session = require('express-session')
const flash = require('connect-flash')
const nodemailer = require('nodemailer')
const { google } = require('googleapis')
require('dotenv').config()

const app = express()

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))


app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method')) // to disguise methods like put or patch with post as post is allowed in form method
app.use(express.static(path.join(__dirname, 'public')))



//MongoDB Connection
mongoose.connect('mongodb://localhost:27017/MentorshipSystem', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection
db.on("error", console.error.bind(console, "connection error:"))
db.once("open", () => {
    console.log("Database Connected!")
})


//for flash messages
const sessionConfig = {
    secret: 'thisisasecret',
    //below 2 are to remove deprecation warnings
    resave: false,
    saveUninitialized: true,
    //More options
    cookie: {
        httpOnly: true,//so that client-side script cannot access the cookie(if browser supports)
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,//session xpires by the week
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig))
app.use(flash())

app.use((req, res, next) => {
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    next()
})
//flash messages end



//Setting up for sending emails
const CLIENT_ID = process.env.clientID
const CLIENT_SECRET = process.env.clientSecret
const REDIRECT_URI = process.env.redirectUri
const REFRESH_TOKEN = process.env.refreshToken


const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
async function sendMail(sender, receiver, topic, message) {
    try {
        const accessToken = await oAuth2Client.getAccessToken();

        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: 'reehansarmah8473@gmail.com', //authorised with OAuth2
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken,
            },
        });

        const mailOptions = {
            from: `${sender} <reehansarmah8473@gmail.com>`, //if authorised with OAuth2, then can send mail only
            to: receiver,
            subject: 'Meeting with Mentor',
            text: message,
            html: `<h3>Discussion: ${topic}</h3>
                    <h4>${message}</h4>`,
        };

        const result = await transport.sendMail(mailOptions);
        return result;
    } catch (error) {
        return error;
    }
}

module.exports = { sendMail }


//import routers
const registerRoutes = require('./routes/registerRoutes')
const adminRoutes = require('./routes/adminRoutes')
const studentRoutes = require('./routes/studentRoutes')
const mentorRoutes = require('./routes/mentorRoutes')







//login page
app.get('/mentorship/login', (req, res) => {
    res.render('login/login')
})


//use routers --> route handlers are in Routes folder
app.use('/mentorship', registerRoutes)
app.use('/mentorship/admin', adminRoutes)
app.use('/mentorship/student/:id', studentRoutes)
app.use('/mentorship/mentor/:id', mentorRoutes)




//for handling routes that doesn't exist
app.all('*', (req, res, next) => {
    next(new ExpressError('Page not Found: 404', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err
    if (!err.message) err.message = 'Oh No! Something went wrong!'
    res.status(statusCode).render('Error', { err })
})

app.listen(3000, () => {
    console.log('Listening on port 3000');
})
