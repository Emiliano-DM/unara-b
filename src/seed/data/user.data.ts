import { User } from 'src/users/entities/user.entity';

export const MOCK_USERS: Partial<User>[] = [
  {
    fullname: 'John Doe',
    email: 'john.doe@example.com',
    username: 'johndoe',
    password: 'hashed_password_123', // TODO: Replace with bcrypt hashed password
    profile_picture: 'https://i.pravatar.cc/150?img=1',
  },
  {
    fullname: 'Jane Smith',
    email: 'jane.smith@example.com',
    username: 'janesmith',
    password: 'hashed_password_456', // TODO: Replace with bcrypt hashed password
    profile_picture: 'https://i.pravatar.cc/150?img=2',
  },
  {
    fullname: 'Carlos García',
    email: 'carlos.garcia@example.com',
    username: 'carlosgarcia',
    password: 'hashed_password_789', // TODO: Replace with bcrypt hashed password
    profile_picture: 'https://i.pravatar.cc/150?img=3',
  },
  {
    fullname: 'Maria Rodriguez',
    email: 'maria.rodriguez@example.com',
    username: 'mariarodriguez',
    password: 'hashed_password_101', // TODO: Replace with bcrypt hashed password
    profile_picture: undefined,
  },
  {
    fullname: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashed_password_test', // TODO: Replace with bcrypt hashed password
    profile_picture: undefined,
  },
];
