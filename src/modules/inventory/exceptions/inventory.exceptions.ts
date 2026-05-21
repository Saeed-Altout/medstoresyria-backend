import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';

export class InsufficientStockException extends AppException {
  constructor(productName: string) {
    super('INSUFFICIENT_STOCK', HttpStatus.BAD_REQUEST, { product: productName });
  }
}
