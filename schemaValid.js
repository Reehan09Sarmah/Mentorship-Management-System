//For validating the models data using a module called joi.
// we then define a middleware where we use this to validate data  coming through forms

const Joi = require('joi')
module.exports.mentorSchema = Joi.object({
    mentor: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().required(),
        department: Joi.string().required(),
        password: Joi.string().required()

    }).required()
})

const Joi = require('joi')


