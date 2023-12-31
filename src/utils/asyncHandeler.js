const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(res, req, next)).catch((e) => next(e))
    }
}


export { asyncHandler };