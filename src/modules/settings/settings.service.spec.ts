import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { Setting } from './entities/setting.entity';
import { SettingNotFoundException } from './exceptions/settings.exceptions';
import { BulkUpdateSettingsDto } from './dto/bulk-update-settings.dto';

const makeSettingRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

describe('SettingsService', () => {
  let service: SettingsService;
  let repo: ReturnType<typeof makeSettingRepo>;

  beforeEach(async () => {
    repo = makeSettingRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getRepositoryToken(Setting), useValue: repo },
      ],
    }).compile();

    service = module.get(SettingsService);
  });

  describe('findAll', () => {
    it('returns all settings', async () => {
      const settings = [{ key: 'site_name_en', value: 'MedStore Syria' }];
      repo.find.mockResolvedValue(settings);

      const result = await service.findAll();

      expect(result).toEqual(settings);
      expect(repo.find).toHaveBeenCalledWith({ order: { key: 'ASC' } });
    });
  });

  describe('findByKey', () => {
    it('returns setting when found', async () => {
      const setting = { key: 'contact_phone', value: '+963' };
      repo.findOne.mockResolvedValue(setting);

      const result = await service.findByKey('contact_phone');
      expect(result).toEqual(setting);
    });

    it('throws SettingNotFoundException when key does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findByKey('unknown_key')).rejects.toBeInstanceOf(SettingNotFoundException);
    });
  });

  describe('bulkUpdate', () => {
    it('updates existing settings', async () => {
      const existing = { id: 'id1', key: 'site_name_en', value: 'Old' };
      repo.findOne.mockResolvedValue(existing);
      repo.update.mockResolvedValue({ affected: 1 });

      const dto: BulkUpdateSettingsDto = {
        settings: [{ key: 'site_name_en', value: 'MedStore Syria' }],
      };

      const result = await service.bulkUpdate(dto);
      expect(repo.update).toHaveBeenCalledWith('id1', { value: 'MedStore Syria' });
      expect(result).toHaveLength(1);
    });

    it('creates new settings when key does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      const newSetting = { id: 'new-id', key: 'new_key', value: 'new_val' };
      repo.create.mockReturnValue(newSetting);
      repo.save.mockResolvedValue(newSetting);

      const dto: BulkUpdateSettingsDto = {
        settings: [{ key: 'new_key', value: 'new_val' }],
      };

      const result = await service.bulkUpdate(dto);
      expect(repo.create).toHaveBeenCalledWith({ key: 'new_key', value: 'new_val' });
      expect(repo.save).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });
});
