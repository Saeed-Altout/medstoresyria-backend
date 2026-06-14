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
import { Product, ProductCondition } from '../modules/products/entities/product.entity';
import { ProductTranslation } from '../modules/products/entities/product-translation.entity';
import { ProductImage } from '../modules/products/entities/product-image.entity';
import { AttributeDefinition, AttributeType } from '../modules/attributes/entities/attribute-definition.entity';
import { AttributeTranslation } from '../modules/attributes/entities/attribute-translation.entity';
import { ProductAttributeValue } from '../modules/attributes/entities/product-attribute-value.entity';
import { InventoryLog, InventoryLogType, InventoryLogReason } from '../modules/inventory/entities/inventory-log.entity';
import { Order, OrderStatus } from '../modules/orders/entities/order.entity';
import { OrderItem } from '../modules/orders/entities/order-item.entity';
import { OrderStatusLog } from '../modules/orders/entities/order-status-log.entity';
import { MaintenanceRequest, MaintenanceStatus, VisitType } from '../modules/maintenance/entities/maintenance-request.entity';
import { MaintenanceStatusLog } from '../modules/maintenance/entities/maintenance-status-log.entity';
import { Setting } from '../modules/settings/entities/setting.entity';
import { generateOrderNumber, generateMaintenanceNumber } from '../common/utils/generators.util';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number, hourOffset = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(d.getHours() - hourOffset);
  return d;
}

// ─── 1. GOVERNORATES ─────────────────────────────────────────────────────────

const GOVERNORATES_DATA = [
  { name: 'Damascus',    name_local: 'دمشق',       delivery_fee_usd: '3.00' },
  { name: 'Aleppo',      name_local: 'حلب',         delivery_fee_usd: '4.00' },
  { name: 'Homs',        name_local: 'حمص',         delivery_fee_usd: '5.00' },
  { name: 'Hama',        name_local: 'حماة',        delivery_fee_usd: '5.00' },
  { name: 'Latakia',     name_local: 'اللاذقية',    delivery_fee_usd: '5.00' },
  { name: 'Tartus',      name_local: 'طرطوس',       delivery_fee_usd: '5.00' },
  { name: 'Idlib',       name_local: 'إدلب',        delivery_fee_usd: '6.00' },
  { name: 'Deir ez-Zor', name_local: 'دير الزور',   delivery_fee_usd: '7.00' },
  { name: 'Raqqa',       name_local: 'الرقة',       delivery_fee_usd: '7.00' },
  { name: 'Hasakah',     name_local: 'الحسكة',      delivery_fee_usd: '7.00' },
  { name: 'Daraa',       name_local: 'درعا',        delivery_fee_usd: '6.00' },
  { name: 'As-Suwayda',  name_local: 'السويداء',    delivery_fee_usd: '6.00' },
  { name: 'Quneitra',    name_local: 'القنيطرة',    delivery_fee_usd: '6.00' },
  { name: 'Rural Damascus', name_local: 'ريف دمشق', delivery_fee_usd: '4.00' },
];

async function seedGovernorates(ds: DataSource): Promise<Governorate[]> {
  const repo = ds.getRepository(Governorate);
  const existing = await repo.find();
  if (existing.length > 0) {
    console.log(`  ↳ Governorates already seeded (${existing.length}), skipping.`);
    return existing;
  }
  const rows = GOVERNORATES_DATA.map((g) => repo.create(g));
  const saved = await repo.save(rows);
  console.log(`  ↳ Inserted ${saved.length} governorates.`);
  return saved;
}

// ─── 2. USERS (staff + customers) ────────────────────────────────────────────

async function seedUsers(ds: DataSource): Promise<Record<string, User>> {
  const repo = ds.getRepository(User);
  const hashed12 = await bcrypt.hash('Admin@123456', 12);
  const hashedStaff = await bcrypt.hash('Staff@123456', 12);
  const hashedCustomer = await bcrypt.hash('Customer@123', 10);

  const usersData = [
    // Staff
    { email: 'admin@medstore.sy',       password: hashed12,      first_name: 'Sami',    last_name: 'Altout',    role: Role.ADMIN,       phone: '+963991100001', locale: 'ar' },
    { email: 'sales@medstore.sy',        password: hashedStaff,   first_name: 'Rania',   last_name: 'Mahmoud',   role: Role.SALES,       phone: '+963991100002', locale: 'ar' },
    { email: 'warehouse@medstore.sy',    password: hashedStaff,   first_name: 'Khaled',  last_name: 'Barakat',   role: Role.WAREHOUSE,   phone: '+963991100003', locale: 'ar' },
    { email: 'tech1@medstore.sy',        password: hashedStaff,   first_name: 'Hassan',  last_name: 'Issa',      role: Role.TECHNICIAN,  phone: '+963991100004', locale: 'ar' },
    { email: 'tech2@medstore.sy',        password: hashedStaff,   first_name: 'Nour',    last_name: 'Saleh',     role: Role.TECHNICIAN,  phone: '+963991100005', locale: 'ar' },
    { email: 'delivery@medstore.sy',     password: hashedStaff,   first_name: 'Faris',   last_name: 'Qasim',     role: Role.DELIVERY,    phone: '+963991100006', locale: 'ar' },
    { email: 'accountant@medstore.sy',   password: hashedStaff,   first_name: 'Iman',    last_name: 'Haddad',    role: Role.ACCOUNTANT,  phone: '+963991100007', locale: 'ar' },
    // Customers
    { email: 'ahmad.khalil@gmail.com',   password: hashedCustomer, first_name: 'Ahmad',  last_name: 'Khalil',    role: Role.CUSTOMER,   phone: '+963931200001', locale: 'ar' },
    { email: 'sara.ibrahim@gmail.com',   password: hashedCustomer, first_name: 'Sara',   last_name: 'Ibrahim',   role: Role.CUSTOMER,   phone: '+963931200002', locale: 'ar' },
    { email: 'omar.musa@gmail.com',      password: hashedCustomer, first_name: 'Omar',   last_name: 'Musa',      role: Role.CUSTOMER,   phone: '+963931200003', locale: 'ar' },
    { email: 'lina.ali@gmail.com',       password: hashedCustomer, first_name: 'Lina',   last_name: 'Ali',       role: Role.CUSTOMER,   phone: '+963931200004', locale: 'ar' },
    { email: 'yusuf.nour@gmail.com',     password: hashedCustomer, first_name: 'Yusuf',  last_name: 'Nour',      role: Role.CUSTOMER,   phone: '+963931200005', locale: 'ar' },
    { email: 'maya.hassan@gmail.com',    password: hashedCustomer, first_name: 'Maya',   last_name: 'Hassan',    role: Role.CUSTOMER,   phone: '+963931200006', locale: 'ar' },
    { email: 'tariq.zaher@gmail.com',    password: hashedCustomer, first_name: 'Tariq',  last_name: 'Zaher',     role: Role.CUSTOMER,   phone: '+963931200007', locale: 'ar' },
  ];

  const result: Record<string, User> = {};
  for (const u of usersData) {
    let user = await repo.findOne({ where: { email: u.email } });
    if (!user) {
      user = await repo.save(repo.create({ ...u, is_active: true }));
      console.log(`  ↳ Created user: ${u.email} [${u.role}]`);
    } else {
      console.log(`  ↳ Exists: ${u.email}`);
    }
    result[u.email] = user;
  }
  return result;
}

// ─── 3. CATEGORIES ───────────────────────────────────────────────────────────

interface CategorySeed {
  slug: string;
  sort_order: number;
  en_name: string;
  ar_name: string;
  en_desc: string;
  ar_desc: string;
  children?: Array<{ slug: string; en_name: string; ar_name: string; sort_order: number }>;
}

