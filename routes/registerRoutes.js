const express = require('express')
const router = express.Router({ mergeParams: true })

const Mentor = require('../models/Mentor')
const Student = require('../models/Student')

//Get the pages to Register as -- Admin, Mentor, Student
router.get('/regAdmin', (req, res) => {
    res.render('register/regAdmin')
})
router.get('/regMentor', (req, res) => {
    res.render('register/regMentor')
})
router.get('/regStudent', (req, res) => {
    res.render('register/regStudent')
})

//Post request to register as Admin, Mentor, Student
router.post('/regAdmin', async (req, res) => {
    console.log(req.body);
    const admin = new Admin(req.body.admin)
    await admin.save()
    req.flash('success', 'Admin Registered Successfully')
    res.redirect('/mentorship/login')
})

router.post('/regMentor', async (req, res) => {
    console.log(req.body);
    const mentor = new Mentor(req.body.mentor)
    await mentor.save()
    req.flash('success', 'Mentor Registered Successfully')
    res.redirect('/mentorship/login')
})

router.post('/regStudent', async (req, res) => {
    console.log(req.body);
    const { rollno } = req.body.student
    const stCheck = await Student.findOne({ 'rollno': rollno })
    if (stCheck) {
        req.flash('error', 'Student already exists')
        res.redirect('/mentorship/regStudent')
    }
    else {
        const student = new Student(req.body.student)
        await student.save()
        req.flash('success', 'Student Registered Successfully')
        res.redirect('/mentorship/login')
    }

})




module.exports = router
