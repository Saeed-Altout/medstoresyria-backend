import { HttpException, HttpStatus } from '@nestjs/common';
import { MessageKey } from '../i18n/messages';

export class AppException extends HttpException {
  constructor(
    public readonly messageKey: MessageKey,
    status: HttpStatus,
    public readonly params?: Record<string, string>,
  ) {
    super(messageKey, status);
  }
}
