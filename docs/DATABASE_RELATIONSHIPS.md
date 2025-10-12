# Database Entity Relationships - Unara Backend

## Overview
This document maps all relationships between database entities in the Unara project.

---

## Entity Relationship Hierarchy

```
User (independent - no relationships yet)
    └── [TODO: Connect to Trips, Places, Items]

ItemCategory (independent)
    └── Item (OneToMany)
        └── LuggageItem (OneToMany)
            └── Luggage (ManyToOne)

Trip (independent - will connect to User)
    ├── Place (OneToMany)
    │   └── Activity (OneToMany)
    ├── Activity (OneToMany)
    └── Luggage (OneToMany)
```

---

## Detailed Entity Relationships

### 1. User
**Location**: `src/users/entities/user.entity.ts`

**Outgoing Relationships**: None (yet)

**Incoming Relationships**: None (yet)

**Notes**:
- Currently has NO relationships defined
- TODOs exist in Trip, Place, and Item entities to connect users
- This should be seeded FIRST as it will be referenced by other entities

**Fields**:
- `id` (UUID, Primary Key)
- `fullname` (string, 255 chars)
- `email` (string, 255 chars, unique)
- `username` (string, 255 chars, unique)
- `password` (text)
- `profile_picture` (text, optional)

---

### 2. ItemCategory
**Location**: `src/item-categories/entities/item-category.entity.ts`

**Outgoing Relationships**:
- **OneToMany** → `Item`
  - Relationship: One category has many items
  - Inverse side: `item.category`

**Incoming Relationships**: None

**Notes**:
- Independent entity with no dependencies
- Should be seeded SECOND (after User, before Item)

**Fields**:
- `id` (UUID, Primary Key)
- `name` (text, unique)
- `description` (text, optional)
- `image` (text)

---

### 3. Item
**Location**: `src/items/entities/item.entity.ts`

**Outgoing Relationships**:
- **OneToMany** → `LuggageItem`
  - Relationship: One item can be in many luggage lists
  - Inverse side: `luggageItem.item`

**Incoming Relationships**:
- **ManyToOne** ← `ItemCategory`
  - Relationship: Many items belong to one category
  - Required: `nullable: false`
  - Foreign key field: `category`

**Notes**:
- Depends on ItemCategory (must exist first)
- Has TODO to connect with users
- Should be seeded THIRD (after ItemCategory)

**Fields**:
- `id` (UUID, Primary Key)
- `name` (string, 255 chars, unique)
- `description` (text, optional)
- `image` (text, optional, unique)
- `category` (ItemCategory reference, required)

---

### 4. Trip
**Location**: `src/trips/entities/trip.entity.ts`

**Outgoing Relationships**:
- **OneToMany** → `Place`
  - Relationship: One trip has many places
  - Cascade: true (deleting trip deletes places)
  - Inverse side: `place.trip`

- **OneToMany** → `Luggage`
  - Relationship: One trip has many luggage lists
  - Inverse side: `luggage.trip`

- **OneToMany** → `Activity`
  - Relationship: One trip has many activities
  - Inverse side: `activity.trip`

**Incoming Relationships**: None (yet)

**Notes**:
- Independent entity (will depend on User in future)
- Has TODO to connect with users
- Should be seeded FOURTH (after User setup is ready)

**Fields**:
- `id` (UUID, Primary Key)
- `name` (string, 255 chars)
- `description` (text, optional)
- `destination` (text)
- `startDate` (timestamp with timezone)
- `endDate` (timestamp with timezone)

---

### 5. Place
**Location**: `src/places/entities/place.entity.ts`

**Outgoing Relationships**:
- **OneToMany** → `Activity`
  - Relationship: One place can have many activities
  - Inverse side: `activity.place`

**Incoming Relationships**:
- **ManyToOne** ← `Trip`
  - Relationship: Many places belong to one trip
  - Delete behavior: CASCADE (deleting trip deletes places)
  - Foreign key field: `trip`

**Notes**:
- Depends on Trip (must exist first)
- Has TODO to connect with users and social media links
- Should be seeded FIFTH (after Trip)

**Fields**:
- `id` (UUID, Primary Key)
- `name` (string, 255 chars)
- `description` (text, optional)
- `latitude` (decimal, 9 precision, 6 scale)
- `longitude` (decimal, 9 precision, 6 scale)
- `trip` (Trip reference)

---

### 6. Activity
**Location**: `src/activities/entities/activity.entity.ts`

**Outgoing Relationships**: None

**Incoming Relationships**:
- **ManyToOne** ← `Trip`
  - Relationship: Many activities belong to one trip
  - Delete behavior: CASCADE (deleting trip deletes activities)
  - Required: Yes
  - Foreign key field: `trip`

- **ManyToOne** ← `Place`
  - Relationship: Many activities can happen at one place
  - Delete behavior: CASCADE (deleting place deletes activities)
  - Required: No (optional)
  - Foreign key field: `place`

**Notes**:
- Depends on Trip (required) and Place (optional)
- Should be seeded SIXTH (after Trip and Place)

**Fields**:
- `id` (UUID, Primary Key)
- `name` (string, 255 chars)
- `description` (text, optional)
- `date` (timestamp)
- `trip` (Trip reference, required)
- `place` (Place reference, optional)

