const mongoose = require('mongoose')
const Schema = mongoose.Schema

const semesterSchema = new Schema({
    semNo: Number,
    program: String,
    department: String,
    subjects: [
        {
            subName: String,
            subcode: String,
            credit: Number,
            labCredit: Number,
            courseType: String
        }
    ]

})

module.exports = mongoose.model('Semester', semesterSchema)
