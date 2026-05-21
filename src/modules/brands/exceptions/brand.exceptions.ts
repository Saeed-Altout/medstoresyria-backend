import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';

export class BrandNotFoundException extends AppException {
  constructor() {
    super('BRAND_NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}

export class BrandSlugExistsException extends AppException {
  constructor() {
    super('BRAND_SLUG_EXISTS', HttpStatus.CONFLICT);
  }
}