const CATEGORIES_DATA: CategorySeed[] = [
  {
    slug: 'diagnostic-devices',
    sort_order: 1,
    en_name: 'Diagnostic Devices',
    ar_name: 'أجهزة التشخيص',
    en_desc: 'Devices used to diagnose and monitor health conditions',
    ar_desc: 'أجهزة تستخدم لتشخيص الحالات الصحية ومراقبتها',
    children: [
      { slug: 'blood-pressure-monitors', en_name: 'Blood Pressure Monitors', ar_name: 'أجهزة قياس ضغط الدم', sort_order: 1 },
      { slug: 'glucose-meters',          en_name: 'Glucose Meters',          ar_name: 'أجهزة قياس السكر',    sort_order: 2 },
      { slug: 'pulse-oximeters',         en_name: 'Pulse Oximeters',         ar_name: 'أجهزة قياس الأكسجين', sort_order: 3 },
      { slug: 'thermometers',            en_name: 'Thermometers',            ar_name: 'الميزان الحرارة',      sort_order: 4 },
    ],
  },
  {
    slug: 'respiratory-care',
    sort_order: 2,
    en_name: 'Respiratory Care',
    ar_name: 'أجهزة التنفس',
    en_desc: 'Nebulizers, CPAP, oxygen concentrators and ventilators',
    ar_desc: 'أجهزة البخار والضغط الهوائي وأجهزة الأكسجين',
    children: [
      { slug: 'nebulizers',          en_name: 'Nebulizers',          ar_name: 'أجهزة البخار',       sort_order: 1 },
      { slug: 'oxygen-concentrators',en_name: 'Oxygen Concentrators',ar_name: 'أجهزة تركيز الأكسجين', sort_order: 2 },
    ],
  },
  {
    slug: 'rehabilitation',
    sort_order: 3,
    en_name: 'Rehabilitation',
    ar_name: 'أجهزة التأهيل',
    en_desc: 'Physical therapy and rehabilitation equipment',
    ar_desc: 'معدات العلاج الطبيعي وإعادة التأهيل',
    children: [
      { slug: 'tens-units',      en_name: 'TENS Units',       ar_name: 'أجهزة التحفيز الكهربائي', sort_order: 1 },
      { slug: 'ultrasound-therapy', en_name: 'Ultrasound Therapy', ar_name: 'أجهزة الموجات فوق الصوتية', sort_order: 2 },
    ],
  },
  {
    slug: 'hospital-furniture',
    sort_order: 4,
    en_name: 'Hospital Furniture',
    ar_name: 'أثاث المستشفى',
    en_desc: 'Hospital beds, wheelchairs, and examination tables',
    ar_desc: 'أسرة المستشفى وكراسي الإعاقة وطاولات الفحص',
    children: [
      { slug: 'wheelchairs',        en_name: 'Wheelchairs',        ar_name: 'كراسي متحركة',        sort_order: 1 },
      { slug: 'hospital-beds',      en_name: 'Hospital Beds',      ar_name: 'أسرة مستشفى',         sort_order: 2 },
    ],
  },
  {
    slug: 'surgical-instruments',
    sort_order: 5,
    en_name: 'Surgical Instruments',
    ar_name: 'الأدوات الجراحية',
    en_desc: 'Surgical tools and sterilization equipment',
    ar_desc: 'أدوات جراحية وأجهزة التعقيم',
  },
  {
    slug: 'lab-equipment',
    sort_order: 6,
    en_name: 'Laboratory Equipment',
    ar_name: 'معدات المختبر',
    en_desc: 'Laboratory analyzers, centrifuges and microscopes',
    ar_desc: 'محللات المختبر وأجهزة الطرد المركزي والمجاهر',
  },
];

async function seedCategories(ds: DataSource): Promise<Record<string, Category>> {
  const catRepo   = ds.getRepository(Category);
  const transRepo = ds.getRepository(CategoryTranslation);
  const result: Record<string, Category> = {};

  async function upsertCategory(data: {
    slug: string; en_name: string; ar_name: string;
    en_desc?: string; ar_desc?: string; sort_order?: number;
  }, parent?: Category): Promise<Category> {
    let cat = await catRepo.findOne({ where: { slug: data.slug } });
    if (!cat) {
      cat = catRepo.create({ slug: data.slug, sort_order: data.sort_order ?? 0, parent: parent ?? null });
      cat = await catRepo.save(cat);
      await transRepo.save([
        transRepo.create({ locale: 'en', name: data.en_name, description: data.en_desc ?? null, category: cat }),
        transRepo.create({ locale: 'ar', name: data.ar_name, description: data.ar_desc ?? null, category: cat }),
      ]);
      console.log(`  ↳ Category: ${data.slug}`);
    }
    return cat;
  }

  for (const c of CATEGORIES_DATA) {
    const parent = await upsertCategory(c);
    result[c.slug] = parent;
    if (c.children) {
      for (const child of c.children) {
        const childCat = await upsertCategory({ ...child, en_desc: undefined, ar_desc: undefined }, parent);
        result[child.slug] = childCat;
      }
    }
  }
  return result;
}

// ─── 4. BRANDS ───────────────────────────────────────────────────────────────

const BRANDS_DATA = [
  { slug: 'omron',       en_name: 'Omron',       ar_name: 'أومرون',      en_desc: 'Leading Japanese medical devices brand',         ar_desc: 'علامة يابانية رائدة في الأجهزة الطبية',        website: 'https://www.omron-healthcare.com' },
  { slug: 'beurer',      en_name: 'Beurer',      ar_name: 'بيورر',       en_desc: 'German health and wellbeing technology',         ar_desc: 'تقنية ألمانية للصحة والعافية',                  website: 'https://www.beurer.com' },
  { slug: 'philips',     en_name: 'Philips',     ar_name: 'فيليبس',      en_desc: 'Global leader in health technology',            ar_desc: 'الرائد العالمي في تكنولوجيا الصحة',             website: 'https://www.philips.com' },
  { slug: 'mindray',     en_name: 'Mindray',     ar_name: 'مايندراي',    en_desc: 'Chinese medical equipment manufacturer',        ar_desc: 'شركة صينية متخصصة في المعدات الطبية',           website: 'https://www.mindray.com' },
  { slug: 'welch-allyn', en_name: 'Welch Allyn', ar_name: 'ويلش آلين',   en_desc: 'Professional diagnostic instruments',           ar_desc: 'أدوات تشخيصية احترافية',                       website: 'https://www.welchallyn.com' },
  { slug: 'invacare',    en_name: 'Invacare',    ar_name: 'إنفاكير',     en_desc: 'Rehabilitation and home care products',         ar_desc: 'منتجات إعادة التأهيل والرعاية المنزلية',        website: 'https://www.invacare.com' },
  { slug: 'siemens-healthineers', en_name: 'Siemens Healthineers', ar_name: 'سيمنس هيلثنيرز', en_desc: 'Pioneer in medical technology', ar_desc: 'رائدة في التكنولوجيا الطبية', website: null },
];

async function seedBrands(ds: DataSource): Promise<Record<string, Brand>> {
  const brandRepo = ds.getRepository(Brand);
  const transRepo = ds.getRepository(BrandTranslation);
  const result: Record<string, Brand> = {};

  for (const b of BRANDS_DATA) {
    let brand = await brandRepo.findOne({ where: { slug: b.slug } });
    if (!brand) {
      brand = await brandRepo.save(brandRepo.create({ slug: b.slug, website: b.website, is_active: true }));
      await transRepo.save([
        transRepo.create({ locale: 'en', name: b.en_name, description: b.en_desc, brand }),
        transRepo.create({ locale: 'ar', name: b.ar_name, description: b.ar_desc, brand }),
      ]);
      console.log(`  ↳ Brand: ${b.slug}`);
    }
    result[b.slug] = brand;
  }
  return result;
}

// ─── 5. ATTRIBUTE DEFINITIONS ────────────────────────────────────────────────

