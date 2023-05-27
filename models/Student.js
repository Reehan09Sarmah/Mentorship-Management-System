const mongoose = require('mongoose')
const Schema = mongoose.Schema

const studentSchema = new Schema({
    name: String,
    email: String,
    department: String,
    password: String,
    rollno: String,
    cgpa: Number,
    currentSemester: Number,
    mentor: {
        type: Schema.Types.ObjectId,
        ref: 'Mentor'
    },
    subjects: [
        {
            semNo: Number,
            subName: String,
            credit: Number,
            labCredit: Number,
            courseType: String,
            subCode: String,
            sess1: Number,
            midterm: Number,
            sess2: Number,
            endterm: Number,
            grade: String,
            attendancePercent: Number
        }
    ],
    program: String,
    yearOfAdmission: Number
})

module.exports = mongoose.model('Student', studentSchema)
