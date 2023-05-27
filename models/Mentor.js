const mongoose = require('mongoose')
const Schema = mongoose.Schema

const MentorSchema = new Schema({
    name: String,
    email: String,
    department: String,
    mentees: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Student'
        }
    ],
    password: String
})

module.exports = mongoose.model('Mentor', MentorSchema)
