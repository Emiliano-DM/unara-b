# Database Seeding Guide for Unara Backend

## What is Database Seeding?

Database seeding is the process of populating your database with initial or sample data. This is essential for:
- **Development**: Testing features with realistic data
- **Testing**: Running automated tests with known data states
- **Demos**: Showing the app with meaningful content

---

## Understanding Your Database Structure

### Current Entities in Unara
Your backend has these main entities (found in `src/*/entities/*.entity.ts`):

1. **user.entity.ts** - Users/accounts
2. **trip.entity.ts** - Trips planned by users
3. **activity.entity.ts** - Activities within trips
4. **place.entity.ts** - Locations/places
5. **luggage.entity.ts** - Luggage lists
6. **luggage-item.entity.ts** - Individual items in luggage
7. **item.entity.ts** - Item definitions
8. **item-category.entity.ts** - Categories for items

### Key Concept: Data Relationships

**Think of it like building blocks:**
- You must create **foundation blocks** before **dependent blocks**
- Example: You need **users** before creating **trips** (because trips belong to users)
- Example: You need **trips** before creating **activities** (because activities belong to trips)

**Exercise for you:**
1. Open each entity file
2. Look for relationships (words like `@ManyToOne`, `@OneToMany`, `@ManyToMany`)
3. Draw a diagram showing which entities depend on others

---

## Planning Your Seed Data

### Step 1: Identify Dependencies
Ask yourself:
- Which entities have NO dependencies? (Start here)
- Which entities reference others? (Create these later)
- What's the logical order?

**Hint**: Look for foreign key fields in entities (e.g., `userId`, `tripId`)

### Step 2: Design Realistic Test Data

**Users:**
- How many test users do you need?
- What different types of users? (regular users, admins?)
- What information does each user need?

**Trips:**
- What states should test trips be in? (upcoming, active, completed)
- Should some users have multiple trips?
- Should some trips have no activities (edge case)?

**Activities/Places:**
- What types of activities make sense?
- How many activities per trip is realistic?
- Should some be optional vs required?

### Step 3: Think About Data Realism

**Good seed data:**
- Represents real-world scenarios
- Includes edge cases (empty lists, maximum items)
- Uses realistic values (real city names, valid dates)

**Poor seed data:**
- Generic "test1", "test2" names
- Unrealistic combinations
- Missing edge cases

---

## Technical Implementation Research

### Questions to Answer Through Research:

#### 1. **Where do seed files go?**
- Research NestJS project structure standards
- Look for common patterns: `src/database/seeds/`, `src/seeds/`, etc.
- Check NestJS + TypeORM documentation

#### 2. **How to write a seed script?**
Topics to research:
- How to connect to database in a standalone script
- How to use TypeORM repositories in seeds
- How to handle TypeScript compilation for scripts
- How to use environment variables in seed scripts

#### 3. **How to make seeds safe?**
Important concepts:
- **Idempotency**: Running seed multiple times doesn't break things
- **Clearing old data**: Should you delete existing data first?
- **Transaction safety**: What if seeding fails halfway?

Research:
- TypeORM's `clear()` method
- Database transactions
- Error handling strategies

#### 4. **How to run your seed?**
You'll need to:
- Create an npm script in `package.json`
- Decide on a naming convention (e.g., `npm run seed`)
- Consider: `npm run seed:run` vs `npm run seed:reset`

---

## Step-by-Step Process (High Level)

### Phase 1: Research & Setup
1. Read NestJS documentation on database seeding
2. Read TypeORM documentation on repositories and data insertion
3. Decide on your seed file location
4. Create the seed file structure

### Phase 2: Write Seed Logic
1. Start with simplest entity (probably users or item-categories)
2. Create sample data for that entity
3. Test inserting that data
4. Move to next entity in dependency chain
5. Repeat until all entities are seeded

