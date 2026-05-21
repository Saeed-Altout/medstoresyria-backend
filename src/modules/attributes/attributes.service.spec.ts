import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributesService } from './attributes.service';
import { AttributeDefinition, AttributeType } from './entities/attribute-definition.entity';
import { AttributeTranslation } from './entities/attribute-translation.entity';
import { Category } from '../categories/entities/category.entity';
import { AttributeKeyExistsException } from './exceptions/attribute.exceptions';

const enLabel = (label: string): AttributeTranslation =>
  ({
    id: 'tr-en',
    locale: 'en',
    label,
    created_at: new Date(),
    attributeDefinition: {} as AttributeDefinition,
  });

const arLabel = (label: string): AttributeTranslation =>
  ({
    id: 'tr-ar',
    locale: 'ar',
    label,
    created_at: new Date(),
    attributeDefinition: {} as AttributeDefinition,
  });

const makeAttr = (overrides: Partial<AttributeDefinition> = {}): AttributeDefinition => ({
  id: 'attr-1',
  key: 'frequency_mhz',
  type: AttributeType.NUMBER,
  options: null,
  is_required: false,
  sort_order: 0,
  category: { id: 'cat-1' } as Category,
  translations: [enLabel('Frequency (MHz)')],
  product_attribute_values: [],
  ...overrides,
});

const makeCategory = (): Category => ({
  id: 'cat-1',
  slug: 'ultrasound',
  image_url: null,
  sort_order: 0,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  parent: null,
  children: [],
  translations: [],
  products: [],
  attribute_definitions: [],
});

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('AttributesService', () => {
  let service: AttributesService;
  let attrRepo: jest.Mocked<Repository<AttributeDefinition>>;
  let translationRepo: jest.Mocked<Repository<AttributeTranslation>>;
  let categoryRepo: jest.Mocked<Repository<Category>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttributesService,
        { provide: getRepositoryToken(AttributeDefinition), useFactory: mockRepo },
        { provide: getRepositoryToken(AttributeTranslation), useFactory: mockRepo },
        { provide: getRepositoryToken(Category), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<AttributesService>(AttributesService);
    attrRepo = module.get(getRepositoryToken(AttributeDefinition));
    translationRepo = module.get(getRepositoryToken(AttributeTranslation));
    categoryRepo = module.get(getRepositoryToken(Category));
  });

  describe('findByCategoryId', () => {
    it('should return attributes ordered by sort_order', async () => {
      attrRepo.find.mockResolvedValue([
        makeAttr({ id: 'a1', sort_order: 1, key: 'weight' }),
        makeAttr({ id: 'a2', sort_order: 2, key: 'frequency' }),
      ]);

      const result = await service.findByCategoryId('cat-1', 'en');

      expect(result).toHaveLength(2);
      expect(result[0]!.key).toBe('weight');
      expect(result[1]!.key).toBe('frequency');
    });

    it('should fall back to English label when locale has no row', async () => {
      attrRepo.find.mockResolvedValue([
        makeAttr({ translations: [enLabel('Frequency (MHz)')] }),
      ]);

      const result = await service.findByCategoryId('cat-1', 'ar');

      expect(result[0]!.label).toBe('Frequency (MHz)');
    });

    it('should return Arabic label when Arabic translation exists', async () => {
      attrRepo.find.mockResolvedValue([
        makeAttr({ translations: [enLabel('Frequency (MHz)'), arLabel('التردد (ميغاهرتز)')] }),
      ]);

      const result = await service.findByCategoryId('cat-1', 'ar');

      expect(result[0]!.label).toBe('التردد (ميغاهرتز)');
    });
  });

  describe('create', () => {
    it('should throw AttributeKeyExistsException for duplicate key in same category', async () => {
      categoryRepo.findOne.mockResolvedValue(makeCategory());
      attrRepo.findOne.mockResolvedValue(makeAttr());

      await expect(
        service.create({
          categoryId: 'cat-1',
          key: 'frequency_mhz',
          type: AttributeType.NUMBER,
          translations: [{ locale: 'en', name: 'Frequency' }],
        }),
      ).rejects.toThrow(AttributeKeyExistsException);
    });
  });
});
