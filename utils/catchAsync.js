// A function that takes a function as an argument and returns a function. This function calls the argument function and catches error if any and pass it to next()
// We use it to replace writing try and catch in every route handler
// We basically pass the route handler function to it and if there is any error caught it passes it to the next().
// The next() invokes the error handling middleware that we have defined at the end

module.exports = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next)
    }
}
