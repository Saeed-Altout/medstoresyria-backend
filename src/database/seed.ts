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
import { Order, OrderStatus } from '../modules/orders/entities/order.entity';
import { OrderItem } from '../modules/orders/entities/order-item.entity';
import { OrderStatusLog } from '../modules/orders/entities/order-status-log.entity';
import { Product } from '../modules/products/entities/product.entity';
import { ProductTranslation } from '../modules/products/entities/product-translation.entity';
import { generateOrderNumber } from '../common/utils/generators.util';

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

// ─── Customers to use as order owners ────────────────────────────────────────

const SEED_CUSTOMERS = [
  { email: 'ahmad.khalil@example.com', first_name: 'Ahmad',   last_name: 'Khalil',   phone: '+963991000001' },
  { email: 'sara.hasan@example.com',   first_name: 'Sara',    last_name: 'Hasan',    phone: '+963991000002' },
  { email: 'omar.musa@example.com',    first_name: 'Omar',    last_name: 'Musa',     phone: '+963991000003' },
  { email: 'lina.ali@example.com',     first_name: 'Lina',    last_name: 'Ali',      phone: '+963991000004' },
  { email: 'yusuf.nour@example.com',   first_name: 'Yusuf',   last_name: 'Nour',     phone: '+963991000005' },
];

async function seedCustomers(ds: DataSource): Promise<User[]> {
  const repo = ds.getRepository(User);
  const hashed = await bcrypt.hash('Customer@123', 12);
  const users: User[] = [];
  for (const c of SEED_CUSTOMERS) {
    let user = await repo.findOne({ where: { email: c.email } });
    if (!user) {
      user = repo.create({ ...c, password: hashed, role: Role.CUSTOMER, locale: 'en', is_active: true });
      user = await repo.save(user);
      console.log(`  ↳ Customer created: ${c.email}`);
    } else {
      console.log(`  ↳ Customer already exists: ${c.email}`);
    }
    users.push(user);
  }
  return users;
}

// ─── Orders seeder ────────────────────────────────────────────────────────────

