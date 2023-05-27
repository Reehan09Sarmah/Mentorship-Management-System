const express = require('express')
const router = express.Router({ mergeParams: true })

const Mentor = require('../models/Mentor')
const Student = require('../models/Student')
const Semester = require('../models/Semester')


//Admin Home page
router.get('/', (req, res) => {
    res.render('admin/adminHome')
})

//Mentors List --- By Admin
router.get('/mentors', async (req, res) => {
    let mentors = await Mentor.find({})
    res.render('admin/mentors', { mentors })
})

//Students List --- by Admin
router.get('/students', async (req, res) => {
    let filter = {}
    let program = ''
    let studentFilter = await Student.find(filter)
    res.render('admin/students', { studentFilter, filter, program })
})

//student list -- filter by program & semester
router.post('/students', async (req, res) => {
    const filter = req.body.filter
    const program = filter.program
    var studentFilter = null
    if (filter.semester && filter.program) {
        studentFilter = await Student.find({ 'currentSemester': filter.semester, 'program': filter.program })
    }
    else if (filter.semester && !filter.program) {
        studentFilter = await Student.find({ 'currentSemester': filter.semester })
    }
    else if (!filter.semester && filter.program) {
        if (filter.program == 'All') {
            studentFilter = await Student.find({})
        }
        else {
            studentFilter = await Student.find({ 'program': filter.program })
        }
    }


    res.render('admin/students', { studentFilter, filter, program })
})

//Show one mentor's details -- By Admin
router.get('/mentors/:id', async (req, res) => {
    const { id } = req.params
    const mentor = await Mentor.findById(id).populate('mentees')
    res.render('admin/Mentor', { mentor })
})

//to check student details -- By Admin
router.get('/students/:id', async (req, res) => {
    const { id } = req.params
    const student = await Student.findById(id)
    res.render('admin/student', { student })
})

//delete student from database
router.delete('/students/:id', async (req, res) => {
    const { id } = req.params
    const student = await Student.findById(id)
    const mId = student.mentor
    await Student.findByIdAndDelete(id) //delete from student db
    await Mentor.findByIdAndUpdate(mId, { $pull: { mentees: id } }) //also delete the data from mentees list of mentor
    req.flash('success', 'Removed Student from the List!')
    res.redirect(`/mentorship/admin/students`)
})

//To add mentees to a mentor, load the students list -- by Admin
router.get('/mentors/:id/students', async (req, res) => {
    const { id } = req.params
    const mentor = await Mentor.findById(id)
    const students = await Student.find({})
    res.render('admin/addMentee', { mentor, students })
})

//to add student as a mentee to mentors list (also check if already present) -- by Admin
router.post('/mentors/:mId/students/:sId', async (req, res) => {
    const { mId, sId } = req.params
    const mentor = await Mentor.findById(mId)
    const student = await Student.findById(sId)

    if (mentor.mentees.includes(student._id)) {
        req.flash('error', 'Student already exits')

    }
    else {
        if (student.mentor) {
            req.flash('error', 'Student already has a mentor')
        }
        else {
            mentor.mentees.push(student)
            student.mentor = mentor
            await mentor.save()
            await student.save()
            req.flash('success', 'Successfully added the mentee!')
        }

    }

    res.redirect(`/mentorship/admin/mentors/${mentor._id}/students`)
})

//to remove a student from the mentee list of a mentor --- by Admin
router.delete('/mentors/:mId/students/:sId', async (req, res) => {
    const { mId, sId } = req.params
    await Mentor.findByIdAndUpdate(mId, { $pull: { mentees: sId } })
    await Student.findByIdAndUpdate(sId, { mentor: null })
    req.flash('success', 'Removed Student from the Mentee List!')
    res.redirect(`/mentorship/admin/mentors/${mId}`)
})

//to delete a mentor
router.delete('/mentors/:id', async (req, res) => {
    const { id } = req.params
    await Mentor.findByIdAndDelete(id)
    req.flash('success', 'Successfully deleted Mentor')
    res.redirect('/mentorship/admin/mentors')
})


//create a semester of a program --by admin
router.get('/addSemester', (req, res) => {
    res.render('admin/addSemester')
})

//to get the page to register subjects onto a semeter -- by admin
router.get('/addSemester/addSubjects/:id', async (req, res) => {
    const { id } = req.params
    const semester = await Semester.findById(id)
    res.render('admin/addsubjects', { semester })
})

//to create a semester document and then redirecting to the page where you can add subjects to it -- by admin
router.post('/addSemester/addSubjects', async (req, res) => {
    const { sem, department, program, edit } = req.body.semester
    const semCheck = await Semester.findOne({ $and: [{ 'semNo': sem }, { 'program': program }, { 'department': department }] })



    if (semCheck) {
        if (edit) {
            res.redirect(`/mentorship/admin/addSemester/addSubjects/${semCheck._id}`)
        } else {
            req.flash('error', 'Similar data already exists')
            res.redirect('/mentorship/admin/addSemester')
        }
    }
    else {
        var semester = new Semester({ semNo: sem, program: program, department: department })
        await semester.save()
        res.redirect(`/mentorship/admin/addSemester/addSubjects/${semester._id}`)
    }


})

//to add subjects and redirect to same page
router.post('/addSemester/addSubjects/:id', async (req, res) => {
    const { id } = req.params
    const subject = req.body.subject
    const semester = await Semester.findById(id)

    var flag = 0
    for (let sub of semester.subjects) {
        if (sub.subcode == (subject.subcode + " ")) {
            flag = 1;
            break;
        }
    }


    if (flag == 1) {
        req.flash('error', 'Course with the same code already exists')
    }
    else {
        semester.subjects.push(subject)
        semester.save()
    }
    res.redirect(`/mentorship/admin/addSemester/addSubjects/${semester._id}`)


})

//to delete the subjects from the semester -- by admin
router.delete('/addSemester/addSubjects/:id/:subId', async (req, res) => {
    const { id, subId } = req.params
    const semester = await Semester.findById(id)
    var subCode = '';
    for (let sub of semester.subjects) {
        if (sub._id == subId) {
            subCode = sub.subcode
            break
        }
    }
    //to delete from array in document: use $pull --> find the semester document id and from the subjects array, pull out the element whose id matches with subId
    await Semester.findByIdAndUpdate(id, { $pull: { subjects: { _id: subId } } })
    await Student.updateMany({ $pull: { subjects: { subCode: subCode } } }) //also delete from student database
    res.redirect(`/mentorship/admin/addSemester/addSubjects/${id}`)

})




module.exports = router
