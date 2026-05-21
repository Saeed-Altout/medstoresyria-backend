import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';

export class AttributeNotFoundException extends AppException {
  constructor() {
    super('ATTRIBUTE_NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}

export class AttributeKeyExistsException extends AppException {
  constructor() {
    super('ATTRIBUTE_KEY_EXISTS', HttpStatus.CONFLICT);
  }
}
