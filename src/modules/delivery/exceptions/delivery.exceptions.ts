import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';

export class GovernorateNotFoundException extends AppException {
  constructor() {
    super('GOVERNORATE_NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}
