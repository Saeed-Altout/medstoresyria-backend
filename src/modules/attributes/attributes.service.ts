import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppException } from '../../common/exceptions/app.exception';
import { getTranslated } from '../../common/utils/translation.util';
import { UpsertAttributeTranslationDto } from '../../common/dto/upsert-translation.dto';
import { Category } from '../categories/entities/category.entity';
import { AttributeDefinition, AttributeType } from './entities/attribute-definition.entity';
import { AttributeTranslation } from './entities/attribute-translation.entity';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { AttributeKeyExistsException, AttributeNotFoundException } from './exceptions/attribute.exceptions';

interface AttributeDto {
  id: string;
  key: string;
  type: AttributeType;
  options: string[] | null;
  isRequired: boolean;
  sortOrder: number;
  label: string;
}

@Injectable()
export class AttributesService {
  constructor(
    @InjectRepository(AttributeDefinition)
    private readonly attrRepo: Repository<AttributeDefinition>,
    @InjectRepository(AttributeTranslation)
    private readonly translationRepo: Repository<AttributeTranslation>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findByCategoryId(categoryId: string, locale: string): Promise<AttributeDto[]> {
    const attrs = await this.attrRepo.find({
      where: { category: { id: categoryId } },
      relations: ['translations'],
      order: { sort_order: 'ASC' },
    });

    return attrs.map((attr) => ({
      id: attr.id,
      key: attr.key,
      type: attr.type,
      options: attr.options,
      isRequired: attr.is_required,
      sortOrder: attr.sort_order,
      label: getTranslated(attr.translations, 'label', locale),
    }));
  }

  async create(dto: CreateAttributeDto): Promise<AttributeDefinition> {
    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (!category) throw new AppException('CATEGORY_NOT_FOUND', HttpStatus.NOT_FOUND);

    const keyExists = await this.attrRepo.findOne({
      where: { key: dto.key, category: { id: dto.categoryId } },
    });
    if (keyExists) throw new AttributeKeyExistsException();

    const attr = this.attrRepo.create({
      key: dto.key,
      type: dto.type,
      options: dto.options ?? null,
      is_required: dto.isRequired ?? false,
      sort_order: dto.sortOrder ?? 0,
      category,
    });
    await this.attrRepo.save(attr);
    await this.upsertTranslations(attr.id, dto.translations);
    return attr;
  }

  async update(id: string, dto: UpdateAttributeDto): Promise<AttributeDefinition> {
    const attr = await this.attrRepo.findOne({ where: { id }, relations: ['category'] });
    if (!attr) throw new AttributeNotFoundException();

    if (dto.key && dto.key !== attr.key) {
      const keyExists = await this.attrRepo.findOne({
        where: { key: dto.key, category: { id: attr.category.id } },
      });
      if (keyExists) throw new AttributeKeyExistsException();
      attr.key = dto.key;
    }

    if (dto.type !== undefined) attr.type = dto.type;
    if (dto.options !== undefined) attr.options = dto.options ?? null;
    if (dto.isRequired !== undefined) attr.is_required = dto.isRequired;
    if (dto.sortOrder !== undefined) attr.sort_order = dto.sortOrder;

    await this.attrRepo.save(attr);

    if (dto.translations?.length) {
      await this.upsertTranslations(attr.id, dto.translations);
    }

    return attr;
  }

  async remove(id: string): Promise<void> {
    const attr = await this.attrRepo.findOne({ where: { id } });
    if (!attr) throw new AttributeNotFoundException();
    await this.attrRepo.delete(id);
  }

  async upsertTranslations(attrId: string, translations: UpsertAttributeTranslationDto[]): Promise<void> {
    const hasEn = translations.some((t) => t.locale === 'en');
    if (!hasEn) throw new AppException('TRANSLATION_MISSING_EN', HttpStatus.BAD_REQUEST);

    for (const t of translations) {
      await this.translationRepo
        .createQueryBuilder()
        .insert()
        .into(AttributeTranslation)
        .values({
          locale: t.locale,
          label: t.name,
          attributeDefinition: { id: attrId },
        })
        .orUpdate(['label'], ['attributeDefinition', 'locale'])
        .execute();
    }
  }
}
