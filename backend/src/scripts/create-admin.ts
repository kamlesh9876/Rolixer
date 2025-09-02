import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';
import * as readline from 'readline';
import * as bcrypt from 'bcrypt';

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
  const usersService = app.get(UsersService);

  console.log('=== Create Admin User ===');
  
  try {
    // Check if admin already exists
    const existingAdmin = await usersService.findOneByEmail('admin@example.com');
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
    
    const admin = await usersService.create({
      name,
      email,
      phone,
      password: hashedPassword,
      confirmPassword: password, // Required by CreateUserDto
      role: UserRole.ADMIN,
      emailVerified: true,
      isActive: true,
      securityQuestions: [
        { question: 'Admin security question', answer: 'admin' }
      ]
    }, UserRole.ADMIN); // Pass the role as second parameter

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
