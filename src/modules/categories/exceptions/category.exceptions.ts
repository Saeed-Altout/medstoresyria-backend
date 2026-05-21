import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';

export class CategoryNotFoundException extends AppException {
  constructor() {
    super('CATEGORY_NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}

export class CategorySlugExistsException extends AppException {
  constructor() {
    super('CATEGORY_SLUG_EXISTS', HttpStatus.CONFLICT);
  }
}

export class ParentCategoryNotFoundException extends AppException {
  constructor() {
    super('CATEGORY_PARENT_NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}
