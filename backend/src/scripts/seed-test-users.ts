import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { join } from 'path';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  synchronize: true,
  logging: true,
});

export async function seedTestUsers() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const userRepository = AppDataSource.getRepository(User);
  
  // Check if test user already exists
  let testUser = await userRepository.findOne({ where: { email: 'test@example.com' } });
  
  if (!testUser) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('Test@1234', salt);
    
    testUser = userRepository.create({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: UserRole.CUSTOMER,
      isEmailVerified: true
    });
    
    await userRepository.save(testUser);
    console.log('Test user created successfully');
  }
  
  // Check if admin user exists
  let adminUser = await userRepository.findOne({ where: { email: 'admin@example.com' } });
  
  if (!adminUser) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('Admin@1234', salt);
    
    adminUser = userRepository.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isEmailVerified: true
    });
    
    await userRepository.save(adminUser);
    console.log('Admin user created successfully');
  }
  
  return { testUser, adminUser };
}

// This allows running the seed directly with ts-node
if (require.main === module) {
  seedTestUsers()
    .then(() => {
      console.log('Database seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding database:', error);
      process.exit(1);
    });
}
