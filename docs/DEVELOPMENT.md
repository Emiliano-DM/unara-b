# Unara Travel Planning API - Development Guide

## 🚀 Quick Start

This guide will help you set up the Unara travel planning application for local development.

## 📋 Prerequisites

Ensure you have the following installed on your system:

- **Node.js** (v18.x or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL** (v13.x or higher) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

### Recommended Tools
- **VS Code** with extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - NestJS Files
  - PostgreSQL (by Chris Kolkman)

## 🛠 Environment Setup

### 1. Clone the Repository
```bash
git clone [repository-url]
cd unara-b
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup

#### Using Docker (Recommended)
```bash
# Start PostgreSQL container
docker compose up -d

# The database will be available at:
# Host: localhost
# Port: 5432
# Database: unara_db
# Username: postgres
# Password: password
```

#### Manual PostgreSQL Setup
1. Install PostgreSQL
2. Create a database named `unara_db`
3. Create a user with appropriate permissions

### 4. Environment Configuration

Create a `.env` file in the project root:
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=unara_db
DB_USERNAME=postgres
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here-minimum-32-characters
JWT_EXPIRES_IN=15m

# Application Configuration
PORT=3002
NODE_ENV=development
```

**Important:** Replace `JWT_SECRET` with a secure random string in production.

### 5. Database Migration
```bash
# Run database migrations
npm run migration:run
```

## 🚀 Development Commands

### Start Development Server
```bash
npm run start:dev
```
Application will be available at `http://localhost:3002`

### API Documentation
Once the server is running, access the interactive API documentation:
- **Swagger UI**: `http://localhost:3002/api/docs`

### Testing
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run end-to-end tests
npm run test:e2e

# Generate test coverage report
npm run test:cov
```

### Code Quality
```bash
# Run TypeScript type checking
npm run typecheck

# Run ESLint
npm run lint

# Auto-fix ESLint issues
npm run lint --fix

# Format code with Prettier
npm run format
```

### Build for Production
```bash
npm run build
```

## 🏗 Project Architecture

### Directory Structure
```
src/
├── auth/                    # Authentication module
│   ├── decorators/         # Custom decorators (@CurrentUser)
│   ├── dto/                # Data Transfer Objects
│   ├── guards/             # Authentication guards
│   └── strategies/         # Passport strategies
├── trips/                   # Trip management module
├── users/                   # User management module
├── items/                   # Item management module
├── luggage/                 # Luggage management module
├── luggage-categories/      # Luggage category module
├── item-categories/         # Item category module
├── common/                  # Shared utilities and types
│   ├── decorators/         # Common decorators
│   ├── dto/                # Shared DTOs (pagination)
│   ├── enums/              # Application enums
│   └── interfaces/         # TypeScript interfaces
└── database/                # Database configuration
    └── migrations/         # Database migration files
```

### Architecture Patterns
- **Clean Architecture**: Controllers → Services → Repositories
- **Dependency Injection**: NestJS IoC container
- **JWT Authentication**: Stateless authentication strategy
- **Database-First**: TypeORM with explicit migrations
- **Validation**: class-validator and class-transformer

## 🗄 Database Operations

### Create a New Migration
```bash
npm run migration:create -- CreateNewFeatureTable
```

### Generate Migration from Entity Changes
```bash
npm run migration:generate -- UpdateEntityName
```

### Run Migrations
```bash
npm run migration:run
```

### Revert Last Migration
```bash
npm run migration:revert
```

## 🧪 Testing Guidelines

### Test Structure
- **Unit Tests**: `src/**/*.spec.ts`
- **Integration Tests**: `test/integration/*.spec.ts`
- **E2E Tests**: `test/e2e/*.spec.ts`

### Writing Tests
```typescript
describe('AuthService', () => {
  let service: AuthService;
  let userService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, /* mock providers */],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should register a new user', async () => {
    const registerDto = { /* test data */ };
    const result = await service.register(registerDto);
    expect(result).toBeDefined();
  });
});
```

### Authentication in Tests
```typescript
// Generate test JWT token
const token = jwt.sign({ sub: userId }, 'test-secret');

// Use in requests
const response = await request(app.getHttpServer())
  .get('/api/trips')
  .set('Authorization', `Bearer ${token}`);
```

## 🔧 Common Development Tasks

### Adding a New Feature Module
```bash
# Generate a complete CRUD module
nest generate module feature-name
nest generate service feature-name
nest generate controller feature-name

# Generate specific components
nest generate guard feature-name/guards/feature-guard
nest generate decorator feature-name/decorators/feature-decorator
```

### Database Entity Development
1. Create the entity in `src/feature/entities/`
2. Add validation decorators
3. Define relationships
4. Generate and run migration
5. Create corresponding DTOs

### API Endpoint Development
1. Define DTOs with validation decorators
2. Implement service methods with business logic
3. Create controller endpoints with Swagger documentation
4. Add authentication guards
5. Write comprehensive tests

## 🔐 Authentication Development

### Current User Context
```typescript
// In controllers, get the current authenticated user
@Get()
findUserTrips(@CurrentUser() user: User) {
  return this.tripsService.findByUser(user.id);
}
```

### Protected Routes
```typescript
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller('protected-resource')
export class ProtectedController {
  // All routes require authentication
}
```

## 📊 Performance Considerations

### Database Queries
- Use `@Index()` decorators for frequently queried fields
- Implement pagination for list endpoints
- Use `eager: true` judiciously to avoid N+1 queries

### Caching Strategy
- Consider Redis for session storage
- Implement query result caching for expensive operations
- Use HTTP caching headers appropriately

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
netstat -ano | grep :3002

# Kill the process (Windows)
taskkill /PID [process_id] /F
```

#### Database Connection Issues
1. Verify PostgreSQL is running
2. Check `.env` database configuration
3. Ensure database exists
4. Verify user permissions

#### Migration Errors
```bash
# Reset database (CAUTION: loses all data)
npm run migration:revert
npm run migration:run
```

#### JWT Token Issues
1. Verify JWT_SECRET is properly set
2. Check token expiration time
3. Ensure proper Bearer token format

### Debug Mode
```bash
# Start with debug logging
npm run start:debug

# The debugger will be available on port 9229
# Connect VS Code debugger or use browser dev tools
```

## 📝 Code Style Guidelines

### TypeScript
- Use strict type checking
- Prefer interfaces for object types
- Use enums for constants
- Enable all strict compiler options

### NestJS Conventions
- Use dependency injection instead of direct imports
- Implement proper exception handling
- Use decorators for cross-cutting concerns
- Follow module organization patterns

### Database
- Use migrations for all schema changes
- Index frequently queried columns
- Use proper foreign key constraints
- Implement soft deletes where appropriate

## 🤝 Contributing

### Git Workflow
1. Create a feature branch: `git checkout -b feature/description`
2. Make your changes
3. Run tests: `npm run test`
4. Run linting: `npm run lint`
5. Commit with descriptive message
6. Push and create a pull request

### Code Review Checklist
- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] API documentation updated (Swagger)
- [ ] Database migrations included if needed
- [ ] No security vulnerabilities introduced
- [ ] Performance impact considered

### Commit Message Format
```
type(scope): description

Examples:
feat(auth): add password reset functionality
fix(trips): resolve participant invitation bug
docs(api): update swagger documentation
test(users): add integration tests for user service
```

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/) - JWT token debugger
- [Swagger Documentation](https://swagger.io/docs/)

## 🆘 Getting Help

If you encounter issues:

1. Check this documentation first
2. Search existing GitHub issues
3. Create a detailed bug report with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Error messages/logs

---

**Happy coding! 🚀**