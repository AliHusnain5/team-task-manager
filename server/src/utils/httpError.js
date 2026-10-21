// Error with an HTTP status. Services throw it; the error handler turns it into a response.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = HttpError;
