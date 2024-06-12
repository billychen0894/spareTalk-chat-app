import { BaseError } from './baseError';

export class ConnectionError extends BaseError {
  constructor(
    public message: string,
    public details?: any,
  ) {
    super(message, 500, details);
    this.name = this.constructor.name;
  }
}

export class RedisError extends BaseError {
  constructor(
    public message: string,
    public details?: any,
  ) {
    super(message, 500, details);
    this.name = this.constructor.name;
  }
}

export class ResourceNotFoundError extends BaseError {
  constructor(
    public message: string,
    public details?: any,
  ) {
    super(message, 404, details);
    this.name = this.constructor.name;
  }
}
