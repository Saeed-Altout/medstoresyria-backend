import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { SettingNotFoundException } from './exceptions/settings.exceptions';
import { BulkUpdateSettingsDto } from './dto/bulk-update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
  ) {}

  async findAll(): Promise<Setting[]> {
    return this.settingRepo.find({ order: { key: 'ASC' } });
  }

  async findByKey(key: string): Promise<Setting> {
    const setting = await this.settingRepo.findOne({ where: { key } });
    if (!setting) throw new SettingNotFoundException();
    return setting;
  }

  async bulkUpdate(dto: BulkUpdateSettingsDto): Promise<Setting[]> {
    const updated: Setting[] = [];
    for (const item of dto.settings) {
      let setting = await this.settingRepo.findOne({ where: { key: item.key } });
      if (setting) {
        await this.settingRepo.update(setting.id, { value: item.value });
        setting.value = item.value;
      } else {
        setting = this.settingRepo.create({ key: item.key, value: item.value });
        await this.settingRepo.save(setting);
      }
      updated.push(setting);
    }
    return updated;
  }
}
