import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppException } from '../../common/exceptions/app.exception';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

@Injectable()
export class StorageService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly config: ConfigService) {
    this.client = createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      config.getOrThrow<string>('SUPABASE_SERVICE_KEY'),
    );
  }

  validateFile(mimetype: string, sizeBytes: number): void {
    if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
      throw new AppException('INVALID_FILE_TYPE', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    if (sizeBytes > MAX_BYTES) {
      throw new AppException('FILE_TOO_LARGE', HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  async uploadFile(
    bucket: string,
    buffer: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<string> {
    const { error } = await this.client.storage
      .from(bucket)
      .upload(filename, buffer, { contentType: mimetype, upsert: true });

    if (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw new AppException('INTERNAL_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const { data } = this.client.storage.from(bucket).getPublicUrl(filename);
    return data.publicUrl;
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.client.storage.from(bucket).remove([path]);
    if (error) {
      this.logger.error(`Delete failed: ${error.message}`);
      throw new AppException('INTERNAL_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
