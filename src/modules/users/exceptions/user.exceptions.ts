import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';

export class UserNotFoundException extends AppException {
  constructor() {
    super('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}
