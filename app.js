const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const ejsMate = require('ejs-mate')
const methodOverride = require('method-override')
const catchAsync = require('./utils/catchAsync')
const ExpressError = require('./utils/ExpressError')
const session = require('express-session')
const flash = require('connect-flash')

//Schemas
const Mentor = require('./models/Mentor')
const Student = require('./models/Student')
const Semester = require('./models/Semester')
const Meeting = require('./models/Meeting')



mongoose.connect('mongodb://localhost:27017/MentorshipSystem', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection
db.on("error", console.error.bind(console, "connection error:"))
db.once("open", () => {
    console.log("Database Connected!")
})

const app = express()

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))


app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method')) // to disguise methods like put or patch with post as post is allowed in form method
app.use(express.static(path.join(__dirname, 'public')))

//import routers
const registerRoutes = require('./routes/registerRoutes')
const adminRoutes = require('./routes/adminRoutes')
const studentRoutes = require('./routes/studentRoutes')




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





//login page
app.get('/mentorship/login', (req, res) => {
    res.render('login/login')
})


//use routers --> route handlers are in Routes folder
app.use('/mentorship', registerRoutes)
app.use('/mentorship/admin', adminRoutes)
app.use('/mentorship/student/:id', studentRoutes)

//Mentor Routes and Functionalities

//mentor home
app.get('/mentorship/mentor/:id', async (req, res) => {
    const { id } = req.params
    const mentor = await Mentor.findById(id)
    res.render('mentor/mentorHome', { mentor })
})

//mentees of the mentor
app.get('/mentorship/mentor/:id/mentees', async (req, res) => {
    const { id } = req.params
    const program = ''
    const mentor = await Mentor.findById(id).populate('mentees')
    var studentFilter = [] //using this as we need a filter to filter accordingly
    for (let mentee of mentor.mentees) {
        studentFilter.push(mentee)
    }
    res.render('mentor/mentees', { studentFilter, mentor, program })

})

//filter the mentees according to program
app.post('/mentorship/mentor/:id/mentees', async (req, res) => {
    const { id } = req.params
    const program = req.body.filter.program
    var studentFilter = []
    const mentor = await Mentor.findById(id).populate('mentees')
    if (program == 'All') {
        for (let mentee of mentor.mentees) {
            studentFilter.push(mentee)
        }
    }
    else {
        for (let mentee of mentor.mentees) {
            if (mentee.program == program) {
                studentFilter.push(mentee)
            }
        }
    }


    res.render('mentor/mentees', { studentFilter, mentor, program })

})

//mentee details
app.get('/mentorship/mentor/:id/mentees/:mId', async (req, res) => {
    const { id, mId } = req.params
    const mentor = await Mentor.findById(id)
    const student = await Student.findById(mId)
    res.render('mentor/mentee', { mentor, student })
})

//get the details of each semester
app.get('/mentorship/mentor/:id/mentees/:mId/:sem', async (req, res) => {
    const { id, mId, sem } = req.params
    const mentor = await Mentor.findById(id)
    const mentee = await Student.findById(mId)
    res.render('mentor/perform', { mentor, sem, mentee })
})






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