async function seedAttributes(
  ds: DataSource,
  categories: Record<string, Category>,
): Promise<void> {
  const defRepo   = ds.getRepository(AttributeDefinition);
  const transRepo = ds.getRepository(AttributeTranslation);

  const ATTRS: Array<{
    categorySlug: string;
    key: string;
    type: AttributeType;
    options?: string[];
    sort_order: number;
    en_label: string;
    ar_label: string;
  }> = [
    // Blood pressure monitors
    { categorySlug: 'blood-pressure-monitors', key: 'cuff_size',     type: AttributeType.SELECT, options: ['Small (17-22cm)', 'Medium (22-32cm)', 'Large (32-42cm)'], sort_order: 1, en_label: 'Cuff Size',      ar_label: 'حجم الكفة'         },
    { categorySlug: 'blood-pressure-monitors', key: 'memory_slots',  type: AttributeType.NUMBER, sort_order: 2, en_label: 'Memory Slots',   ar_label: 'خانات الذاكرة'     },
    { categorySlug: 'blood-pressure-monitors', key: 'bluetooth',     type: AttributeType.BOOLEAN, sort_order: 3, en_label: 'Bluetooth',      ar_label: 'بلوتوث'            },
    // Glucose meters
    { categorySlug: 'glucose-meters',          key: 'test_time_sec', type: AttributeType.NUMBER,  sort_order: 1, en_label: 'Test Time (sec)', ar_label: 'وقت القياس (ثانية)' },
    { categorySlug: 'glucose-meters',          key: 'memory_slots',  type: AttributeType.NUMBER,  sort_order: 2, en_label: 'Memory Slots',   ar_label: 'خانات الذاكرة'     },
    // Nebulizers
    { categorySlug: 'nebulizers',              key: 'nebulizer_type',type: AttributeType.SELECT,  options: ['Compressor', 'Ultrasonic', 'Mesh'], sort_order: 1, en_label: 'Type',           ar_label: 'النوع'             },
    { categorySlug: 'nebulizers',              key: 'particle_size', type: AttributeType.TEXT,    sort_order: 2, en_label: 'Particle Size',  ar_label: 'حجم الجسيمات'      },
    // Wheelchairs
    { categorySlug: 'wheelchairs',             key: 'max_weight_kg', type: AttributeType.NUMBER,  sort_order: 1, en_label: 'Max Weight (kg)',ar_label: 'الحد الأقصى للوزن (كغ)' },
    { categorySlug: 'wheelchairs',             key: 'foldable',      type: AttributeType.BOOLEAN, sort_order: 2, en_label: 'Foldable',       ar_label: 'قابل للطي'         },
    { categorySlug: 'wheelchairs',             key: 'seat_width_cm', type: AttributeType.NUMBER,  sort_order: 3, en_label: 'Seat Width (cm)',ar_label: 'عرض المقعد (سم)'   },
    // Oxygen concentrators
    { categorySlug: 'oxygen-concentrators',    key: 'flow_rate_lpm', type: AttributeType.NUMBER,  sort_order: 1, en_label: 'Flow Rate (L/min)', ar_label: 'معدل التدفق (ل/دقيقة)' },
    { categorySlug: 'oxygen-concentrators',    key: 'purity_pct',    type: AttributeType.NUMBER,  sort_order: 2, en_label: 'O₂ Purity %',   ar_label: 'نقاء الأكسجين %'  },
  ];

  for (const a of ATTRS) {
    const cat = categories[a.categorySlug];
    if (!cat) continue;
    const existing = await defRepo.findOne({ where: { key: a.key, category: { id: cat.id } } });
    if (existing) continue;
    const def = await defRepo.save(defRepo.create({
      key: a.key, type: a.type, options: a.options ?? null,
      is_required: false, sort_order: a.sort_order, category: cat,
    }));
    await transRepo.save([
      transRepo.create({ locale: 'en', label: a.en_label, attributeDefinition: def }),
      transRepo.create({ locale: 'ar', label: a.ar_label, attributeDefinition: def }),
    ]);
  }
  console.log(`  ↳ Attribute definitions seeded.`);
}

// ─── 6. PRODUCTS ─────────────────────────────────────────────────────────────

interface ProductSeed {
  slug: string;
  condition: ProductCondition;
  price_usd: string;
  stock_qty: number;
  stock_min: number;
  is_featured: boolean;
  brandSlug: string | null;
  categorySlug: string;
  en_name: string;
  ar_name: string;
  en_desc: string;
  ar_desc: string;
  en_condition_report?: string;
  ar_condition_report?: string;
  image_url: string;
  attributes?: Record<string, string>;
}

