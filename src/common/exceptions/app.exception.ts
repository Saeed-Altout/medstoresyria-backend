import { HttpException, HttpStatus } from '@nestjs/common';
import { MessageKey } from '../i18n/messages';

export class AppException extends HttpException {
  public readonly messageKey: MessageKey;

  constructor(messageKey: MessageKey, status: HttpStatus) {
    super(messageKey, status);
    this.messageKey = messageKey;
  }
}
