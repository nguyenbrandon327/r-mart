import { seedProducts } from './productSeeder.js';

async function runSeeders() {
  try {
    console.log('Starting database seeding...');
    
    // Run product seeder
    await seedProducts();
    
    console.log('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  }
}

runSeeders(); 