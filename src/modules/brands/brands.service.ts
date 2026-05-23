import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppException } from '../../common/exceptions/app.exception';
import { getTranslated, getTranslationRow } from '../../common/utils/translation.util';
import { UpsertTranslationDto } from '../../common/dto/upsert-translation.dto';
import { Brand } from './entities/brand.entity';
import { BrandTranslation } from './entities/brand-translation.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandNotFoundException, BrandSlugExistsException } from './exceptions/brand.exceptions';

interface BrandTranslationDto {
  locale: string;
  name: string;
  description: string | null;
}

interface BrandDto {
  id: string;
  slug: string;
  logoUrl: string | null;
  website: string | null;
  name: string;
  description: string;
  translations: BrandTranslationDto[];
}

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
    @InjectRepository(BrandTranslation)
    private readonly translationRepo: Repository<BrandTranslation>,
  ) {}

  async findAll(locale: string): Promise<BrandDto[]> {
    const brands = await this.brandRepo.find({
      where: { is_active: true },
      relations: ['translations'],
      order: { slug: 'ASC' },
    });

    return brands.map((brand) => {
      const row = getTranslationRow(brand.translations, locale);
      return {
        id: brand.id,
        slug: brand.slug,
        logoUrl: brand.logo_url,
        website: brand.website,
        name: row?.name ?? '',
        description: row?.description ?? '',
        translations: (brand.translations ?? []).map((t) => ({
          locale: t.locale,
          name: t.name,
          description: t.description,
        })),
      };
    });
  }

  async findBySlug(slug: string, locale: string): Promise<Brand & { name: string; description: string }> {
    const brand = await this.brandRepo.findOne({
      where: { slug, is_active: true },
      relations: ['translations'],
    });
    if (!brand) throw new BrandNotFoundException();

    const row = getTranslationRow(brand.translations, locale);
    return Object.assign(brand, {
      name: row?.name ?? '',
      description: row?.description ?? '',
    });
  }

  async create(dto: CreateBrandDto): Promise<Brand> {
    const slugTaken = await this.brandRepo.findOne({ where: { slug: dto.slug } });
    if (slugTaken) throw new BrandSlugExistsException();

    const brand = this.brandRepo.create({
      slug: dto.slug,
      logo_url: dto.logoUrl ?? null,
      website: dto.website ?? null,
    });
    await this.brandRepo.save(brand);
    await this.upsertTranslations(brand.id, dto.translations);
    return brand;
  }

  async update(id: string, dto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.brandRepo.findOne({ where: { id } });
    if (!brand) throw new BrandNotFoundException();

    if (dto.slug && dto.slug !== brand.slug) {
      const slugTaken = await this.brandRepo.findOne({ where: { slug: dto.slug } });
      if (slugTaken) throw new BrandSlugExistsException();
      brand.slug = dto.slug;
    }
    if (dto.logoUrl !== undefined) brand.logo_url = dto.logoUrl ?? null;
    if (dto.website !== undefined) brand.website = dto.website ?? null;

    await this.brandRepo.save(brand);

    if (dto.translations?.length) {
      await this.upsertTranslations(brand.id, dto.translations);
    }

    return brand;
  }

  async softDelete(id: string): Promise<void> {
    const brand = await this.brandRepo.findOne({ where: { id } });
    if (!brand) throw new BrandNotFoundException();
    await this.brandRepo.update(id, { is_active: false });
  }

  async upsertTranslations(brandId: string, translations: UpsertTranslationDto[]): Promise<void> {
    const hasEn = translations.some((t) => t.locale === 'en');
    if (!hasEn) throw new AppException('TRANSLATION_MISSING_EN', HttpStatus.BAD_REQUEST);

    for (const t of translations) {
      await this.translationRepo
        .createQueryBuilder()
        .insert()
        .into(BrandTranslation)
        .values({
          locale: t.locale,
          name: t.name,
          description: t.description ?? null,
          brand: { id: brandId },
        })
        .orUpdate(['name', 'description'], ['brandId', 'locale'])
        .execute();
    }
  }
}