---

### 7. Luggage
**Location**: `src/luggage/entities/luggage.entity.ts`

**Outgoing Relationships**:
- **OneToMany** → `LuggageItem`
  - Relationship: One luggage list has many items
  - Cascade: true (deleting luggage deletes luggage items)
  - Inverse side: `luggageItem.luggage`

**Incoming Relationships**:
- **ManyToOne** ← `Trip`
  - Relationship: Many luggage lists can belong to one trip
  - Delete behavior: SET NULL (deleting trip sets luggage.trip to null)
  - Required: No (optional)
  - Foreign key field: `trip`

**Notes**:
- Optionally depends on Trip
- Has TODO to connect with users
- Should be seeded SEVENTH (after Trip, or independently if no trip)

**Fields**:
- `id` (UUID, Primary Key)
- `name` (text)
- `trip` (Trip reference, optional)

---

### 8. LuggageItem
**Location**: `src/luggage/entities/luggage-item.entity.ts`

**Outgoing Relationships**: None

**Incoming Relationships**:
- **ManyToOne** ← `Luggage`
  - Relationship: Many luggage items belong to one luggage list
  - Delete behavior: CASCADE (deleting luggage deletes items)
  - Required: Yes
  - Foreign key field: `luggage`

- **ManyToOne** ← `Item`
  - Relationship: Many luggage items reference one item definition
  - Delete behavior: CASCADE (deleting item deletes luggage items)
  - Required: Yes
  - Foreign key field: `item`

**Notes**:
- Depends on both Luggage AND Item (both required)
- This is a junction/join table with additional data (quantity)
- Should be seeded LAST (after both Luggage and Item exist)

**Fields**:
- `id` (UUID, Primary Key)
- `luggage` (Luggage reference, required)
- `item` (Item reference, required)
- `quantity` (number, default: 1)

---

## Seeding Order (Dependency-Based)

To properly seed the database, entities must be created in this order:

### Level 1: Independent Entities (No Dependencies)
1. **User** - No relationships yet, but will be referenced by others
2. **ItemCategory** - No dependencies
3. **Trip** - No current dependencies (will depend on User later)

### Level 2: First-Level Dependencies
4. **Item** - Depends on ItemCategory
5. **Place** - Depends on Trip
6. **Luggage** - Optionally depends on Trip

### Level 3: Second-Level Dependencies
7. **Activity** - Depends on Trip (required) and Place (optional)
8. **LuggageItem** - Depends on Luggage AND Item

---

## Cascade Behaviors Summary

### CASCADE (Parent deletion removes children)
- Trip → Place (cascade: true)
- Trip → Luggage → LuggageItem (cascade: true)
- Luggage → LuggageItem (onDelete: CASCADE)
- Trip → Activity (onDelete: CASCADE)
- Place → Activity (onDelete: CASCADE)
- Item → LuggageItem (onDelete: CASCADE)

### SET NULL (Parent deletion nullifies reference)
- Trip → Luggage (onDelete: SET NULL)

---

## Missing Relationships (TODOs)

### User Relationships (Not Yet Implemented)
The following entities have TODOs to connect with User:

1. **Trip** (line 39)
   - `// TODO: Añadir relación con usuarios`
   - Expected: User can have many trips

2. **Place** (line 36)
   - `// TODO: Añadir relación con usuarios`
   - Expected: User can favorite/own places

3. **Item** (line 32)
   - `// TODO: Relacionarlo usuarios`
   - Expected: User can create custom items

4. **Luggage** (line 28)
   - `// TODO usuario asociado`
   - Expected: User owns luggage lists

### Other Missing Features
- **Place** (line 38): `// TODO: Añadir links a TikTok, Instagram, etc`

---

## Relationship Types Quick Reference

### OneToMany (1:N)
- One parent entity has multiple child entities
- Defined on the parent side
- Example: One Trip has many Places

### ManyToOne (N:1)
- Many child entities reference one parent entity
- Defined on the child side
- Example: Many Places belong to one Trip

### Visual Representation
```
OneToMany (Trip → Place)
Trip (1) ────────── (N) Place
         OneToMany

ManyToOne (Place → Trip)
Place (N) ────────── (1) Trip
          ManyToOne

These are inverse sides of the same relationship!
```

---

## Tips for Seeding

### 1. Create Parents Before Children
Always create entities in dependency order:
```
✅ Create Trip first, then Place
❌ Don't create Place without Trip
```

### 2. Handle Optional Relationships
Some relationships are optional:
- Activity.place (can be null)
- Luggage.trip (can be null)

You can create these entities without the optional foreign key.

### 3. Use Generated IDs
Don't hardcode UUIDs. Create entities and use their returned IDs:
```typescript
// ✅ Good
const trip = await tripRepository.save({ name: "Paris Trip", ... });
const place = await placeRepository.save({ trip: trip, ... });

// ❌ Bad
const place = await placeRepository.save({
  trip: { id: "some-hardcoded-uuid" },
  ...
});
```

### 4. Respect Cascade Settings
- CASCADE relationships will auto-delete children
- SET NULL relationships will preserve children but remove reference

---

**Last Updated**: 2025-10-05
**Generated for**: Unara Backend Seed Implementation
