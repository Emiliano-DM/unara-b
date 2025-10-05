import { Place } from 'src/places/entities/place.entity';
import { Trip } from 'src/trips/entities/trip.entity';

export const createMockPlaces = (trips: Trip[]): Partial<Place>[] => [
  {
    name: 'Eiffel Tower',
    description: 'Iconic iron lattice tower on the Champ de Mars',
    latitude: 48.858844,
    longitude: 2.294351,
    trip: trips[0], // Summer Paris Adventure
  },
  {
    name: 'Louvre Museum',
    description: 'The world\'s largest art museum and historic monument',
    latitude: 48.860611,
    longitude: 2.337644,
    trip: trips[0], // Summer Paris Adventure
  },
  {
    name: 'Senso-ji Temple',
    description: 'Ancient Buddhist temple in Asakusa',
    latitude: 35.714765,
    longitude: 139.796661,
    trip: trips[1], // Tokyo Cherry Blossom Tour
  },
  {
    name: 'Shibuya Crossing',
    description: 'Famous scramble crossing in Tokyo',
    latitude: 35.659515,
    longitude: 139.700474,
    trip: trips[1], // Tokyo Cherry Blossom Tour
  },
  {
    name: 'Central Park',
    description: 'Urban park in Manhattan',
    latitude: 40.785091,
    longitude: -73.968285,
    trip: trips[2], // New York City Weekend
  },
  {
    name: 'Statue of Liberty',
    description: 'Colossal neoclassical sculpture on Liberty Island',
    latitude: 40.689247,
    longitude: -74.044502,
    trip: trips[2], // New York City Weekend
  },
  {
    name: 'Sagrada Familia',
    description: 'Large unfinished Roman Catholic church designed by Gaudí',
    latitude: 41.403629,
    longitude: 2.174356,
    trip: trips[3], // Barcelona Beach Getaway
  },
  {
    name: 'Barceloneta Beach',
    description: 'Popular beach in Barcelona',
    latitude: 41.377491,
    longitude: 2.190640,
    trip: trips[3], // Barcelona Beach Getaway
  },
  {
    name: 'Colosseum',
    description: 'Oval amphitheatre in the centre of Rome',
    latitude: 41.890210,
    longitude: 12.492231,
    trip: trips[4], // Rome Historical Journey
  },
  {
    name: 'Trevi Fountain',
    description: 'Famous Baroque fountain in Rome',
    latitude: 41.900932,
    longitude: 12.483313,
    trip: trips[4], // Rome Historical Journey
  },
  {
    name: 'Blue Lagoon',
    description: 'Geothermal spa in Iceland',
    latitude: 63.880686,
    longitude: -22.449337,
    trip: trips[5], // Iceland Northern Lights
  },
  {
    name: 'Hallgrímskirkja',
    description: 'Lutheran church in Reykjavik',
    latitude: 64.141667,
    longitude: -21.926944,
    trip: trips[5], // Iceland Northern Lights
  },
];
