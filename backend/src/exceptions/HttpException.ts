export class HTTPException extends Error {
  constructor(
    public status: number = 500,
    public message: string,
    public details?: any,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
