import { Luggage } from 'src/luggage/entities/luggage.entity';
import { Trip } from 'src/trips/entities/trip.entity';
import { User } from 'src/users/entities/user.entity';

export const createMockLuggage = (trips: Trip[], users: User[]): Partial<Luggage>[] => [
  {
    name: 'Paris Summer Suitcase',
    trip: trips[0], // Summer Paris Adventure
    user: users[3],
  },
  {
    name: 'Tokyo Travel Backpack',
    trip: trips[1], // Tokyo Cherry Blossom Tour
    user: users[1],
  },
  {
    name: 'NYC Weekend Bag',
    trip: trips[2], // New York City Weekend
    user: users[2],
  },
  {
    name: 'Barcelona Beach Luggage',
    trip: trips[3], // Barcelona Beach Getaway
    user: users[4],
  },
  {
    name: 'Rome History Trip Bag',
    trip: trips[4], // Rome Historical Journey
    user: users[0],
  },
  {
    name: 'Iceland Winter Suitcase',
    trip: trips[5], // Iceland Northern Lights
    user: users[0],
  },
  {
    name: 'Personal Emergency Kit',
    trip: undefined, // No trip associated - standalone luggage
    user: users[4],
  },
];