// Using Unsplash source URLs for realistic medical images
const PRODUCTS_DATA: ProductSeed[] = [
  // ── Blood Pressure Monitors ──────────────────────────────────────────────
  {
    slug: 'omron-m3-blood-pressure-new',
    condition: ProductCondition.NEW, price_usd: '45.00', stock_qty: 12, stock_min: 3,
    is_featured: true, brandSlug: 'omron', categorySlug: 'blood-pressure-monitors',
    en_name: 'Omron M3 Upper Arm Blood Pressure Monitor',
    ar_name: 'جهاز أومرون M3 لقياس ضغط الدم من الذراع',
    en_desc: 'Clinically validated upper arm blood pressure monitor with Intelli Wrap Cuff for accurate readings regardless of cuff position. Stores up to 60 readings per user with date and time.',
    ar_desc: 'جهاز قياس ضغط الدم من الذراع معتمد سريرياً مع كفة Intelli Wrap للحصول على قراءات دقيقة بغض النظر عن وضع الكفة. يخزن حتى 60 قراءة لكل مستخدم مع التاريخ والوقت.',
    image_url: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=500',
    attributes: { cuff_size: 'Medium (22-32cm)', memory_slots: '60', bluetooth: 'false' },
  },
  {
    slug: 'omron-m7-blood-pressure-new',
    condition: ProductCondition.NEW, price_usd: '68.00', stock_qty: 8, stock_min: 3,
    is_featured: true, brandSlug: 'omron', categorySlug: 'blood-pressure-monitors',
    en_name: 'Omron M7 Intelli IT Blood Pressure Monitor',
    ar_name: 'جهاز أومرون M7 الذكي لقياس ضغط الدم',
    en_desc: 'Advanced blood pressure monitor with Bluetooth connectivity, compatible with the Omron Connect app. Stores 100 readings per user and detects irregular heartbeat.',
    ar_desc: 'جهاز قياس ضغط الدم المتقدم مع اتصال Bluetooth ومتوافق مع تطبيق Omron Connect. يخزن 100 قراءة لكل مستخدم ويكشف عن ضربات القلب غير المنتظمة.',
    image_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500',
    attributes: { cuff_size: 'Large (32-42cm)', memory_slots: '100', bluetooth: 'true' },
  },
  {
    slug: 'beurer-bm54-blood-pressure-used',
    condition: ProductCondition.USED, price_usd: '28.00', stock_qty: 3, stock_min: 1,
    is_featured: false, brandSlug: 'beurer', categorySlug: 'blood-pressure-monitors',
    en_name: 'Beurer BM54 Bluetooth Blood Pressure Monitor (Used)',
    ar_name: 'جهاز بيورر BM54 لقياس ضغط الدم بالبلوتوث (مستعمل)',
    en_desc: 'Upper arm blood pressure monitor with Bluetooth app connectivity. Stores 60 readings per user. In good working condition with minor surface wear.',
    ar_desc: 'جهاز قياس ضغط الدم من الذراع مع اتصال بالبلوتوث. يخزن 60 قراءة لكل مستخدم. في حالة جيدة مع بعض الخدوش السطحية.',
    en_condition_report: 'Device tested and fully functional. Minor scratches on the casing. Battery contacts clean. Cuff in excellent condition.',
    ar_condition_report: 'الجهاز مختبر ويعمل بكفاءة كاملة. خدوش بسيطة على الغلاف. الكفة في حالة ممتازة.',
    image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500',
    attributes: { cuff_size: 'Medium (22-32cm)', memory_slots: '60', bluetooth: 'true' },
  },

  // ── Glucose Meters ───────────────────────────────────────────────────────
  {
    slug: 'omron-glucocard-g500-new',
    condition: ProductCondition.NEW, price_usd: '32.00', stock_qty: 15, stock_min: 5,
    is_featured: true, brandSlug: 'omron', categorySlug: 'glucose-meters',
    en_name: 'Omron HGM-114 Blood Glucose Meter',
    ar_name: 'جهاز أومرون HGM-114 لقياس سكر الدم',
    en_desc: 'Fast and accurate blood glucose meter with 5-second test results. No coding required. Stores 500 test results with date and time.',
    ar_desc: 'جهاز قياس سكر الدم السريع والدقيق مع نتائج خلال 5 ثوانٍ. لا يتطلب ترميزاً. يخزن 500 نتيجة اختبار مع التاريخ والوقت.',
    image_url: 'https://images.unsplash.com/photo-1612528443702-f6741f70a049?w=500',
    attributes: { test_time_sec: '5', memory_slots: '500' },
  },
  {
    slug: 'beurer-gl44-glucose-new',
    condition: ProductCondition.NEW, price_usd: '27.00', stock_qty: 10, stock_min: 3,
    is_featured: false, brandSlug: 'beurer', categorySlug: 'glucose-meters',
    en_name: 'Beurer GL44 Blood Glucose Monitor',
    ar_name: 'جهاز بيورر GL44 لمراقبة سكر الدم',
    en_desc: 'Compact blood glucose monitor with large display and 7/14/30-day average function. Includes lancing device and 10 test strips.',
    ar_desc: 'جهاز مراقبة سكر الدم المدمج مع شاشة كبيرة ووظيفة المتوسط لـ 7/14/30 يوماً. يشمل جهاز الوخز و10 شرائح اختبار.',
    image_url: 'https://images.unsplash.com/photo-1619615173197-4cb7c3daa1c6?w=500',
    attributes: { test_time_sec: '7', memory_slots: '360' },
  },

  // ── Pulse Oximeters ──────────────────────────────────────────────────────
  {
    slug: 'beurer-po30-pulse-oximeter-new',
    condition: ProductCondition.NEW, price_usd: '18.00', stock_qty: 20, stock_min: 5,
    is_featured: true, brandSlug: 'beurer', categorySlug: 'pulse-oximeters',
    en_name: 'Beurer PO30 Pulse Oximeter',
    ar_name: 'جهاز بيورر PO30 لقياس الأكسجين',
    en_desc: 'Fingertip pulse oximeter displaying SpO2 and pulse rate. Large backlit display. Suitable for all ages.',
    ar_desc: 'جهاز قياس الأكسجين في الدم يعرض SpO2 ومعدل النبض. شاشة كبيرة مضيئة. مناسب لجميع الأعمار.',
    image_url: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=500',
    attributes: {},
  },
  {
    slug: 'wellue-o2ring-oximeter-new',
    condition: ProductCondition.NEW, price_usd: '89.00', stock_qty: 5, stock_min: 2,
    is_featured: false, brandSlug: null, categorySlug: 'pulse-oximeters',
    en_name: 'Wellue O2Ring Continuous Oxygen Monitor',
    ar_name: 'جهاز ويللو O2Ring لمراقبة الأكسجين المستمرة',
    en_desc: 'Wearable ring-style continuous oxygen monitor with vibration alarm, Bluetooth sync, and 16-hour battery life.',
    ar_desc: 'جهاز مراقبة مستمرة للأكسجين على شكل خاتم مع إنذار بالاهتزاز ومزامنة بالبلوتوث وبطارية تدوم 16 ساعة.',
    image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500',
    attributes: {},
  },

  // ── Thermometers ─────────────────────────────────────────────────────────
  {
    slug: 'beurer-ft90-thermometer-new',
    condition: ProductCondition.NEW, price_usd: '22.00', stock_qty: 18, stock_min: 5,
    is_featured: false, brandSlug: 'beurer', categorySlug: 'thermometers',
    en_name: 'Beurer FT90 Non-contact Forehead Thermometer',
    ar_name: 'ميزان حرارة بيورر FT90 بدون لمس للجبهة',
    en_desc: 'Non-contact infrared thermometer for forehead and surface temperature measurement. 3-color fever alarm. 60 memory slots.',
    ar_desc: 'ميزان حرارة بالأشعة تحت الحمراء بدون لمس لقياس درجة حرارة الجبهة والأسطح. إنذار حمى بثلاثة ألوان. 60 خانة ذاكرة.',
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500',
    attributes: {},
  },

  // ── Nebulizers ───────────────────────────────────────────────────────────
  {
    slug: 'omron-c28p-nebulizer-new',
    condition: ProductCondition.NEW, price_usd: '55.00', stock_qty: 9, stock_min: 3,
    is_featured: true, brandSlug: 'omron', categorySlug: 'nebulizers',
    en_name: 'Omron C28P Compressor Nebulizer',
    ar_name: 'جهاز البخار أومرون C28P بالضاغط',
    en_desc: 'High-performance compressor nebulizer for effective respiratory treatment. VVT technology delivers fine aerosol particles deep into the respiratory tract.',
    ar_desc: 'جهاز بخار عالي الأداء بالضاغط للعلاج التنفسي الفعال. تقنية VVT تولد جسيمات رذاذ دقيقة تصل إلى أعماق الجهاز التنفسي.',
    image_url: 'https://images.unsplash.com/photo-1584115202614-47d4a5a9a5b5?w=500',
    attributes: { nebulizer_type: 'Compressor', particle_size: '1-5 μm MMAD' },
  },
  {
    slug: 'philips-innospire-nebulizer-new',
    condition: ProductCondition.NEW, price_usd: '72.00', stock_qty: 6, stock_min: 2,
    is_featured: false, brandSlug: 'philips', categorySlug: 'nebulizers',
    en_name: 'Philips InnoSpire Go Mesh Nebulizer',
    ar_name: 'جهاز بخار فيليبس InnoSpire Go الشبكي',
    en_desc: 'Ultra-portable mesh nebulizer that fits in the palm of your hand. Near silent operation, 4-minute treatment time, compatible with most common medications.',
    ar_desc: 'جهاز بخار شبكي محمول للغاية يمكن حمله في راحة اليد. تشغيل شبه صامت، وقت علاج 4 دقائق، متوافق مع معظم الأدوية الشائعة.',
    image_url: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=500',
    attributes: { nebulizer_type: 'Mesh', particle_size: '2-4 μm MMAD' },
  },
  {
    slug: 'omron-c24-nebulizer-used',
    condition: ProductCondition.USED, price_usd: '30.00', stock_qty: 2, stock_min: 1,
    is_featured: false, brandSlug: 'omron', categorySlug: 'nebulizers',
    en_name: 'Omron C24 Compressor Nebulizer (Used)',
    ar_name: 'جهاز بخار أومرون C24 (مستعمل)',
    en_desc: 'Reliable compressor nebulizer in good working condition. Ideal for home use respiratory therapy.',
    ar_desc: 'جهاز بخار بالضاغط موثوق في حالة جيدة. مثالي للعلاج التنفسي المنزلي.',
    en_condition_report: 'Device fully functional. New mask and tubing included. Compressor motor tested — normal output. Minor discoloration on casing.',
    ar_condition_report: 'الجهاز يعمل بشكل كامل. يشمل ماسك وأنبوب جديدين. تم اختبار محرك الضاغط ويعمل بشكل طبيعي. تغير بسيط في لون الغلاف.',
    image_url: 'https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?w=500',
    attributes: { nebulizer_type: 'Compressor', particle_size: '2-5 μm MMAD' },
  },

  // ── Oxygen Concentrators ─────────────────────────────────────────────────
  {
    slug: 'philips-respironics-5lpm-new',
    condition: ProductCondition.NEW, price_usd: '420.00', stock_qty: 4, stock_min: 1,
    is_featured: true, brandSlug: 'philips', categorySlug: 'oxygen-concentrators',
    en_name: 'Philips Respironics EverFlo 5L Oxygen Concentrator',
    ar_name: 'مركز أكسجين فيليبس Respironics EverFlo 5 لتر',
    en_desc: 'Lightweight, quiet, and energy-efficient 5 LPM oxygen concentrator. Suitable for home oxygen therapy. Includes built-in OPI for oxygen output monitoring.',
    ar_desc: 'مركز أكسجين خفيف الوزن وهادئ وموفر للطاقة بسعة 5 لتر/دقيقة. مناسب لعلاج الأكسجين المنزلي. يتضمن OPI مدمج لمراقبة إخراج الأكسجين.',
    image_url: 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?w=500',
    attributes: { flow_rate_lpm: '5', purity_pct: '95.6' },
  },
  {
    slug: 'invacare-perfecto2-10lpm-used',
    condition: ProductCondition.USED, price_usd: '280.00', stock_qty: 2, stock_min: 1,
    is_featured: false, brandSlug: 'invacare', categorySlug: 'oxygen-concentrators',
    en_name: 'Invacare Perfecto2 10L Oxygen Concentrator (Used)',
    ar_name: 'مركز أكسجين إنفاكير Perfecto2 10 لتر (مستعمل)',
    en_desc: 'High-capacity 10 LPM oxygen concentrator suitable for clinical and home use. Previously used in a private clinic.',
    ar_desc: 'مركز أكسجين عالي السعة 10 لتر/دقيقة مناسب للاستخدام السريري والمنزلي. مستخدم سابقاً في عيادة خاصة.',
    en_condition_report: 'Serviced and cleaned. Molecular sieve replaced 300 hours ago. Oxygen purity confirmed at 93.5% at 10 LPM. All alarms functional.',
    ar_condition_report: 'تمت الصيانة والتنظيف. تم استبدال الغربال الجزيئي قبل 300 ساعة. نقاء الأكسجين مؤكد عند 93.5% بـ 10 لتر/دقيقة. جميع الإنذارات تعمل.',
    image_url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=500',
    attributes: { flow_rate_lpm: '10', purity_pct: '93.5' },
  },

  // ── Wheelchairs ──────────────────────────────────────────────────────────
  {
    slug: 'invacare-rea-azalea-wheelchair-new',
    condition: ProductCondition.NEW, price_usd: '185.00', stock_qty: 6, stock_min: 2,
    is_featured: false, brandSlug: 'invacare', categorySlug: 'wheelchairs',
    en_name: 'Invacare Azalea Standard Wheelchair',
    ar_name: 'كرسي متحرك إنفاكير أزاليا القياسي',
    en_desc: 'Lightweight folding wheelchair with swing-away footrests and adjustable armrests. Maximum user weight 115 kg. Available in 43cm and 46cm seat widths.',
    ar_desc: 'كرسي متحرك خفيف الوزن وقابل للطي مع مساند قدم قابلة للإزالة ومساند ذراع قابلة للتعديل. الحد الأقصى لوزن المستخدم 115 كغ.',
    image_url: 'https://images.unsplash.com/photo-1619468129361-605ebea04b44?w=500',
    attributes: { max_weight_kg: '115', foldable: 'true', seat_width_cm: '46' },
  },
  {
    slug: 'invacare-action3-wheelchair-used',
    condition: ProductCondition.USED, price_usd: '95.00', stock_qty: 3, stock_min: 1,
    is_featured: false, brandSlug: 'invacare', categorySlug: 'wheelchairs',
    en_name: 'Invacare Action 3 NG Wheelchair (Used)',
    ar_name: 'كرسي متحرك إنفاكير Action 3 NG (مستعمل)',
    en_desc: 'Self-propelling wheelchair in good condition. Seat 43cm wide. Both rear wheels have good tread.',
    ar_desc: 'كرسي متحرك ذاتي الدفع في حالة جيدة. مقعد بعرض 43 سم. عجلات خلفية ذات مداس جيد.',
    en_condition_report: 'Frame inspected — no cracks or bends. Upholstery worn but intact. Brakes functional. Rear wheels have good remaining tread. Footrests replaced.',
    ar_condition_report: 'تم فحص الإطار — لا توجد شقوق أو انحناءات. المفروشات بالية لكن سليمة. الفرامل تعمل. الإطارات الخلفية لديها مداس جيد. تم استبدال مساند القدم.',
    image_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500',
    attributes: { max_weight_kg: '100', foldable: 'true', seat_width_cm: '43' },
  },

  // ── Hospital Beds ────────────────────────────────────────────────────────
  {
    slug: 'mindray-electric-hospital-bed-new',
    condition: ProductCondition.NEW, price_usd: '890.00', stock_qty: 3, stock_min: 1,
    is_featured: true, brandSlug: 'mindray', categorySlug: 'hospital-beds',
    en_name: 'Mindray Electric Adjustable Hospital Bed',
    ar_name: 'سرير مستشفى كهربائي قابل للتعديل من مايندراي',
    en_desc: '3-function electric hospital bed with adjustable backrest, knee rest and height. Includes side rails, IV pole socket, and castors with brakes. Load capacity: 250kg.',
    ar_desc: 'سرير مستشفى كهربائي ثلاثي الوظائف مع ظهر ومساند ركبة وارتفاع قابل للتعديل. يشمل حواجز جانبية وموصل قضيب التسريب وعجلات بفرامل. طاقة تحمل: 250 كغ.',
    image_url: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=500',
    attributes: {},
  },

  // ── TENS Units ───────────────────────────────────────────────────────────
  {
    slug: 'beurer-em49-tens-new',
    condition: ProductCondition.NEW, price_usd: '38.00', stock_qty: 14, stock_min: 4,
    is_featured: false, brandSlug: 'beurer', categorySlug: 'tens-units',
    en_name: 'Beurer EM49 2-in-1 Digital TENS/EMS Device',
    ar_name: 'جهاز بيورر EM49 للتحفيز الكهربائي TENS/EMS',
    en_desc: 'Combines TENS for pain relief and EMS for muscle training. 8 electrodes, 60 programs, adjustable intensity. Includes carrying case.',
    ar_desc: 'يجمع بين TENS لتخفيف الألم وEMS لتدريب العضلات. 8 أقطاب، 60 برنامجاً، شدة قابلة للتعديل. يشمل حقيبة حمل.',
    image_url: 'https://images.unsplash.com/photo-1544717684-1243da23b545?w=500',
    attributes: {},
  },

  // ── Lab Equipment ────────────────────────────────────────────────────────
  {
    slug: 'mindray-bc30-hematology-analyzer-used',
    condition: ProductCondition.USED, price_usd: '1800.00', stock_qty: 1, stock_min: 1,
    is_featured: true, brandSlug: 'mindray', categorySlug: 'lab-equipment',
    en_name: 'Mindray BC-30 Auto Hematology Analyzer (Used)',
    ar_name: 'محلل دم أوتوماتيكي مايندراي BC-30 (مستعمل)',
    en_desc: '3-part differential hematology analyzer with a throughput of 60 samples/hour. 19 parameters, built-in thermal printer.',
    ar_desc: 'محلل دموي أوتوماتيكي بـ 3 أجزاء مع إنتاجية 60 عينة/ساعة. 19 معلمة، طابعة حرارية مدمجة.',
    en_condition_report: 'Recently calibrated. All 19 parameters verified against reference controls. Minor cosmetic wear on casing. Original manuals included.',
    ar_condition_report: 'تم المعايرة مؤخراً. تم التحقق من جميع المعلمات الـ 19 مقابل ضوابط مرجعية. بلى مظهري بسيط على الغلاف. يشمل الأدلة الأصلية.',
    image_url: 'https://images.unsplash.com/photo-1614308457932-e46e384e9d64?w=500',
    attributes: {},
  },
  {
    slug: 'siemens-clinitest-urine-analyzer-new',
    condition: ProductCondition.NEW, price_usd: '650.00', stock_qty: 2, stock_min: 1,
    is_featured: false, brandSlug: 'siemens-healthineers', categorySlug: 'lab-equipment',
    en_name: 'Siemens Clinitek Status+ Urine Analyzer',
    ar_name: 'محلل البول سيمنس Clinitek Status+',
    en_desc: 'Portable urine analyzer for reliable semi-quantitative urinalysis. Reads up to 11 parameters. Wireless connectivity for data transfer.',
    ar_desc: 'محلل بول محمول لتحليل البول شبه الكمي الموثوق. يقرأ حتى 11 معلمة. اتصال لاسلكي لنقل البيانات.',
    image_url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=500',
    attributes: {},
  },

  // ── Surgical Instruments ─────────────────────────────────────────────────
  {
    slug: 'welch-allyn-otoscope-set-new',
    condition: ProductCondition.NEW, price_usd: '120.00', stock_qty: 7, stock_min: 2,
    is_featured: false, brandSlug: 'welch-allyn', categorySlug: 'surgical-instruments',
    en_name: 'Welch Allyn Diagnostic Set (Otoscope + Ophthalmoscope)',
    ar_name: 'طقم تشخيص ويلش آلين (منظار أذن + منظار عين)',
    en_desc: 'Classic diagnostic set including 3.5V otoscope and ophthalmoscope on a lithium-ion handle. Standard for ENT and general practice examination.',
    ar_desc: 'طقم تشخيصي كلاسيكي يشمل منظار أذن 3.5 فولت ومنظار عين على مقبض ليثيوم أيون. معيار لفحوصات الأذن والأنف والحنجرة والممارسة العامة.',
    image_url: 'https://images.unsplash.com/photo-1578496481449-cf2e845cc00c?w=500',
    attributes: {},
  },
];

