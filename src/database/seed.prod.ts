import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/data-source';
import { User } from '../modules/users/entities/user.entity';
import { Role } from '../common/enums/role.enum';

async function main(): Promise<void> {
  console.log('🌱 Production seed starting...\n');
  const ds = await AppDataSource.initialize();
  console.log('✅ Database connected.\n');

  try {
    const userRepo = ds.getRepository(User);
    let admin = await userRepo.findOne({ where: { email: 'admin@medstore.com' } });
    if (!admin) {
      const hashed = await bcrypt.hash('password', 12);
      await userRepo.save(userRepo.create({
        email:      'admin@medstore.com',
        password:   hashed,
        first_name: 'Admin',
        last_name:  'MedStore',
        role:       Role.ADMIN,
        is_active:  true,
        locale:     'ar',
      }));
      console.log('  ↳ Admin created: admin@medstore.com');
    } else {
      console.log('  ↳ Admin already exists: admin@medstore.com');
    }

    console.log('\n✅ Done.');
    console.log('\n🔑 Login:');
    console.log('   Email:    admin@medstore.com');
    console.log('   Password: password');
  } finally {
    await ds.destroy();
  }
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
