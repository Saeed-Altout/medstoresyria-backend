import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';

export class ReviewNotFoundException extends AppException {
  constructor() {
    super('REVIEW_NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}

export class ProductNotFoundForReviewException extends AppException {
  constructor() {
    super('PRODUCT_NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}
