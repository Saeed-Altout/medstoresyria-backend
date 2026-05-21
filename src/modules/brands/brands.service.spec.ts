import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandsService } from './brands.service';
import { Brand } from './entities/brand.entity';
import { BrandTranslation } from './entities/brand-translation.entity';
import { BrandSlugExistsException } from './exceptions/brand.exceptions';

const enTranslation = (name: string): BrandTranslation =>
  ({ id: 'tr-en', locale: 'en', name, description: null, created_at: new Date(), brand: {} as Brand });

const arTranslation = (name: string): BrandTranslation =>
  ({ id: 'tr-ar', locale: 'ar', name, description: null, created_at: new Date(), brand: {} as Brand });

const makeBrand = (overrides: Partial<Brand> = {}): Brand => ({
  id: 'brand-1',
  slug: 'philips',
  logo_url: null,
  website: null,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  translations: [enTranslation('Philips')],
  products: [],
  ...overrides,
});

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('BrandsService', () => {
  let service: BrandsService;
  let brandRepo: jest.Mocked<Repository<Brand>>;
  let translationRepo: jest.Mocked<Repository<BrandTranslation>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        { provide: getRepositoryToken(Brand), useFactory: mockRepo },
        { provide: getRepositoryToken(BrandTranslation), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
    brandRepo = module.get(getRepositoryToken(Brand));
    translationRepo = module.get(getRepositoryToken(BrandTranslation));
  });

  describe('findAll', () => {
    it('should return only active brands with translated names', async () => {
      brandRepo.find.mockResolvedValue([
        makeBrand({ translations: [enTranslation('Philips')] }),
      ]);

      const result = await service.findAll('en');

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Philips');
    });

    it('should fall back to English when requested locale has no row', async () => {
      brandRepo.find.mockResolvedValue([
        makeBrand({ translations: [enTranslation('Philips')] }),
      ]);

      const result = await service.findAll('ar');

      expect(result[0]!.name).toBe('Philips');
    });

    it('should return Arabic name when Arabic translation is present', async () => {
      brandRepo.find.mockResolvedValue([
        makeBrand({ translations: [enTranslation('Philips'), arTranslation('فيليبس')] }),
      ]);

      const result = await service.findAll('ar');

      expect(result[0]!.name).toBe('فيليبس');
    });
  });

  describe('create', () => {
    it('should throw BrandSlugExistsException for duplicate slug', async () => {
      brandRepo.findOne.mockResolvedValue(makeBrand());

      await expect(
        service.create({ slug: 'philips', translations: [{ locale: 'en', name: 'Philips' }] }),
      ).rejects.toThrow(BrandSlugExistsException);
    });
  });
});
