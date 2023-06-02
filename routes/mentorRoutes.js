const express = require('express')
const router = express.Router({ mergeParams: true })

const Mentor = require('../models/Mentor')
const Student = require('../models/Student')
const Semester = require('../models/Semester')
const Meeting = require('../models/Meeting')
const { sendMail } = require('../app')



//Mentor Routes and Functionalities

//mentor home
router.get('/', async (req, res) => {
    const { id } = req.params
    const mentor = await Mentor.findById(id)
    res.render('mentor/mentorHome', { mentor })
})

//mentees of the mentor
router.get('/mentees', async (req, res) => {
    const { id } = req.params
    const program = ''
    const meetings = await Meeting.find({ mentor: id })
    const mentor = await Mentor.findById(id).populate('mentees')
    let studentFilter = [] //using this as we need a filter to filter accordingly
    let meetingFilter = []// to get the meetings details related with the mentor
    for (let mentee of mentor.mentees) {
        studentFilter.push(mentee)
    }
    for (let meeting of meetings) {
        meetingFilter.push(meeting)
    }
    res.render('mentor/mentees', { studentFilter, meetingFilter, mentor, program })

})

//filter the mentees according to program
router.post('/mentees', async (req, res) => {
    const { id } = req.params
    const program = req.body.filter.program
    const meetings = await Meeting.find({ mentor: id })
    let meetingFilter = []// to get the meetings details related with the mentor

    let studentFilter = []
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

    for (let meeting of meetings) {
        meetingFilter.push(meeting)
    }


    res.render('mentor/mentees', { studentFilter, meetingFilter, mentor, program })

})

//mentee details
router.get('/mentees/:mId', async (req, res) => {
    const { id, mId } = req.params
    const mentor = await Mentor.findById(id)
    const student = await Student.findById(mId)
    res.render('mentor/mentee', { mentor, student })
})

//get the details of each semester
router.get('/mentees/:mId/:sem', async (req, res) => {
    const { id, mId, sem } = req.params
    const mentor = await Mentor.findById(id)
    const mentee = await Student.findById(mId)
    res.render('mentor/perform', { mentor, sem, mentee })
})

//to set meetings
router.post('/mentees/meeting/:stdId', async (req, res) => {
    const { id, stdId } = req.params
    const student = await Student.findById(stdId)
    const mentor = await Mentor.findById(id)
    const meet = req.body.meeting
    const meeting = new Meeting({ 'mentor': id, 'mentee': stdId, 'agenda': meet.agenda, 'date': meet.date, 'completed': false })
    meeting.save()


    const { hour, minute, day, month, year, amOrpm } = await dates(meeting.date) // from the function below
    let message = `Please meet me on ${day}-${month + 1}-${year} at ${hour}:${minute} ${amOrpm}.`

    //send mail to student -- use the send mail function
    sendMail(mentor.name, student.email, meeting.agenda, message)
        .then((result) => console.log('Email sent...', result))
        .catch((error) => console.log(error.message));



    req.flash('success', `Meeting set for ${student.name}`)
    res.redirect(`/mentorship/mentor/${id}/mentees`)


})

async function dates(theDate) {
    let date = new Date(theDate)
    let hours = date.getHours()
    let hour = date.getHours() % 12 || 12
    let minute = date.getMinutes()
    let day = date.getDate()
    let month = date.getMonth()
    let year = date.getFullYear()
    let amOrpm = hours >= 12 ? 'PM' : 'AM'

    return { hour, minute, day, month, year, amOrpm }
}

module.exports = router
