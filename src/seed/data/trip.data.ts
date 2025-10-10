import { Trip } from 'src/trips/entities/trip.entity';
import { User } from 'src/users/entities/user.entity';

export const createMockTrip = (user: User[]): Partial<Trip>[] =>{ 
  return [
    {
      name: 'Summer Paris Adventure',
      description: 'A wonderful summer trip to explore the city of lights',
      destination: 'Paris, France',
      startDate: new Date('2025-07-15'),
      endDate: new Date('2025-07-22'),
      users: [user[3], user[1] ]

    },
    {
      name: 'Tokyo Cherry Blossom Tour',
      description: 'Experience the beauty of cherry blossoms in Tokyo',
      destination: 'Tokyo, Japan',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-04-10'),
      users: [user[1], user[2], user[3]]
    },
    {
      name: 'New York City Weekend',
      description: undefined,
      destination: 'New York, USA',
      startDate: new Date('2025-09-05'),
      endDate: new Date('2025-09-08'),
      users: [user[2]]
    },
    {
      name: 'Barcelona Beach Getaway',
      description: 'Relaxing beach vacation with culture and nightlife',
      destination: 'Barcelona, Spain',
      startDate: new Date('2025-08-10'),
      endDate: new Date('2025-08-20'),
      users: [user[4], user[3]]
    },
    {
      name: 'Rome Historical Journey',
      description: 'Discover ancient Rome and Italian cuisine',
      destination: 'Rome, Italy',
      startDate: new Date('2025-10-12'),
      endDate: new Date('2025-10-19'),
      users: [user[0], user[1]]
    },
    {
      name: 'Iceland Northern Lights',
      description: 'Chase the northern lights in the land of ice and fire',
      destination: 'Reykjavik, Iceland',
      startDate: new Date('2025-11-20'),
      endDate: new Date('2025-11-27'),
      users: [user[0], user[1], user[2]]
    },
  ];
}
