export type ErrorDetails = Record<string, unknown> | unknown[] | string | null;

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors: ErrorDetails;

  constructor(message: string, statusCode: number = 500, errors: ErrorDetails = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', errors: ErrorDetails = null) {
    super(message, 400, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', errors: ErrorDetails = null) {
    super(message, 401, errors);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', errors: ErrorDetails = null) {
    super(message, 403, errors);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', errors: ErrorDetails = null) {
    super(message, 404, errors);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', errors: ErrorDetails = null) {
    super(message, 409, errors);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation Error', errors: ErrorDetails = null) {
    super(message, 422, errors);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error', errors: ErrorDetails = null) {
    super(message, 500, errors);
  }
}
