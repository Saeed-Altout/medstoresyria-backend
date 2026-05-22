import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';

export class SettingNotFoundException extends AppException {
  constructor() {
    super('SETTING_NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}
