import { Item } from 'src/items/entities/item.entity';
import { ItemCategory } from 'src/item-categories/entities/item-category.entity';

export const createMockItems = (categories: ItemCategory[]): Partial<Item>[] => [
  // Clothing items
  {
    name: 'T-Shirt',
    description: 'Basic cotton t-shirt',
    image: 'https://cdn-icons-png.flaticon.com/512/892/892458.png',
    category: categories[0], // Clothing
  },
  {
    name: 'Jeans',
    description: 'Denim jeans',
    image: 'https://cdn-icons-png.flaticon.com/512/3079/3079652.png',
    category: categories[0], // Clothing
  },
  {
    name: 'Jacket',
    description: 'Light travel jacket',
    image: 'https://cdn-icons-png.flaticon.com/512/2503/2503522.png',
    category: categories[0], // Clothing
  },
  {
    name: 'Sneakers',
    description: 'Comfortable walking shoes',
    image: 'https://cdn-icons-png.flaticon.com/512/2329/2329465.png',
    category: categories[0], // Clothing
  },

  // Electronics items
  {
    name: 'Smartphone',
    description: 'Mobile phone',
    image: 'https://cdn-icons-png.flaticon.com/512/3659/3659898.png',
    category: categories[1], // Electronics
  },
  {
    name: 'Laptop',
    description: 'Portable computer',
    image: 'https://cdn-icons-png.flaticon.com/512/3474/3474360.png',
    category: categories[1], // Electronics
  },
  {
    name: 'Phone Charger',
    description: 'USB charging cable and adapter',
    image: 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png',
    category: categories[1], // Electronics
  },
  {
    name: 'Headphones',
    description: 'Wireless headphones',
    image: 'https://cdn-icons-png.flaticon.com/512/3845/3845874.png',
    category: categories[1], // Electronics
  },

  // Toiletries items
  {
    name: 'Toothbrush',
    description: 'Manual toothbrush',
    image: 'https://cdn-icons-png.flaticon.com/512/2553/2553642.png',
    category: categories[2], // Toiletries
  },
  {
    name: 'Toothpaste',
    description: 'Travel-size toothpaste',
    image: 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png',
    category: categories[2], // Toiletries
  },
  {
    name: 'Shampoo',
    description: 'Hair shampoo bottle',
    image: 'https://cdn-icons-png.flaticon.com/512/3874/3874862.png',
    category: categories[2], // Toiletries
  },
  {
    name: 'Deodorant',
    description: 'Roll-on deodorant',
    image: 'https://cdn-icons-png.flaticon.com/512/2553/2553689.png',
    category: categories[2], // Toiletries
  },

  // Documents items
  {
    name: 'Passport',
    description: 'International travel document',
    image: 'https://cdn-icons-png.flaticon.com/512/3767/3767084.png',
    category: categories[3], // Documents
  },
  {
    name: 'ID Card',
    description: 'National identification card',
    image: 'https://cdn-icons-png.flaticon.com/512/2998/2998084.png',
    category: categories[3], // Documents
  },
  {
    name: 'Travel Insurance',
    description: 'Insurance policy documents',
    image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    category: categories[3], // Documents
  },

  // Medications items
  {
    name: 'Pain Reliever',
    description: 'Ibuprofen or similar',
    image: 'https://cdn-icons-png.flaticon.com/512/2913/2913133.png',
    category: categories[4], // Medications
  },
  {
    name: 'Band-Aids',
    description: 'Adhesive bandages',
    image: 'https://cdn-icons-png.flaticon.com/512/2913/2913138.png',
    category: categories[4], // Medications
  },
  {
    name: 'Hand Sanitizer',
    description: 'Antibacterial gel',
    image: 'https://cdn-icons-png.flaticon.com/512/2913/2913139.png',
    category: categories[4], // Medications
  },

  // Accessories items
  {
    name: 'Sunglasses',
    description: 'UV protection sunglasses',
    image: 'https://cdn-icons-png.flaticon.com/512/2329/2329029.png',
    category: categories[5], // Accessories
  },
  {
    name: 'Travel Pillow',
    description: 'Neck pillow for comfort',
    image: 'https://cdn-icons-png.flaticon.com/512/3050/3050155.png',
    category: categories[5], // Accessories
  },
  {
    name: 'Water Bottle',
    description: 'Reusable water bottle',
    image: 'https://cdn-icons-png.flaticon.com/512/924/924514.png',
    category: categories[5], // Accessories
  },

  // Food & Snacks items
  {
    name: 'Granola Bar',
    description: 'Energy snack bar',
    image: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
    category: categories[6], // Food & Snacks
  },
  {
    name: 'Trail Mix',
    description: 'Mixed nuts and dried fruit',
    image: 'https://cdn-icons-png.flaticon.com/512/1625/1625099.png',
    category: categories[6], // Food & Snacks
  },
  {
    name: 'Chewing Gum',
    description: 'Sugar-free gum',
    image: 'https://cdn-icons-png.flaticon.com/512/2553/2553691.png',
    category: categories[6], // Food & Snacks
  },
];
