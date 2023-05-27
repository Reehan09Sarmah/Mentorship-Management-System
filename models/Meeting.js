const { boolean } = require('joi')
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const meetingSchema = new Schema({
    mentor: {
        type: Schema.Types.ObjectId,
        ref: 'Mentor'
    },
    mentee: {
        type: Schema.Types.ObjectId,
        ref: 'Student'
    },
    minutesOfMeeting: String,
    date: Date,
    completed: Boolean


})

module.exports = mongoose.model('Meeting', meetingSchema)