async function seedProducts(
  ds: DataSource,
  categories: Record<string, Category>,
  brands: Record<string, Brand>,
  adminUser: User,
): Promise<Product[]> {
  const productRepo = ds.getRepository(Product);
  const transRepo   = ds.getRepository(ProductTranslation);
  const imageRepo   = ds.getRepository(ProductImage);
  const attrDefRepo = ds.getRepository(AttributeDefinition);
  const attrValRepo = ds.getRepository(ProductAttributeValue);
  const logRepo     = ds.getRepository(InventoryLog);

  const saved: Product[] = [];

  for (const p of PRODUCTS_DATA) {
    let product = await productRepo.findOne({ where: { slug: p.slug } });
    if (product) {
      console.log(`  ↳ Product exists: ${p.slug}`);
      saved.push(product);
      continue;
    }

    const cat   = categories[p.categorySlug] ?? null;
    const brand = p.brandSlug ? (brands[p.brandSlug] ?? null) : null;

    product = await productRepo.save(productRepo.create({
      slug: p.slug,
      condition: p.condition,
      price_usd: p.price_usd,
      stock_qty: p.stock_qty,
      stock_min: p.stock_min,
      is_active: true,
      is_featured: p.is_featured,
      category: cat,
      brand,
    }));

    // Translations
    await transRepo.save([
      transRepo.create({ locale: 'en', name: p.en_name, description: p.en_desc, condition_report: p.en_condition_report ?? null, product }),
      transRepo.create({ locale: 'ar', name: p.ar_name, description: p.ar_desc, condition_report: p.ar_condition_report ?? null, product }),
    ]);

    // Primary image
    await imageRepo.save(imageRepo.create({ url: p.image_url, is_primary: true, sort_order: 0, product }));

    // Attribute values
    if (p.attributes && cat) {
      for (const [key, value] of Object.entries(p.attributes)) {
        const attrDef = await attrDefRepo.findOne({ where: { key, category: { id: cat.id } } });
        if (attrDef) {
          await attrValRepo.save(attrValRepo.create({ value: String(value), product, attributeDefinition: attrDef }));
        }
      }
    }

    // Initial inventory log
    await logRepo.save(logRepo.create({
      type: InventoryLogType.IN,
      quantity: p.stock_qty,
      reason: InventoryLogReason.INITIAL,
      product,
      user: adminUser,
    }));

    saved.push(product);
    console.log(`  ↳ Product: ${p.slug} (stock: ${p.stock_qty})`);
  }

  return saved;
}

