import { LuggageItem } from 'src/luggage/entities/luggage-item.entity';
import { Luggage } from 'src/luggage/entities/luggage.entity';
import { Item } from 'src/items/entities/item.entity';

export const createMockLuggageItems = (luggageList: Luggage[], items: Item[]): Partial<LuggageItem>[] => [
  // Paris Summer Suitcase (luggage[0])
  { luggage: luggageList[0], item: items[0], quantity: 5 },  // T-Shirt x5
  { luggage: luggageList[0], item: items[1], quantity: 2 },  // Jeans x2
  { luggage: luggageList[0], item: items[2], quantity: 1 },  // Jacket x1
  { luggage: luggageList[0], item: items[3], quantity: 1 },  // Sneakers x1
  { luggage: luggageList[0], item: items[4], quantity: 1 },  // Smartphone x1
  { luggage: luggageList[0], item: items[6], quantity: 1 },  // Phone Charger x1
  { luggage: luggageList[0], item: items[7], quantity: 1 },  // Headphones x1
  { luggage: luggageList[0], item: items[8], quantity: 1 },  // Toothbrush x1
  { luggage: luggageList[0], item: items[9], quantity: 1 },  // Toothpaste x1
  { luggage: luggageList[0], item: items[12], quantity: 1 }, // Passport x1
  { luggage: luggageList[0], item: items[18], quantity: 1 }, // Sunglasses x1

  // Tokyo Travel Backpack (luggage[1])
  { luggage: luggageList[1], item: items[0], quantity: 4 },  // T-Shirt x4
  { luggage: luggageList[1], item: items[1], quantity: 2 },  // Jeans x2
  { luggage: luggageList[1], item: items[3], quantity: 1 },  // Sneakers x1
  { luggage: luggageList[1], item: items[4], quantity: 1 },  // Smartphone x1
  { luggage: luggageList[1], item: items[5], quantity: 1 },  // Laptop x1
  { luggage: luggageList[1], item: items[6], quantity: 1 },  // Phone Charger x1
  { luggage: luggageList[1], item: items[8], quantity: 1 },  // Toothbrush x1
  { luggage: luggageList[1], item: items[9], quantity: 1 },  // Toothpaste x1
  { luggage: luggageList[1], item: items[12], quantity: 1 }, // Passport x1
  { luggage: luggageList[1], item: items[19], quantity: 1 }, // Travel Pillow x1
  { luggage: luggageList[1], item: items[20], quantity: 1 }, // Water Bottle x1

  // NYC Weekend Bag (luggage[2])
  { luggage: luggageList[2], item: items[0], quantity: 3 },  // T-Shirt x3
  { luggage: luggageList[2], item: items[1], quantity: 1 },  // Jeans x1
  { luggage: luggageList[2], item: items[2], quantity: 1 },  // Jacket x1
  { luggage: luggageList[2], item: items[3], quantity: 1 },  // Sneakers x1
  { luggage: luggageList[2], item: items[4], quantity: 1 },  // Smartphone x1
  { luggage: luggageList[2], item: items[6], quantity: 1 },  // Phone Charger x1
  { luggage: luggageList[2], item: items[8], quantity: 1 },  // Toothbrush x1
  { luggage: luggageList[2], item: items[12], quantity: 1 }, // Passport x1
  { luggage: luggageList[2], item: items[13], quantity: 1 }, // ID Card x1

  // Barcelona Beach Luggage (luggage[3])
  { luggage: luggageList[3], item: items[0], quantity: 6 },  // T-Shirt x6
  { luggage: luggageList[3], item: items[1], quantity: 2 },  // Jeans x2
  { luggage: luggageList[3], item: items[3], quantity: 1 },  // Sneakers x1
  { luggage: luggageList[3], item: items[4], quantity: 1 },  // Smartphone x1
  { luggage: luggageList[3], item: items[6], quantity: 1 },  // Phone Charger x1
  { luggage: luggageList[3], item: items[7], quantity: 1 },  // Headphones x1
  { luggage: luggageList[3], item: items[10], quantity: 1 }, // Shampoo x1
  { luggage: luggageList[3], item: items[11], quantity: 1 }, // Deodorant x1
  { luggage: luggageList[3], item: items[12], quantity: 1 }, // Passport x1
  { luggage: luggageList[3], item: items[17], quantity: 1 }, // Hand Sanitizer x1
  { luggage: luggageList[3], item: items[18], quantity: 1 }, // Sunglasses x1
  { luggage: luggageList[3], item: items[20], quantity: 1 }, // Water Bottle x1

  // Rome History Trip Bag (luggage[4])
  { luggage: luggageList[4], item: items[0], quantity: 5 },  // T-Shirt x5
  { luggage: luggageList[4], item: items[1], quantity: 2 },  // Jeans x2
  { luggage: luggageList[4], item: items[2], quantity: 1 },  // Jacket x1
  { luggage: luggageList[4], item: items[4], quantity: 1 },  // Smartphone x1
  { luggage: luggageList[4], item: items[5], quantity: 1 },  // Laptop x1
  { luggage: luggageList[4], item: items[6], quantity: 1 },  // Phone Charger x1
  { luggage: luggageList[4], item: items[8], quantity: 1 },  // Toothbrush x1
  { luggage: luggageList[4], item: items[9], quantity: 1 },  // Toothpaste x1
  { luggage: luggageList[4], item: items[12], quantity: 1 }, // Passport x1
  { luggage: luggageList[4], item: items[20], quantity: 1 }, // Water Bottle x1
  { luggage: luggageList[4], item: items[21], quantity: 3 }, // Granola Bar x3

  // Iceland Winter Suitcase (luggage[5])
  { luggage: luggageList[5], item: items[0], quantity: 4 },  // T-Shirt x4
  { luggage: luggageList[5], item: items[1], quantity: 2 },  // Jeans x2
  { luggage: luggageList[5], item: items[2], quantity: 2 },  // Jacket x2 (extra warm)
  { luggage: luggageList[5], item: items[3], quantity: 1 },  // Sneakers x1
  { luggage: luggageList[5], item: items[4], quantity: 1 },  // Smartphone x1
  { luggage: luggageList[5], item: items[6], quantity: 1 },  // Phone Charger x1
  { luggage: luggageList[5], item: items[8], quantity: 1 },  // Toothbrush x1
  { luggage: luggageList[5], item: items[10], quantity: 1 }, // Shampoo x1
  { luggage: luggageList[5], item: items[12], quantity: 1 }, // Passport x1
  { luggage: luggageList[5], item: items[15], quantity: 1 }, // Pain Reliever x1
  { luggage: luggageList[5], item: items[19], quantity: 1 }, // Travel Pillow x1

  // Personal Emergency Kit (luggage[6] - no trip)
  { luggage: luggageList[6], item: items[15], quantity: 1 }, // Pain Reliever x1
  { luggage: luggageList[6], item: items[16], quantity: 10 }, // Band-Aids x10
  { luggage: luggageList[6], item: items[17], quantity: 1 }, // Hand Sanitizer x1
  { luggage: luggageList[6], item: items[20], quantity: 1 }, // Water Bottle x1
  { luggage: luggageList[6], item: items[21], quantity: 5 }, // Granola Bar x5
  { luggage: luggageList[6], item: items[22], quantity: 2 }, // Trail Mix x2
];
