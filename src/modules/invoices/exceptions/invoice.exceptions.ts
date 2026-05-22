import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';

export class InvoiceNotFoundException extends AppException {
  constructor() {
    super('INVOICE_NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}

export class InvoiceAlreadyExistsException extends AppException {
  constructor() {
    super('INVOICE_ALREADY_EXISTS', HttpStatus.CONFLICT);
  }
}
