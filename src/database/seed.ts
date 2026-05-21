import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/data-source';
import { Governorate } from '../modules/delivery/entities/governorate.entity';
import { User } from '../modules/users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { Category } from '../modules/categories/entities/category.entity';
import { CategoryTranslation } from '../modules/categories/entities/category-translation.entity';
import { Brand } from '../modules/brands/entities/brand.entity';
import { BrandTranslation } from '../modules/brands/entities/brand-translation.entity';

const GOVERNORATES: Array<{ name: string; name_local: string; delivery_fee_usd: string }> = [
  { name: 'Damascus',     name_local: 'دمشق',       delivery_fee_usd: '3.00' },
  { name: 'Aleppo',       name_local: 'حلب',         delivery_fee_usd: '4.00' },
  { name: 'Homs',         name_local: 'حمص',         delivery_fee_usd: '5.00' },
  { name: 'Hama',         name_local: 'حماة',        delivery_fee_usd: '5.00' },
  { name: 'Latakia',      name_local: 'اللاذقية',    delivery_fee_usd: '5.00' },
  { name: 'Tartus',       name_local: 'طرطوس',       delivery_fee_usd: '5.00' },
  { name: 'Idlib',        name_local: 'إدلب',        delivery_fee_usd: '6.00' },
  { name: 'Deir ez-Zor',  name_local: 'دير الزور',   delivery_fee_usd: '7.00' },
  { name: 'Raqqa',        name_local: 'الرقة',       delivery_fee_usd: '7.00' },
  { name: 'Hasakah',      name_local: 'الحسكة',      delivery_fee_usd: '7.00' },
  { name: 'Qamishli',     name_local: 'القامشلي',    delivery_fee_usd: '7.00' },
  { name: 'Daraa',        name_local: 'درعا',        delivery_fee_usd: '6.00' },
  { name: 'As-Suwayda',   name_local: 'السويداء',    delivery_fee_usd: '6.00' },
  { name: 'Quneitra',     name_local: 'القنيطرة',    delivery_fee_usd: '6.00' },
];

async function seedGovernorates(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Governorate);
  const existing = await repo.count();
  if (existing > 0) {
    console.log(`  ↳ Governorates already seeded (${existing} rows), skipping.`);
    return;
  }
  const rows = GOVERNORATES.map((g) => repo.create(g));
  await repo.save(rows);
  console.log(`  ↳ Inserted ${rows.length} governorates.`);
}

async function seedAdmin(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(User);
  const exists = await repo.findOne({ where: { email: 'admin@medstore.com' } });
  if (exists) {
    console.log('  ↳ Admin user already exists, skipping.');
    return;
  }
  const hashed = await bcrypt.hash('Admin@123456', 12);
  const admin = repo.create({
    email: 'admin@medstore.com',
    password: hashed,
    first_name: 'Super',
    last_name: 'Admin',
    role: Role.ADMIN,
    locale: 'en',
    is_active: true,
  });
  await repo.save(admin);
  console.log('  ↳ Admin user created: admin@medstore.com');
}

async function seedCategories(ds: DataSource): Promise<void> {
  const catRepo = ds.getRepository(Category);
  const transRepo = ds.getRepository(CategoryTranslation);

  const CATEGORIES = [
    {
      slug: 'medical-devices',
      translations: [
        { locale: 'en', name: 'Medical Devices' },
        { locale: 'ar', name: 'أجهزة طبية' },
      ],
    },
    {
      slug: 'medical-supplies',
      translations: [
        { locale: 'en', name: 'Medical Supplies' },
        { locale: 'ar', name: 'مستلزمات طبية' },
      ],
    },
    {
      slug: 'rehabilitation',
      translations: [
        { locale: 'en', name: 'Rehabilitation' },
        { locale: 'ar', name: 'أجهزة تأهيل' },
      ],
    },
  ];

  for (const catData of CATEGORIES) {
    const existing = await catRepo.findOne({ where: { slug: catData.slug } });
    if (existing) {
      console.log(`  ↳ Category "${catData.slug}" already exists, skipping.`);
      continue;
    }

    const category = catRepo.create({ slug: catData.slug });
    await catRepo.save(category);

    const translationRows = catData.translations.map((t) =>
      transRepo.create({ locale: t.locale, name: t.name, category }),
    );
    await transRepo.save(translationRows);
    console.log(`  ↳ Category "${catData.slug}" created with ${translationRows.length} translations.`);
  }
}

async function seedBrands(ds: DataSource): Promise<void> {
  const brandRepo = ds.getRepository(Brand);
  const transRepo = ds.getRepository(BrandTranslation);

  const BRANDS = [
    {
      slug: 'omron',
      translations: [
        { locale: 'en', name: 'Omron', description: 'Japanese medical devices' },
        { locale: 'ar', name: 'أومرون', description: null },
      ],
    },
    {
      slug: 'beurer',
      translations: [
        { locale: 'en', name: 'Beurer', description: 'German health products' },
        { locale: 'ar', name: 'بيورر', description: null },
      ],
    },
  ];

  for (const brandData of BRANDS) {
    const existing = await brandRepo.findOne({ where: { slug: brandData.slug } });
    if (existing) {
      console.log(`  ↳ Brand "${brandData.slug}" already exists, skipping.`);
      continue;
    }

    const brand = brandRepo.create({ slug: brandData.slug });
    await brandRepo.save(brand);

    const translationRows = brandData.translations.map((t) =>
      transRepo.create({ locale: t.locale, name: t.name, description: t.description ?? null, brand }),
    );
    await transRepo.save(translationRows);
    console.log(`  ↳ Brand "${brandData.slug}" created with ${translationRows.length} translations.`);
  }
}

async function main(): Promise<void> {
  console.log('🌱 Starting seed...\n');

  const ds = await AppDataSource.initialize();
  console.log('✅ Database connected.\n');

  try {
    console.log('📍 Governorates:');
    await seedGovernorates(ds);

    console.log('\n👤 Admin user:');
    await seedAdmin(ds);

    console.log('\n📂 Categories:');
    await seedCategories(ds);

    console.log('\n🏷️  Brands:');
    await seedBrands(ds);

    console.log('\n✅ Seed completed successfully.');
  } finally {
    await ds.destroy();
  }
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
