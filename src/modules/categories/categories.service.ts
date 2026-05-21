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
  ParentCategoryNotFoundException,
} from './exceptions/category.exceptions';

interface CategoryNode {
  id: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  name: string;
  description: string;
  children: CategoryNode[];
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Category)
    private readonly treeRepo: TreeRepository<Category>,
    @InjectRepository(CategoryTranslation)
    private readonly translationRepo: Repository<CategoryTranslation>,
  ) {}

  async getTree(locale: string): Promise<CategoryNode[]> {
    const trees = await this.treeRepo.findTrees({ relations: ['translations'] });
    return trees.map((node) => this.mapNode(node, locale));
  }

  private mapNode(node: Category, locale: string): CategoryNode {
    return {
      id: node.id,
      slug: node.slug,
      imageUrl: node.image_url,
      sortOrder: node.sort_order,
      name: getTranslated(node.translations, 'name', locale),
      description: getTranslated(node.translations, 'description', locale),
      children: (node.children ?? []).map((child) => this.mapNode(child, locale)),
    };
  }

  async findBySlug(slug: string, locale: string): Promise<Category & { name: string; description: string }> {
    const category = await this.categoryRepo.findOne({
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

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slugTaken = await this.categoryRepo.findOne({ where: { slug: dto.slug } });
    if (slugTaken) throw new CategorySlugExistsException();

    let parent: Category | null = null;
    if (dto.parentId) {
      parent = await this.categoryRepo.findOne({ where: { id: dto.parentId } });
      if (!parent) throw new ParentCategoryNotFoundException();
    }

    const category = this.categoryRepo.create({
      slug: dto.slug,
      image_url: dto.imageUrl ?? null,
      sort_order: dto.sortOrder ?? 0,
      parent,
    });
    await this.categoryRepo.save(category);
    await this.upsertTranslations(category.id, dto.translations);
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new CategoryNotFoundException();

    if (dto.slug && dto.slug !== category.slug) {
      const slugTaken = await this.categoryRepo.findOne({ where: { slug: dto.slug } });
      if (slugTaken) throw new CategorySlugExistsException();
      category.slug = dto.slug;
    }

    if (dto.imageUrl !== undefined) category.image_url = dto.imageUrl ?? null;
    if (dto.sortOrder !== undefined) category.sort_order = dto.sortOrder;

    if (dto.parentId !== undefined) {
      if (dto.parentId === null) {
        category.parent = null;
      } else {
        const parent = await this.categoryRepo.findOne({ where: { id: dto.parentId } });
        if (!parent) throw new ParentCategoryNotFoundException();
        category.parent = parent;
      }
    }

    await this.categoryRepo.save(category);

    if (dto.translations?.length) {
      await this.upsertTranslations(category.id, dto.translations);
    }

    return category;
  }

  async softDelete(id: string): Promise<void> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new CategoryNotFoundException();
    await this.categoryRepo.update(id, { is_active: false });
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
        .orUpdate(['name', 'description'], ['category', 'locale'])
        .execute();
    }
  }
}
