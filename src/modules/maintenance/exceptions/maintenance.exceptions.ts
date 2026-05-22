import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';

export class MaintenanceRequestNotFoundException extends AppException {
  constructor() {
    super('MAINTENANCE_NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}

export class TechnicianNotFoundException extends AppException {
  constructor() {
    super('TECHNICIAN_NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}

export class InvalidMaintenanceStatusTransitionException extends AppException {
  constructor() {
    super('MAINTENANCE_INVALID_TRANSITION', HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
