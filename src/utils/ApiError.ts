class ApiError extends Error {
  statusCode: number;
  errors: string[];
  stack?: string;

  constructor(
    statusCode: number,
    message: string,
    errors: string[] = [],
    stack: string = ''
  ) {
    super(message);

    this.statusCode = statusCode;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