async function seedOrders(ds: DataSource): Promise<void> {
  const orderRepo    = ds.getRepository(Order);
  const itemRepo     = ds.getRepository(OrderItem);
  const logRepo      = ds.getRepository(OrderStatusLog);
  const productRepo  = ds.getRepository(Product);
  const transRepo    = ds.getRepository(ProductTranslation);
  const govRepo      = ds.getRepository(Governorate);
  const userRepo     = ds.getRepository(User);

  const existing = await orderRepo.count();
  if (existing > 0) {
    console.log(`  ↳ Orders already seeded (${existing} rows), skipping.`);
    return;
  }

  // Fetch prerequisites
  const governorates = await govRepo.find();
  if (governorates.length === 0) {
    console.log('  ↳ No governorates found — run seed first.');
    return;
  }

  const products = await productRepo.find({ where: { is_active: true } });
  if (products.length === 0) {
    console.log('  ↳ No active products found — add products first.');
    return;
  }

  const admin = await userRepo.findOne({ where: { email: 'admin@medstore.com' } });
  const customers = await seedCustomers(ds);

  // Helper to get a product name from its translations
  async function getProductName(product: Product): Promise<string> {
    const trans = await transRepo.findOne({ where: { product: { id: product.id }, locale: 'en' } });
    return trans?.name ?? product.slug;
  }

  // Helper to pick a random item from an array
  function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Build a single order with items and status logs
  async function createOrder(
    customer: User,
    governorate: Governorate,
    orderProducts: Array<{ product: Product; qty: number }>,
    statusFlow: OrderStatus[],
    rejectionReason?: string,
    daysAgo = 0,
  ): Promise<void> {
    const deliveryFee = parseFloat(governorate.delivery_fee_usd);
    let subtotal = 0;
    const itemDatas: Array<{ name: string; price: number; qty: number }> = [];

    for (const { product, qty } of orderProducts) {
      const name = await getProductName(product);
      const price = parseFloat(product.price_usd);
      subtotal += price * qty;
      itemDatas.push({ name, price, qty });
    }

    const total = subtotal + deliveryFee;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);

    const order = orderRepo.create({
      order_number: generateOrderNumber(),
      customer_name: `${customer.first_name} ${customer.last_name}`,
      customer_email: customer.email,
      customer_phone: customer.phone ?? '+963900000000',
      address_detail: `${governorate.name_local} - شارع الأمل، بناء رقم ${Math.floor(Math.random() * 50) + 1}`,
      locale: 'en',
      status: statusFlow[statusFlow.length - 1],
      subtotal_usd: subtotal.toFixed(2),
      delivery_fee_usd: deliveryFee.toFixed(2),
      total_usd: total.toFixed(2),
      rejection_reason: rejectionReason ?? null,
      governorate,
      user: customer,
      created_at: createdAt,
    } as Partial<Order> as Order);

    const savedOrder = await orderRepo.save(order);

    // Items
    for (const { product, qty } of orderProducts) {
      const name = await getProductName(product);
      const price = parseFloat(product.price_usd);
      const item = itemRepo.create({
        product_name_snapshot: name,
        product_price_snapshot: price.toFixed(2),
        quantity: qty,
        total_usd: (price * qty).toFixed(2),
        order: savedOrder,
        product,
      });
      await itemRepo.save(item);
    }

    // Status logs — each step offset by a few hours
    for (let i = 0; i < statusFlow.length; i++) {
      const logTime = new Date(createdAt);
      logTime.setHours(logTime.getHours() + i * 4);
      const log = logRepo.create({
        status: statusFlow[i],
        note: null,
        order: savedOrder,
        user: i === 0 ? null : admin,
        created_at: logTime,
      } as Partial<OrderStatusLog> as OrderStatusLog);
      await logRepo.save(log);
    }
  }

  console.log('  ↳ Creating orders…');

  // ── 4 pending orders ──────────────────────────────────────────────────────
  for (let i = 0; i < 4; i++) {
    await createOrder(
      pick(customers),
      pick(governorates),
      [{ product: pick(products), qty: Math.floor(Math.random() * 2) + 1 }],
      [OrderStatus.PENDING],
      undefined,
      i,
    );
  }

  // ── 3 confirmed orders ───────────────────────────────────────────────────
  for (let i = 0; i < 3; i++) {
    await createOrder(
      pick(customers),
      pick(governorates),
      [
        { product: pick(products), qty: 1 },
        { product: pick(products), qty: 2 },
      ],
      [OrderStatus.PENDING, OrderStatus.CONFIRMED],
      undefined,
      3 + i,
    );
  }

  // ── 2 preparing orders ───────────────────────────────────────────────────
  for (let i = 0; i < 2; i++) {
    await createOrder(
      pick(customers),
      pick(governorates),
      [{ product: pick(products), qty: 1 }],
      [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING],
      undefined,
      6 + i,
    );
  }

  // ── 2 shipped orders ─────────────────────────────────────────────────────
  for (let i = 0; i < 2; i++) {
    await createOrder(
      pick(customers),
      pick(governorates),
      [{ product: pick(products), qty: 3 }],
      [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.SHIPPED],
      undefined,
      8 + i,
    );
  }

  // ── 3 delivered orders ───────────────────────────────────────────────────
  for (let i = 0; i < 3; i++) {
    await createOrder(
      pick(customers),
      pick(governorates),
      [
        { product: pick(products), qty: 1 },
        { product: pick(products), qty: 1 },
      ],
      [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
      undefined,
      10 + i * 2,
    );
  }

  // ── 2 cancelled orders ───────────────────────────────────────────────────
  for (let i = 0; i < 2; i++) {
    await createOrder(
      pick(customers),
      pick(governorates),
      [{ product: pick(products), qty: 1 }],
      [OrderStatus.PENDING, OrderStatus.CANCELLED],
      undefined,
      14 + i,
    );
  }

  // ── 2 rejected orders ────────────────────────────────────────────────────
  const rejectionReasons = [
    'Product out of stock at time of fulfillment',
    'Customer address not reachable in this region',
  ];
  for (let i = 0; i < 2; i++) {
    await createOrder(
      pick(customers),
      pick(governorates),
      [{ product: pick(products), qty: 1 }],
      [OrderStatus.PENDING, OrderStatus.REJECTED],
      rejectionReasons[i],
      16 + i,
    );
  }

  const total = await orderRepo.count();
  console.log(`  ↳ ${total} orders created.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

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

    console.log('\n🛒 Orders:');
    await seedOrders(ds);

    console.log('\n✅ Seed completed successfully.');
  } finally {
    await ds.destroy();
  }
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
