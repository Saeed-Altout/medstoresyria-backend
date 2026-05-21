import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TreeRepository, Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { CategoryTranslation } from './entities/category-translation.entity';
import {
  CategoryNotFoundException,
  CategorySlugExistsException,
} from './exceptions/category.exceptions';

const enTranslation = (name: string): CategoryTranslation =>
  ({ id: 'tr-en', locale: 'en', name, description: null, created_at: new Date(), category: {} as Category });

const arTranslation = (name: string): CategoryTranslation =>
  ({ id: 'tr-ar', locale: 'ar', name, description: null, created_at: new Date(), category: {} as Category });

const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 'cat-1',
  slug: 'ultrasound',
  image_url: null,
  sort_order: 0,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  parent: null,
  children: [],
  translations: [enTranslation('Ultrasound')],
  products: [],
  attribute_definitions: [],
  ...overrides,
});

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  findTrees: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepo: jest.Mocked<Repository<Category>>;
  let treeRepo: jest.Mocked<TreeRepository<Category>>;
  let translationRepo: jest.Mocked<Repository<CategoryTranslation>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useFactory: mockRepo },
        { provide: getRepositoryToken(CategoryTranslation), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    // Both injections of Category resolve to the same mock
    categoryRepo = module.get(getRepositoryToken(Category));
    treeRepo = categoryRepo as unknown as jest.Mocked<TreeRepository<Category>>;
    translationRepo = module.get(getRepositoryToken(CategoryTranslation));
  });

  describe('getTree', () => {
    it('should return nested children with translated name', async () => {
      const child = makeCategory({ id: 'cat-2', slug: 'mri', translations: [enTranslation('MRI')] });
      const parent = makeCategory({ children: [child] });
      treeRepo.findTrees = jest.fn().mockResolvedValue([parent]);

      const result = await service.getTree('en');

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Ultrasound');
      expect(result[0]!.children).toHaveLength(1);
      expect(result[0]!.children[0]!.name).toBe('MRI');
    });

    it('should fall back to English name when requested locale has no row', async () => {
      const cat = makeCategory({ translations: [enTranslation('Ultrasound')] });
      treeRepo.findTrees = jest.fn().mockResolvedValue([cat]);

      const result = await service.getTree('ar');

      expect(result[0]!.name).toBe('Ultrasound');
    });

    it('should use Arabic name when Arabic translation is present', async () => {
      const cat = makeCategory({
        translations: [enTranslation('Ultrasound'), arTranslation('الموجات الفوق صوتية')],
      });
      treeRepo.findTrees = jest.fn().mockResolvedValue([cat]);

      const result = await service.getTree('ar');

      expect(result[0]!.name).toBe('الموجات الفوق صوتية');
    });
  });

  describe('findBySlug', () => {
    it('should throw CategoryNotFoundException for unknown slug', async () => {
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(service.findBySlug('unknown', 'en')).rejects.toThrow(CategoryNotFoundException);
    });
  });

  describe('create', () => {
    it('should throw CategorySlugExistsException for duplicate slug', async () => {
      categoryRepo.findOne.mockResolvedValue(makeCategory());

      await expect(
        service.create({ slug: 'ultrasound', translations: [{ locale: 'en', name: 'Ultrasound' }] }),
      ).rejects.toThrow(CategorySlugExistsException);
    });

    it('should link to parent when parentId is provided', async () => {
      const parent = makeCategory({ id: 'parent-id' });
      categoryRepo.findOne
        .mockResolvedValueOnce(null)     // slug check
        .mockResolvedValueOnce(parent);  // parent lookup

      const created = makeCategory({ id: 'new-id' });
      categoryRepo.create.mockReturnValue(created);
      categoryRepo.save.mockResolvedValue(created);

      const qb = {
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        orUpdate: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      translationRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);

      await service.create({
        slug: 'mri',
        parentId: 'parent-id',
        translations: [{ locale: 'en', name: 'MRI' }],
      });

      expect(categoryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ parent }),
      );
    });
  });
});