// ─── 7. ORDERS ────────────────────────────────────────────────────────────────

async function seedOrders(
  ds: DataSource,
  products: Product[],
  governorates: Governorate[],
  users: Record<string, User>,
  adminUser: User,
): Promise<void> {
  const orderRepo = ds.getRepository(Order);
  const existing  = await orderRepo.count();
  if (existing > 0) {
    console.log(`  ↳ Orders already seeded (${existing}), skipping.`);
    return;
  }

  const customers = Object.values(users).filter((u) => u.role === Role.CUSTOMER);
  const transRepo = ds.getRepository(ProductTranslation);
  const itemRepo  = ds.getRepository(OrderItem);
  const logRepo   = ds.getRepository(OrderStatusLog);

  async function getName(product: Product): Promise<string> {
    const t = await transRepo.findOne({ where: { product: { id: product.id }, locale: 'en' } });
    return t?.name ?? product.slug;
  }

  const addresses = [
    'شارع بغداد، بناء 14، الطابق 3',
    'حي الشعلان، شارع الجلاء، بناء 7',
    'المزة، شارع فلسطين، بناء 22',
    'ساروجة، شارع 29 مايو، بناء 5',
    'برامكة، قرب الجامعة، بناء 12',
    'أبو رمانة، شارع أبو رمانة، بناء 3',
    'المهاجرين، شارع المتنبي، بناء 9',
  ];

  type OrderSpec = {
    customer: User;
    gov: Governorate;
    items: Array<{ product: Product; qty: number }>;
    flow: OrderStatus[];
    daysBack: number;
    note?: string;
    rejectionReason?: string;
  };

  const specs: OrderSpec[] = [
    // Pending (4)
    { customer: customers[0], gov: governorates[0], items: [{ product: products[0], qty: 1 }], flow: [OrderStatus.PENDING], daysBack: 0 },
    { customer: customers[1], gov: governorates[1], items: [{ product: products[3], qty: 2 }], flow: [OrderStatus.PENDING], daysBack: 1 },
    { customer: customers[2], gov: governorates[2], items: [{ product: products[6], qty: 1 }], flow: [OrderStatus.PENDING], daysBack: 1 },
    { customer: customers[3], gov: governorates[3], items: [{ product: products[12], qty: 1 }], flow: [OrderStatus.PENDING], daysBack: 2 },
    // Confirmed (3)
    { customer: customers[4], gov: governorates[4], items: [{ product: products[1], qty: 1 }, { product: products[5], qty: 1 }], flow: [OrderStatus.PENDING, OrderStatus.CONFIRMED], daysBack: 3 },
    { customer: customers[0], gov: governorates[0], items: [{ product: products[8], qty: 1 }], flow: [OrderStatus.PENDING, OrderStatus.CONFIRMED], daysBack: 4 },
    { customer: customers[2], gov: governorates[5], items: [{ product: products[14], qty: 1 }], flow: [OrderStatus.PENDING, OrderStatus.CONFIRMED], daysBack: 5 },
    // Preparing (2)
    { customer: customers[1], gov: governorates[1], items: [{ product: products[9], qty: 1 }], flow: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING], daysBack: 6 },
    { customer: customers[3], gov: governorates[6], items: [{ product: products[2], qty: 1 }, { product: products[4], qty: 1 }], flow: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING], daysBack: 7 },
    // Shipped (2)
    { customer: customers[5], gov: governorates[7], items: [{ product: products[10], qty: 1 }], flow: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.SHIPPED], daysBack: 9 },
    { customer: customers[6], gov: governorates[0], items: [{ product: products[7], qty: 1 }], flow: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.SHIPPED], daysBack: 10 },
    // Delivered (5)
    { customer: customers[0], gov: governorates[0], items: [{ product: products[0], qty: 1 }], flow: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.SHIPPED, OrderStatus.DELIVERED], daysBack: 12 },
    { customer: customers[1], gov: governorates[1], items: [{ product: products[3], qty: 1 }, { product: products[6], qty: 1 }], flow: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.SHIPPED, OrderStatus.DELIVERED], daysBack: 15 },
    { customer: customers[2], gov: governorates[2], items: [{ product: products[11], qty: 1 }], flow: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.SHIPPED, OrderStatus.DELIVERED], daysBack: 18 },
    { customer: customers[4], gov: governorates[4], items: [{ product: products[13], qty: 1 }], flow: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.SHIPPED, OrderStatus.DELIVERED], daysBack: 22 },
    { customer: customers[6], gov: governorates[0], items: [{ product: products[1], qty: 2 }], flow: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.SHIPPED, OrderStatus.DELIVERED], daysBack: 25 },
    // Cancelled (2)
    { customer: customers[3], gov: governorates[3], items: [{ product: products[5], qty: 1 }], flow: [OrderStatus.PENDING, OrderStatus.CANCELLED], daysBack: 14, note: 'Customer requested cancellation' },
    { customer: customers[5], gov: governorates[8], items: [{ product: products[15], qty: 1 }], flow: [OrderStatus.PENDING, OrderStatus.CANCELLED], daysBack: 20 },
    // Rejected (2)
    { customer: customers[2], gov: governorates[5], items: [{ product: products[16], qty: 1 }], flow: [OrderStatus.PENDING, OrderStatus.REJECTED], daysBack: 17, rejectionReason: 'Product out of stock at time of fulfillment' },
    { customer: customers[6], gov: governorates[9], items: [{ product: products[8], qty: 1 }], flow: [OrderStatus.PENDING, OrderStatus.REJECTED], daysBack: 30, rejectionReason: 'Delivery address unreachable in this region' },
  ];

  for (const spec of specs) {
    let subtotal = 0;
    const itemsData: Array<{ product: Product; qty: number; name: string; price: number }> = [];

    for (const { product, qty } of spec.items) {
      const name  = await getName(product);
      const price = parseFloat(product.price_usd);
      subtotal   += price * qty;
      itemsData.push({ product, qty, name, price });
    }

    const deliveryFee = parseFloat(spec.gov.delivery_fee_usd);
    const total       = subtotal + deliveryFee;
    const createdAt   = daysAgo(spec.daysBack);

    const order = await orderRepo.save(orderRepo.create({
      order_number:    generateOrderNumber(),
      customer_name:   `${spec.customer.first_name} ${spec.customer.last_name}`,
      customer_email:  spec.customer.email,
      customer_phone:  spec.customer.phone ?? '+963900000000',
      address_detail:  `${spec.gov.name_local ?? spec.gov.name} - ${pick(addresses)}`,
      locale:          'ar',
      status:          spec.flow[spec.flow.length - 1],
      subtotal_usd:    subtotal.toFixed(2),
      delivery_fee_usd: deliveryFee.toFixed(2),
      total_usd:       total.toFixed(2),
      rejection_reason: spec.rejectionReason ?? null,
      notes:           spec.note ?? null,
      governorate:     spec.gov,
      user:            spec.customer,
      created_at:      createdAt,
    } as Partial<Order> as Order));

    for (const { product, qty, name, price } of itemsData) {
      await itemRepo.save(itemRepo.create({
        product_name_snapshot:  name,
        product_price_snapshot: price.toFixed(2),
        quantity:               qty,
        total_usd:              (price * qty).toFixed(2),
        order,
        product,
      }));
    }

    for (let i = 0; i < spec.flow.length; i++) {
      const logTime = daysAgo(spec.daysBack, -(i * 4));
      await logRepo.save(logRepo.create({
        status:  spec.flow[i],
        note:    i === spec.flow.length - 1 && spec.rejectionReason ? spec.rejectionReason : null,
        order,
        user:    i === 0 ? null : adminUser,
        created_at: logTime,
      } as Partial<OrderStatusLog> as OrderStatusLog));
    }
  }

  console.log(`  ↳ ${specs.length} orders created.`);
}

