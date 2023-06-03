const express = require('express')
const router = express.Router({ mergeParams: true })

const Mentor = require('../models/Mentor')
const Student = require('../models/Student')
const Semester = require('../models/Semester')
const Meeting = require('../models/Meeting')
const { compile } = require('joi')

//Student Pages and Functionalities

//Student Details page
router.get('/', async (req, res) => {
    const { id } = req.params
    const student = await Student.findById(id)
    res.render('student/studentHome', { student })
})

//Student's Mentor Details page
router.get('/mentor', async (req, res) => {
    const { id } = req.params
    const student = await Student.findById(id)

    if (student.mentor == null) {
        req.flash('error', 'Student is not assigned any mentor')
        res.redirect(`/mentorship/student/${student._id}`)
    }
    else {
        const mentor = await Mentor.findById(student.mentor).populate('mentees')
        res.render('student/mentor', { student, mentor })
    }
})

//student each semester detail
router.get('/semester/:sem', async (req, res) => {
    const { id, sem } = req.params
    const student = await Student.findById(id)
    res.render('student/performance', { student, sem })

})

//register the subjects you want for the semester you want
router.get('/addSubjects', async (req, res) => {
    const { id } = req.params
    const student = await Student.findById(id)
    const { currentSemester, program, department } = student
    const semester = await Semester.findOne({ 'semNo': currentSemester, 'program': program, 'department': department })
    res.render('student/regSub', { student, semester })
})
//to get the subjects in a semester and the subjects studenta have
router.get('/addSubjects/:semId', async (req, res) => {
    const { id, semId } = req.params
    const student = await Student.findById(id)
    const semester = await Semester.findById(semId)
    res.render('student/regSub', { student, semester })
})

//to get the courses available in a semester
router.post('/addSubjects', async (req, res) => {
    const { id } = req.params
    const student = await Student.findById(id)
    const { program, department } = student
    const { sem } = req.body
    const semester = await Semester.findOne({ 'semNo': sem, 'program': program, 'department': department })
    res.redirect(`/mentorship/student/${id}/addSubjects/${semester._id}`)

})

//to add subjects to the student
router.post('/addSubjects/:semId/:subId', async (req, res) => {
    const { id, semId, subId } = req.params
    const student = await Student.findById(id)
    const semester = await Semester.findById(semId)
    let sub = null
    let flag = 0;

    for (var subject of semester.subjects) {
        if (subject._id == subId) {
            sub = subject

            break;
        }
    }

    for (let sb of student.subjects) {
        if (sb.subCode == sub.subcode) {
            flag = 1

        }
    }

    if (flag == 1) {
        req.flash('error', 'Already added!')
    }
    else {
        student.subjects.push(
            {
                'semNo': semester.semNo,
                'subName': sub.subName,
                'subCode': sub.subcode,
                'credit': sub.credit,
                'labCredit': sub.labCredit,
                'courseType': sub.courseType
            })
        student.save()
        req.flash('success', 'Added Successfully')
    }
    res.redirect(`/mentorship/student/${id}/addSubjects/${semId}`)



})


//remove course from registered courses
router.delete('/addSubjects/:semId/:subId', async (req, res) => {
    const { id, semId, subId } = req.params
    await Student.findByIdAndUpdate(id, { $pull: { subjects: { _id: subId } } })
    req.flash('success', 'Course Removed!')
    res.redirect(`/mentorship/student/${id}/addSubjects/${semId}`)
})



// to add marks to your subject
router.put('/addSubjects/:semId/:subId', async (req, res) => {
    const { id, semId, subId } = req.params
    const marks = req.body.marks
    console.log(marks);
    const sem = await Semester.findById(semId)
    const student = await Student.findById(id)
    for (var subject of student.subjects) {
        if (subId == subject._id) {

            subject.sess1 = marks.sess1
            subject.sess2 = marks.sess2
            subject.midterm = marks.midterm
            subject.endterm = marks.endterm
            subject.grade = marks.grade
            await student.save()
            console.log(subject);
            break;
        }

    }
    req.flash('success', 'Changes Saved!')
    res.redirect(`/mentorship/student/${student._id}/addSubjects/${sem._id}`)



})


//to add attendance
router.post('/addSubjects/:subId', async (req, res) => {
    const { id, subId } = req.params
    const student = await Student.findById(id)
    var { total, attended } = req.body.attend
    total = Number(total)
    attended = Number(attended)
    const attendPercent = ((attended / total) * 100).toFixed(2)
    var sem = null

    for (let subject of student.subjects) {
        if (subject._id == subId) {
            subject.attendancePercent = attendPercent
            sem = subject.semNo
            student.save()
            break
        }
    }

    const semester = await Semester.findOne({ $and: [{ 'semNo': sem }, { 'program': student.program }] })
    res.redirect(`/mentorship/student/${student._id}/addSubjects/${semester._id}`)

})

//see the messages given by the mentor
router.get('/meetings', async (req, res) => {
    const { id } = req.params
    const student = await Student.findById(id)
    const meetings = await Meeting.find({ 'mentee': id })
    res.render('student/meetings', { student, meetings })
})

//filter meetings
router.post('/meetings', async (req, res) => {
    const { id } = req.params
    const filter = req.body.filter
    const student = await Student.findById(id)
    var meetings = null
    if (filter.completed == 'All') {
        meetings = await Meeting.find({ 'mentee': id })

    } else {
        meetings = await Meeting.find({ 'mentee': id, 'completed': filter.completed })
    }

    res.render('student/meetings', { student, meetings })

})

//finish a meeting
router.put('/meetings/:meetId', async (req, res) => {
    const { id, meetId } = req.params
    const student = await Student.findById(id)
    const minutesOfMeeting = req.body.minutesOfMeeting
    const meeting = await Meeting.findByIdAndUpdate(meetId, { minutesOfMeeting: minutesOfMeeting, completed: true })
    meeting.save()
    req.flash('success', 'Meeting Completed')
    res.redirect(`/mentorship/student/${id}/meetings`)

})

module.exports = router
