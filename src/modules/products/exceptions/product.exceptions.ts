import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';

export class ProductNotFoundException extends AppException {
  constructor() {
    super('PRODUCT_NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}

export class ProductSlugExistsException extends AppException {
  constructor() {
    super('PRODUCT_SLUG_EXISTS', HttpStatus.CONFLICT);
  }
}
