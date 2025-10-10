import { Activity } from 'src/activities/entities/activity.entity';
import { Trip } from 'src/trips/entities/trip.entity';
import { Place } from 'src/places/entities/place.entity';
import { User } from 'src/users/entities/user.entity';

export const createMockActivities = (trips: Trip[], places: Place[], users: User[]): Partial<Activity>[] => [
  // Paris Trip Activities
  {
    name: 'Visit Eiffel Tower',
    description: 'Climb to the top and enjoy the view',
    date: new Date('2025-07-16T10:00:00'),
    trip: trips[0],
    place: places[0], // Eiffel Tower
    user: users[3],
  },
  {
    name: 'Louvre Museum Tour',
    description: 'See the Mona Lisa and other masterpieces',
    date: new Date('2025-07-17T14:00:00'),
    trip: trips[0],
    place: places[1], // Louvre Museum
    user: users[1],
  },
  {
    name: 'Seine River Cruise',
    description: 'Evening cruise along the Seine',
    date: new Date('2025-07-18T19:00:00'),
    trip: trips[0],
    place: undefined, // No specific place
    user: users[3],
  },

  // Tokyo Trip Activities
  {
    name: 'Senso-ji Temple Visit',
    description: 'Explore the ancient temple and markets',
    date: new Date('2025-04-02T09:00:00'),
    trip: trips[1],
    place: places[2], // Senso-ji Temple
    user: users[1],
  },
  {
    name: 'Shibuya Crossing Experience',
    description: 'Experience the world\'s busiest intersection',
    date: new Date('2025-04-03T16:00:00'),
    trip: trips[1],
    place: places[3], // Shibuya Crossing
    user: users[2],
  },
  {
    name: 'Cherry Blossom Viewing',
    description: 'Hanami picnic under cherry blossoms',
    date: new Date('2025-04-04T12:00:00'),
    trip: trips[1],
    place: undefined, // Various locations
    user: users[3],
  },

  // NYC Trip Activities
  {
    name: 'Central Park Walk',
    description: 'Morning walk through Central Park',
    date: new Date('2025-09-06T08:00:00'),
    trip: trips[2],
    place: places[4], // Central Park
    user: users[2],
  },
  {
    name: 'Statue of Liberty Tour',
    description: 'Ferry to Liberty Island',
    date: new Date('2025-09-06T14:00:00'),
    trip: trips[2],
    place: places[5], // Statue of Liberty
    user: users[2],
  },
  {
    name: 'Broadway Show',
    description: 'Evening Broadway musical',
    date: new Date('2025-09-07T20:00:00'),
    trip: trips[2],
    place: undefined, // Theater district
    user: users[2],
  },

  // Barcelona Trip Activities
  {
    name: 'Sagrada Familia Tour',
    description: 'Guided tour of Gaudí\'s masterpiece',
    date: new Date('2025-08-11T10:00:00'),
    trip: trips[3],
    place: places[6], // Sagrada Familia
    user: users[4],
  },
  {
    name: 'Beach Day',
    description: 'Relax at Barceloneta Beach',
    date: new Date('2025-08-12T11:00:00'),
    trip: trips[3],
    place: places[7], // Barceloneta Beach
    user: users[3],
  },
  {
    name: 'Tapas Dinner',
    description: 'Traditional tapas crawl in Gothic Quarter',
    date: new Date('2025-08-13T21:00:00'),
    trip: trips[3],
    place: undefined, // Various restaurants
    user: users[4],
  },

  // Rome Trip Activities
  {
    name: 'Colosseum Tour',
    description: 'Ancient Roman amphitheater tour',
    date: new Date('2025-10-13T09:30:00'),
    trip: trips[4],
    place: places[8], // Colosseum
    user: users[0],
  },
  {
    name: 'Trevi Fountain Visit',
    description: 'Toss a coin and make a wish',
    date: new Date('2025-10-14T17:00:00'),
    trip: trips[4],
    place: places[9], // Trevi Fountain
    user: users[1],
  },
  {
    name: 'Italian Cooking Class',
    description: 'Learn to make authentic pasta',
    date: new Date('2025-10-15T18:00:00'),
    trip: trips[4],
    place: undefined, // Cooking school
    user: users[0],
  },

  // Iceland Trip Activities
  {
    name: 'Blue Lagoon Experience',
    description: 'Relax in geothermal spa',
    date: new Date('2025-11-21T15:00:00'),
    trip: trips[5],
    place: places[10], // Blue Lagoon
    user: users[0],
  },
  {
    name: 'Hallgrímskirkja Church Visit',
    description: 'Visit iconic church and tower',
    date: new Date('2025-11-22T11:00:00'),
    trip: trips[5],
    place: places[11], // Hallgrímskirkja
    user: users[1],
  },
  {
    name: 'Northern Lights Hunt',
    description: 'Chase the aurora borealis',
    date: new Date('2025-11-23T22:00:00'),
    trip: trips[5],
    place: undefined, // Countryside
    user: users[2],
  },
];
