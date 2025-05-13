import { sql } from "../config/db.js";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

dotenv.config();

const products = [
  // Furniture
  {
    name: "Modern Study Desk",
    price: 189.99,
    description: "Spacious study desk with storage drawers, perfect for home office or dorm room.",
    image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop",
    category: "furniture"
  },
  {
    name: "Futon Sofa Bed",
    price: 299.99,
    description: "Convertible futon that transforms from couch to bed, ideal for small apartments.",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop",
    category: "furniture"
  },
  
  // Kitchen
  {
    name: "Premium Coffee Maker",
    price: 129.99,
    description: "Programmable coffee maker with thermal carafe that keeps coffee hot for hours.",
    image: "https://images.unsplash.com/photo-1517142089942-ba376ce32a2e?w=800&auto=format&fit=crop",
    category: "kitchen"
  },
  {
    name: "Stainless Steel Water Bottle",
    price: 24.99,
    description: "Vacuum insulated water bottle that keeps drinks cold for 24 hours or hot for 12 hours.",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop",
    category: "kitchen"
  },
  
  // Tech
  {
    name: "Wireless Bluetooth Headphones",
    price: 79.99,
    description: "Noise-cancelling headphones with 30-hour battery life and premium sound quality.",
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop",
    category: "tech"
  },
  {
    name: "Smart LED TV - 55 inch",
    price: 499.99,
    description: "4K Ultra HD Smart TV with built-in streaming apps and voice control.",
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop",
    category: "tech"
  },
  {
    name: "Portable Bluetooth Speaker",
    price: 59.99,
    description: "Waterproof portable speaker with 12-hour battery life and deep bass sound.",
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop",
    category: "tech"
  },
  {
    name: "Gaming Laptop",
    price: 1299.99,
    description: "High-performance gaming laptop with dedicated graphics card and RGB keyboard.",
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop",
    category: "tech"
  },
  
  // Clothes
  {
    name: "Denim Jacket",
    price: 59.99,
    description: "Classic denim jacket with comfortable fit and multiple pockets.",
    image: "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800&auto=format&fit=crop",
    category: "clothes"
  },
  {
    name: "Winter Coat",
    price: 129.99,
    description: "Insulated winter coat with water-resistant exterior and plush lining.",
    image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&auto=format&fit=crop",
    category: "clothes"
  },
  {
    name: "Running Shoes",
    price: 89.99,
    description: "Lightweight running shoes with responsive cushioning and breathable mesh upper.",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop",
    category: "clothes"
  },
  
  // Textbooks
  {
    name: "Introduction to Computer Science",
    price: 79.99,
    description: "Comprehensive textbook covering fundamentals of programming and computer science principles.",
    image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop",
    category: "textbooks"
  },
  {
    name: "Organic Chemistry",
    price: 94.99,
    description: "College-level organic chemistry textbook with practice problems and detailed illustrations.",
    image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop",
    category: "textbooks"
  },
  {
    name: "Principles of Economics",
    price: 85.99,
    description: "Current edition economics textbook covering micro and macroeconomic concepts.",
    image: "https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&auto=format&fit=crop",
    category: "textbooks"
  },
  
  // Food
  {
    name: "Premium Coffee Beans",
    price: 18.99,
    description: "Fair trade, single-origin coffee beans, freshly roasted and packaged.",
    image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop",
    category: "food"
  },
  // Vehicles
  {
    name: "Mountain Bike",
    price: 499.99,
    description: "All-terrain mountain bike with front suspension and 21-speed shifting.",
    image: "https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=800&auto=format&fit=crop",
    category: "vehicles"
  },
  {
    name: "Used Honda Civic",
    price: 8499.99,
    description: "2015 Honda Civic with low mileage, excellent condition, and recently serviced.",
    image: "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=800&auto=format&fit=crop",
    category: "vehicles"
  },
  
  // Housing
  {
    name: "Studio Apartment",
    price: 899.99,
    description: "Cozy studio apartment near campus, utilities included, available for semester lease.",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop",
    category: "housing"
  },
  {
    name: "2-Bedroom Apartment Share",
    price: 650.00,
    description: "Private room in 2-bedroom apartment with shared kitchen and living room, 10-minute walk to campus.",
    image: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&auto=format&fit=crop",
    category: "housing"
  },
  {
    name: "Summer Sublet",
    price: 799.99,
    description: "3-month summer sublet in fully furnished apartment with pool access and parking spot.",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop",
    category: "housing"
  },
  
  // Rides
  {
    name: "Airport Shuttle Service",
    price: 39.99,
    description: "Round-trip shuttle service to the airport at end of semester, space for luggage.",
    image: "https://images.unsplash.com/photo-1546768292-fb12f6c92568?w=800&auto=format&fit=crop",
    category: "rides"
  },
  {
    name: "Carpool to Chicago",
    price: 25.00,
    description: "Shared ride to Chicago, leaving Friday at 3pm, split gas costs.",
    image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&auto=format&fit=crop",
    category: "rides"
  },
  // Merch
  {
    name: "University Hoodie",
    price: 45.99,
    description: "Official university hoodie with embroidered logo, heavyweight cotton blend.",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&auto=format&fit=crop",
    category: "merch"
  },
  {
    name: "College Mug",
    price: 14.99,
    description: "Ceramic 16oz mug with university crest and colors.",
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&auto=format&fit=crop",
    category: "merch"
  },
  
  // Other
  {
    name: "Desk Lamp",
    price: 34.99,
    description: "Adjustable LED desk lamp with multiple brightness settings and USB charging port.",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop",
    category: "other"
  }
];

export async function seedProducts() {
  try {
    // Clear existing products
    await sql`TRUNCATE TABLE products RESTART IDENTITY`;
    console.log("Cleared existing products");

    // Insert new products
    for (const product of products) {
      await sql`
        INSERT INTO products (name, price, description, image, category, user_id)
        VALUES (${product.name}, ${product.price}, ${product.description}, ${product.image}, ${product.category}, 20)
      `;
    }

    console.log(`Successfully seeded ${products.length} products`);
  } catch (error) {
    console.error("Error seeding products:", error);
    throw error;
  }
}

// Check if this file is being run directly
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  seedProducts().then(() => {
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
} 