// ─── 8. MAINTENANCE REQUESTS ──────────────────────────────────────────────────

async function seedMaintenance(
  ds: DataSource,
  users: Record<string, User>,
): Promise<void> {
  const repo    = ds.getRepository(MaintenanceRequest);
  const logRepo = ds.getRepository(MaintenanceStatusLog);

  const existing = await repo.count();
  if (existing > 0) {
    console.log(`  ↳ Maintenance requests already seeded (${existing}), skipping.`);
    return;
  }

  const customers  = Object.values(users).filter((u) => u.role === Role.CUSTOMER);
  const tech1      = users['tech1@medstore.sy'];
  const tech2      = users['tech2@medstore.sy'];
  const adminUser  = users['admin@medstore.sy'];

  type MntSpec = {
    customer: User | null;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deviceType: string;
    description: string;
    visitType: VisitType;
    flow: MaintenanceStatus[];
    daysBack: number;
    scheduledDaysBack?: number;
    assignedTech?: User;
    notes?: string;
  };

  const specs: MntSpec[] = [
    // Pending (3)
    {
      customer: customers[0], customerName: `${customers[0].first_name} ${customers[0].last_name}`,
      customerEmail: customers[0].email, customerPhone: customers[0].phone ?? '',
      deviceType: 'Omron M3 Blood Pressure Monitor',
      description: 'الجهاز لا يعمل بشكل صحيح — يعطي قراءات خاطئة وأحياناً لا يستجيب للأزرار.',
      visitType: VisitType.HOME, flow: [MaintenanceStatus.PENDING], daysBack: 0,
    },
    {
      customer: null, customerName: 'Dr. Walid Mansour', customerEmail: 'walid.mansour@clinic.sy', customerPhone: '+963944300001',
      deviceType: 'Philips InnoSpire Go Nebulizer',
      description: 'The mesh membrane is clogged and not producing aerosol. The device is less than 6 months old.',
      visitType: VisitType.OFFICE, flow: [MaintenanceStatus.PENDING], daysBack: 1,
    },
    {
      customer: customers[2], customerName: `${customers[2].first_name} ${customers[2].last_name}`,
      customerEmail: customers[2].email, customerPhone: customers[2].phone ?? '',
      deviceType: 'جهاز قياس سكر الدم Beurer GL44',
      description: 'الجهاز يظهر رسالة خطأ E-5 عند محاولة القياس. تم تغيير البطاريات ولا يزال المشكلة قائمة.',
      visitType: VisitType.OFFICE, flow: [MaintenanceStatus.PENDING], daysBack: 2,
    },
    // Assigned (2)
    {
      customer: customers[1], customerName: `${customers[1].first_name} ${customers[1].last_name}`,
      customerEmail: customers[1].email, customerPhone: customers[1].phone ?? '',
      deviceType: 'Philips Respironics EverFlo 5L Oxygen Concentrator',
      description: 'يصدر الجهاز صوتاً غريباً عند التشغيل ومستوى الأكسجين انخفض عن المعتاد.',
      visitType: VisitType.HOME, flow: [MaintenanceStatus.PENDING, MaintenanceStatus.ASSIGNED],
      daysBack: 5, scheduledDaysBack: -2, assignedTech: tech1,
    },
    {
      customer: null, customerName: 'Mazen Abboud', customerEmail: 'mazen.abboud@gmail.com', customerPhone: '+963955200002',
      deviceType: 'Invacare Action 3 Wheelchair',
      description: 'Left rear wheel bearing is making a grinding noise and the brake cable is loose.',
      visitType: VisitType.OFFICE, flow: [MaintenanceStatus.PENDING, MaintenanceStatus.ASSIGNED],
      daysBack: 6, scheduledDaysBack: -1, assignedTech: tech2,
    },
    // In Progress (2)
    {
      customer: customers[4], customerName: `${customers[4].first_name} ${customers[4].last_name}`,
      customerEmail: customers[4].email, customerPhone: customers[4].phone ?? '',
      deviceType: 'Beurer EM49 TENS/EMS Device',
      description: 'Channel 2 output has stopped working. Channel 1 is fine.',
      visitType: VisitType.OFFICE, flow: [MaintenanceStatus.PENDING, MaintenanceStatus.ASSIGNED, MaintenanceStatus.IN_PROGRESS],
      daysBack: 8, assignedTech: tech1,
    },
    {
      customer: null, customerName: 'Al-Shifaa Medical Center', customerEmail: 'info@alshifaa.sy', customerPhone: '+963931400001',
      deviceType: 'Mindray BC-30 Hematology Analyzer',
      description: 'Clog error appearing frequently, reagent counter not resetting after new pack installation.',
      visitType: VisitType.OFFICE, flow: [MaintenanceStatus.PENDING, MaintenanceStatus.ASSIGNED, MaintenanceStatus.IN_PROGRESS],
      daysBack: 10, assignedTech: tech2,
    },
    // Completed (3)
    {
      customer: customers[3], customerName: `${customers[3].first_name} ${customers[3].last_name}`,
      customerEmail: customers[3].email, customerPhone: customers[3].phone ?? '',
      deviceType: 'Omron C28P Nebulizer',
      description: 'Air tube connector broke and mask is cracked.',
      visitType: VisitType.OFFICE, flow: [MaintenanceStatus.PENDING, MaintenanceStatus.ASSIGNED, MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.COMPLETED],
      daysBack: 15, assignedTech: tech1,
      notes: 'Replaced air tube, mask and medication cup. Device fully functional.',
    },
    {
      customer: customers[5], customerName: `${customers[5].first_name} ${customers[5].last_name}`,
      customerEmail: customers[5].email, customerPhone: customers[5].phone ?? '',
      deviceType: 'مركز أكسجين إنفاكير 10 لتر',
      description: 'انخفاض حاد في تركيز الأكسجين، الجهاز يعمل لكن قياس SpO2 المريض لا يتحسن.',
      visitType: VisitType.HOME, flow: [MaintenanceStatus.PENDING, MaintenanceStatus.ASSIGNED, MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.COMPLETED],
      daysBack: 20, assignedTech: tech2,
      notes: 'استبدال الغربال الجزيئي. الجهاز يعمل الآن بنقاء 95.5% عند 10 لتر/دقيقة.',
    },
    {
      customer: null, customerName: 'Khalil Darwish', customerEmail: 'khalil.darwish@gmail.com', customerPhone: '+963944500009',
      deviceType: 'Welch Allyn Diagnostic Set',
      description: 'Otoscope light is dim and flickering. Ophthalmoscope lens is scratched.',
      visitType: VisitType.OFFICE, flow: [MaintenanceStatus.PENDING, MaintenanceStatus.ASSIGNED, MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.COMPLETED],
      daysBack: 25, assignedTech: tech1,
      notes: 'Replaced bulb and lens. Handle battery contacts cleaned.',
    },
    // Cancelled (1)
    {
      customer: customers[6], customerName: `${customers[6].first_name} ${customers[6].last_name}`,
      customerEmail: customers[6].email, customerPhone: customers[6].phone ?? '',
      deviceType: 'Blood Glucose Monitor (unknown brand)',
      description: 'Display not turning on.',
      visitType: VisitType.OFFICE, flow: [MaintenanceStatus.PENDING, MaintenanceStatus.CANCELLED],
      daysBack: 12,
    },
  ];

  for (const spec of specs) {
    const scheduledAt = spec.scheduledDaysBack !== undefined
      ? daysAgo(spec.daysBack, spec.scheduledDaysBack * 24)
      : null;

    const request = await repo.save(repo.create({
      request_number:  generateMaintenanceNumber(),
      customer_name:   spec.customerName,
      customer_email:  spec.customerEmail,
      customer_phone:  spec.customerPhone,
      device_type:     spec.deviceType,
      description:     spec.description,
      visit_type:      spec.visitType,
      status:          spec.flow[spec.flow.length - 1],
      notes:           spec.notes ?? null,
      locale:          'ar',
      scheduled_at:    scheduledAt,
      user:            spec.customer,
      technician:      spec.assignedTech ?? null,
      images:          [],
      created_at:      daysAgo(spec.daysBack),
    } as Partial<MaintenanceRequest> as MaintenanceRequest));

    for (let i = 0; i < spec.flow.length; i++) {
      const logTime = daysAgo(spec.daysBack, -(i * 8));
      await logRepo.save(logRepo.create({
        status:               spec.flow[i],
        note:                 i === spec.flow.length - 1 && spec.notes ? spec.notes : null,
        maintenanceRequest:   request,
        user:                 i === 0 ? null : (spec.assignedTech ?? adminUser),
        created_at:           logTime,
      } as Partial<MaintenanceStatusLog> as MaintenanceStatusLog));
    }
  }

  console.log(`  ↳ ${specs.length} maintenance requests created.`);
}

