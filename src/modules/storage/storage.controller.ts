import {
  Controller,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import type { HandlerResult } from '../../common/interceptors/response.interceptor';
import { AppException } from '../../common/exceptions/app.exception';
import { StorageService } from './storage.service';

const DEFAULT_BUCKET = 'public-uploads';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Roles(Role.ADMIN, Role.SALES)
  @Post('upload')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single image and get back its public URL' })
  @ApiResponse({ status: 201 })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ): Promise<HandlerResult<{ url: string }>> {
    if (!file) {
      throw new AppException('VALIDATION_FAILED', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    this.storageService.validateFile(file.mimetype, file.size);

    const safeFolder = (folder ?? 'misc').replace(/[^a-z0-9/_-]/gi, '');
    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const filename = `${safeFolder}/${Date.now()}.${ext}`;

    const url = await this.storageService.uploadFile(
      DEFAULT_BUCKET,
      file.buffer,
      filename,
      file.mimetype,
    );

    return {
      messageKey: 'FILE_UPLOADED',
      statusCode: HttpStatus.CREATED,
      data: { url },
    };
  }
}
