export class ServerError extends Error {
  public statusCode: number;
  public details: string[];

  constructor(message: string, statusCode: number = 500, details: string[] = []) {
    super(message);
    this.name = 'ServerError';
    this.statusCode = statusCode;
    this.details = details;
  }

  static db(message: string): ServerError {
    return new ServerError('Database error', 500, [message]);
  }

  static noRecordCreated(): ServerError {
    return new ServerError('Could not create record', 500);
  }

  static invalidCredentials(): ServerError {
    return new ServerError('Invalid login credentials', 401);
  }

  static badRequest(message: string, details: string[] = []): ServerError {
    return new ServerError(message, 400, details);
  }

  static internalServerError(message: string): ServerError {
    return new ServerError(`Internal server error: ${message}`, 500);
  }

  static notFound(message: string, details: string[] = []): ServerError {
    return new ServerError(message, 404, details);
  }

  toJSON() {
    return {
      error: {
        message: this.message,
        details: this.details
      },
      code: this.statusCode
    };
  }
}