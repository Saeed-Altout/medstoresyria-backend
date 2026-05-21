import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';

export class InvalidCredentialsException extends AppException {
  constructor() {
    super('AUTH_INVALID_CREDENTIALS', HttpStatus.UNAUTHORIZED);
  }
}

export class EmailTakenException extends AppException {
  constructor() {
    super('AUTH_EMAIL_TAKEN', HttpStatus.CONFLICT);
  }
}

export class TokenExpiredException extends AppException {
  constructor() {
    super('AUTH_TOKEN_EXPIRED', HttpStatus.UNAUTHORIZED);
  }
}

export class RefreshInvalidException extends AppException {
  constructor() {
    super('AUTH_REFRESH_INVALID', HttpStatus.UNAUTHORIZED);
  }
}
