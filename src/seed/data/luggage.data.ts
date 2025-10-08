import { Luggage } from 'src/luggage/entities/luggage.entity';
import { Trip } from 'src/trips/entities/trip.entity';

export const createMockLuggage = (trips: Trip[]): Partial<Luggage>[] => [
  {
    name: 'Paris Summer Suitcase',
    trip: trips[0], // Summer Paris Adventure
  },
  {
    name: 'Tokyo Travel Backpack',
    trip: trips[1], // Tokyo Cherry Blossom Tour
  },
  {
    name: 'NYC Weekend Bag',
    trip: trips[2], // New York City Weekend
  },
  {
    name: 'Barcelona Beach Luggage',
    trip: trips[3], // Barcelona Beach Getaway
  },
  {
    name: 'Rome History Trip Bag',
    trip: trips[4], // Rome Historical Journey
  },
  {
    name: 'Iceland Winter Suitcase',
    trip: trips[5], // Iceland Northern Lights
  },
  {
    name: 'Personal Emergency Kit',
    trip: undefined, // No trip associated - standalone luggage
  },
];
