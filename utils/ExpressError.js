// A custom error class that inherits Error class of js. We use it to handler errors on our terms4

class ExpressError extends Error {

    constructor(message, statusCode) {
        super()
        this.message = message
        this.statusCode = statusCode
    }
}

module.exports = ExpressError
