import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
};

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepository = getRepository(User);

  console.log('=== Create Admin User (Direct) ===');
  
  try {
    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({ 
      where: { email: 'admin@example.com' } 
    });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      rl.close();
      await app.close();
      process.exit(0);
    }

    const name = await question('Enter admin name: ');
    const email = await question('Enter admin email (default: admin@example.com): ') || 'admin@example.com';
    const phone = await question('Enter admin phone number: ');
    const password = await question('Enter admin password (min 8 characters): ');
    
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = userRepository.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: UserRole.ADMIN,
      emailVerified: true,
      isActive: true,
      securityQuestions: [
        { question: 'Admin security question', answer: 'admin' }
      ]
    });

    await userRepository.save(admin);
    
    console.log('\n✅ Admin user created successfully!');
    console.log(`Email: ${admin.email}`);
    
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  } finally {
    rl.close();
    await app.close();
    process.exit(0);
  }
}

bootstrap();