### Phase 3: Make it Robust
1. Add error handling
2. Add logging (so you know what's happening)
3. Make it idempotent (safe to run multiple times)
4. Add clear messages about what's being seeded

### Phase 4: Integration
1. Add npm script to `package.json`
2. Document how to use it (README or separate doc)
3. Test in fresh database
4. Verify all relationships are correct

---

## Important Considerations

### Security
**Question:** How do you store passwords for test users?
- Research: Password hashing in NestJS
- Never store plain text passwords
- Look into bcrypt or similar libraries

### Data Validation
**Question:** Will your seed data pass validation rules?
- Review your DTOs (Data Transfer Objects)
- Ensure seed data meets all requirements
- Consider validation constraints

### Environment Separation
**Question:** Should seeds run in production?
**Answer:** Usually NO! Only in development/testing

Research:
- How to check `NODE_ENV` variable
- How to prevent accidental production seeding
- Environment-specific configurations

---

## Checklist for Your Seed Implementation

### Before You Start
- [ ] I understand all entities in my database
- [ ] I've mapped out entity dependencies
- [ ] I've read NestJS seeding documentation
- [ ] I've read TypeORM data insertion documentation

### During Implementation
- [ ] Seed files are in appropriate location
- [ ] Data is created in correct dependency order
- [ ] All required fields are populated
- [ ] Passwords are properly hashed
- [ ] Relationships (foreign keys) are correctly set

### Testing Your Seed
- [ ] Seed runs without errors
- [ ] All expected data appears in database
- [ ] Relationships are correct (joins work)
- [ ] Running seed twice doesn't cause errors
- [ ] Can clear and re-seed cleanly

### Final Steps
- [ ] npm script added to package.json
- [ ] Usage documented
- [ ] Tested on clean database
- [ ] Verified in development environment only

---

## Common Pitfalls to Avoid

### 1. **Wrong Order**
Creating dependent entities before their parents
- ❌ Creating trips before users exist
- ✅ Create users first, then trips

### 2. **Missing Required Fields**
Leaving out fields that are marked as required in entities
- Research: Look for `@Column({ nullable: false })` or similar

### 3. **Hard-coded IDs**
Assuming IDs will be specific values
- ❌ "User 1 will have trips 1, 2, 3"
- ✅ Create user, get generated ID, then create trips with that ID

### 4. **No Error Handling**
Script fails silently or with cryptic errors
- ✅ Add try-catch blocks
- ✅ Log progress ("Creating users...", "Users created: 5")

### 5. **Production Risk**
Running seeds in production by accident
- ✅ Add environment checks
- ✅ Add confirmation prompts

---

## Learning Resources to Explore

### Official Documentation
1. **NestJS Database Guide**: Search for "NestJS database seeding"
2. **TypeORM Documentation**: Look for "entity manager", "repository", "insert"
3. **NestJS CLI**: Research if there are built-in seeding commands

### Concepts to Understand
- TypeORM Repository pattern
- Async/await in TypeScript
- Database transactions
- Environment variables in Node.js

### Example Structure to Research
```
What should a seed file look like?
- How to import entities?
- How to connect to database?
- How to use repositories?
- How to execute the seed?
```

---

## Your Next Actions

1. **Read** the entity files to understand relationships
2. **Research** NestJS + TypeORM seeding approaches
3. **Plan** your seed data structure on paper
4. **Start small** with one entity
5. **Expand** to cover all entities
6. **Test thoroughly** before considering it complete

---

## Questions to Ask Yourself

Before implementing, answer these:
- [ ] Do I understand what each entity represents?
- [ ] Do I know which entities depend on others?
- [ ] Have I decided what test data I need?
- [ ] Do I know where seed files should live?
- [ ] Do I understand how to run TypeScript scripts?
- [ ] Have I researched TypeORM data insertion methods?

---

**Good luck with your seed implementation! Remember: Start small, test often, and build incrementally.**

*Document created: 2025-10-05*
*Part of Unara Backend Project*
