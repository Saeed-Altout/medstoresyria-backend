import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';
import { AppException } from '../../common/exceptions/app.exception';
import { getTranslated, getTranslationRow } from '../../common/utils/translation.util';
import { UpsertTranslationDto } from '../../common/dto/upsert-translation.dto';
import { Category } from './entities/category.entity';
import { CategoryTranslation } from './entities/category-translation.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  CategoryNotFoundException,
  CategorySlugExistsException,
  CategoryInUseException,
  ParentCategoryNotFoundException,
} from './exceptions/category.exceptions';

export type StatusFilter = 'active' | 'inactive' | 'all';

interface CategoryTranslationDto {
  locale: string;
  name: string;
  description: string | null;
}

export interface CategoryNode {
  id: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  name: string;
  description: string;
  translations: CategoryTranslationDto[];
  children: CategoryNode[];
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: TreeRepository<Category>,
    @InjectRepository(CategoryTranslation)
    private readonly translationRepo: Repository<CategoryTranslation>,
  ) {}

  async getTree(locale: string, status: StatusFilter = 'active'): Promise<CategoryNode[]> {
    // Load flat list filtered by is_active in the DB — avoids JS-side filtering bugs
    const whereClause = status === 'all' ? {} : { is_active: status === 'active' };
    const flat = await this.repo.find({
      where: whereClause,
      relations: ['translations', 'parent'],
      order: { sort_order: 'ASC' },
    });

    // Reconstruct tree in memory from the flat list
    return this.buildTree(flat, null, locale);
  }

  private buildTree(flat: Category[], parentId: string | null, locale: string): CategoryNode[] {
    return flat
      .filter((c) => (c.parent?.id ?? null) === parentId)
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        imageUrl: c.image_url,
        sortOrder: c.sort_order,
        isActive: c.is_active,
        name: getTranslated(c.translations, 'name', locale),
        description: getTranslated(c.translations, 'description', locale),
        translations: (c.translations ?? []).map((t) => ({
          locale: t.locale,
          name: t.name,
          description: t.description,
        })),
        children: this.buildTree(flat, c.id, locale),
      }));
  }

  async findBySlug(slug: string, locale: string): Promise<Category & { name: string; description: string }> {
    const category = await this.repo.findOne({
      where: { slug, is_active: true },
      relations: ['translations', 'attribute_definitions', 'attribute_definitions.translations'],
    });
    if (!category) throw new CategoryNotFoundException();

    const row = getTranslationRow(category.translations, locale);
    return Object.assign(category, {
      name: row?.name ?? '',
      description: row?.description ?? '',
    });
  }

  async create(dto: CreateCategoryDto, locale: string = 'en'): Promise<CategoryNode> {
    const slugTaken = await this.repo.findOne({ where: { slug: dto.slug } });
    if (slugTaken) throw new CategorySlugExistsException();

    let parent: Category | null = null;
    if (dto.parentId) {
      parent = await this.repo.findOne({ where: { id: dto.parentId } });
      if (!parent) throw new ParentCategoryNotFoundException();
    }

    const category = this.repo.create({
      slug: dto.slug,
      image_url: dto.imageUrl ?? null,
      sort_order: dto.sortOrder ?? 0,
      parent,
    });
    await this.repo.save(category);
    await this.upsertTranslations(category.id, dto.translations);

    // Reload with translations to return consistent shape
    const saved = await this.repo.findOne({
      where: { id: category.id },
      relations: ['translations'],
    });
    return this.toNode(saved!, locale);
  }

  async update(id: string, dto: UpdateCategoryDto, locale: string = 'en'): Promise<CategoryNode> {
    const category = await this.repo.findOne({ where: { id }, relations: ['parent'] });
    if (!category) throw new CategoryNotFoundException();

    if (dto.slug && dto.slug !== category.slug) {
      const slugTaken = await this.repo.findOne({ where: { slug: dto.slug } });
      if (slugTaken) throw new CategorySlugExistsException();
      category.slug = dto.slug;
    }

    if (dto.imageUrl !== undefined) category.image_url = dto.imageUrl ?? null;
    if (dto.sortOrder !== undefined) category.sort_order = dto.sortOrder;
    if (dto.isActive !== undefined) category.is_active = dto.isActive;

    if (dto.parentId !== undefined) {
      if (dto.parentId === null) {
        category.parent = null;
      } else {
        const parent = await this.repo.findOne({ where: { id: dto.parentId } });
        if (!parent) throw new ParentCategoryNotFoundException();
        category.parent = parent;
      }
    }

    await this.repo.save(category);

    if (dto.translations?.length) {
      await this.upsertTranslations(category.id, dto.translations);
    }

    const saved = await this.repo.findOne({
      where: { id: category.id },
      relations: ['translations'],
    });
    return this.toNode(saved!, locale);
  }

  async hardDelete(id: string): Promise<void> {
    const category = await this.repo.findOne({ where: { id } });
    if (!category) throw new CategoryNotFoundException();

    const descendants = await this.repo.findDescendants(category);
    const allIds = descendants.map((c) => c.id);

    const usedCount = await this.repo
      .createQueryBuilder('c')
      .innerJoin('c.products', 'p')
      .where('c.id IN (:...ids)', { ids: allIds })
      .getCount();

    if (usedCount > 0) throw new CategoryInUseException();

    // Use treeRepo so TypeORM cleans up the closure table correctly
    await this.repo.remove(descendants);
  }

  async upsertTranslations(categoryId: string, translations: UpsertTranslationDto[]): Promise<void> {
    const hasEn = translations.some((t) => t.locale === 'en');
    if (!hasEn) throw new AppException('TRANSLATION_MISSING_EN', HttpStatus.BAD_REQUEST);

    for (const t of translations) {
      await this.translationRepo
        .createQueryBuilder()
        .insert()
        .into(CategoryTranslation)
        .values({
          locale: t.locale,
          name: t.name,
          description: t.description ?? null,
          category: { id: categoryId },
        })
        .orUpdate(['name', 'description'], ['categoryId', 'locale'])
        .execute();
    }
  }

  private toNode(category: Category, locale: string): CategoryNode {
    const row = getTranslationRow(category.translations, locale);
    return {
      id: category.id,
      slug: category.slug,
      imageUrl: category.image_url,
      sortOrder: category.sort_order,
      isActive: category.is_active,
      name: row?.name ?? '',
      description: row?.description ?? '',
      translations: (category.translations ?? []).map((t) => ({
        locale: t.locale,
        name: t.name,
        description: t.description,
      })),
      children: [],
    };
  }
}
