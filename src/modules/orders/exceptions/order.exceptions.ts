import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';

export class OrderNotFoundException extends AppException {
  constructor() {
    super('ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}

export class OrderTrackNotFoundException extends AppException {
  constructor() {
    super('ORDER_TRACK_NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}

export class InvalidOrderStatusTransitionException extends AppException {
  constructor() {
    super('ORDER_INVALID_TRANSITION', HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