// ─── 9. SETTINGS ─────────────────────────────────────────────────────────────

async function seedSettings(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Setting);

  const defaults = [
    { key: 'store_name',        value: 'MedStore Syria' },
    { key: 'store_email',       value: 'info@medstore.sy' },
    { key: 'store_phone',       value: '+963991100001' },
    { key: 'store_address',     value: 'دمشق، شارع بغداد، بناء 14' },
    { key: 'currency',          value: 'USD' },
    { key: 'low_stock_threshold', value: '5' },
    { key: 'order_auto_confirm', value: 'false' },
  ];

  for (const s of defaults) {
    const existing = await repo.findOne({ where: { key: s.key } });
    if (!existing) {
      await repo.save(repo.create(s));
    }
  }
  console.log(`  ↳ Settings seeded.`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🌱 Starting comprehensive seed...\n');
  const ds = await AppDataSource.initialize();
  console.log('✅ Database connected.\n');

  try {
    console.log('📍 Governorates:');
    const governorates = await seedGovernorates(ds);

    console.log('\n👤 Users (staff + customers):');
    const users = await seedUsers(ds);
    const adminUser = users['admin@medstore.sy'];

    console.log('\n📂 Categories:');
    const categories = await seedCategories(ds);

    console.log('\n🏷️  Brands:');
    const brands = await seedBrands(ds);

    console.log('\n🔧 Attribute definitions:');
    await seedAttributes(ds, categories);

    console.log('\n📦 Products:');
    const products = await seedProducts(ds, categories, brands, adminUser);

    console.log('\n🛒 Orders:');
    await seedOrders(ds, products, governorates, users, adminUser);

    console.log('\n🔩 Maintenance requests:');
    await seedMaintenance(ds, users);

    console.log('\n⚙️  Settings:');
    await seedSettings(ds);

    console.log('\n✅ Seed completed successfully.');
    console.log('\n📋 Summary:');
    console.log(`   Governorates:          ${governorates.length}`);
    console.log(`   Users:                 ${Object.keys(users).length} (7 staff + 7 customers)`);
    console.log(`   Categories:            ${Object.keys(categories).length} (6 parent + 11 children)`);
    console.log(`   Brands:                ${Object.keys(brands).length}`);
    console.log(`   Products:              ${products.length} (${products.filter((p) => p.condition === ProductCondition.NEW).length} new, ${products.filter((p) => p.condition === ProductCondition.USED).length} used)`);
    console.log(`   Orders:                20 (4 pending, 3 confirmed, 2 preparing, 2 shipped, 5 delivered, 2 cancelled, 2 rejected)`);
    console.log(`   Maintenance requests:  11 (3 pending, 2 assigned, 2 in_progress, 3 completed, 1 cancelled)`);
    console.log('\n🔑 Login credentials:');
    console.log('   Admin:      admin@medstore.sy      / Admin@123456');
    console.log('   Sales:      sales@medstore.sy      / Staff@123456');
    console.log('   Warehouse:  warehouse@medstore.sy  / Staff@123456');
    console.log('   Technician: tech1@medstore.sy      / Staff@123456');
    console.log('   Customer:   ahmad.khalil@gmail.com / Customer@123');

  } finally {
    await ds.destroy();
  }
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
