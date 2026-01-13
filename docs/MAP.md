# Map Documentation

## 1. Introduction

This document provides an overview of map functionality in **Pillage First, Ask Questions Later**. It covers
implementation details, notes important files, and caveats.

The map size is configurable per game world, and the coordinates system is centered around (0,0).

## 2. Overview

The map is designed to be a static, square grid of tiles.

Each tile has the following properties:

- `id` (incrementing integer)
- `coordinates` (x & y, both integers)
- `type` (`free` or `oasis`. `free` tiles may host player or npc villages, `oasis` tiles may host occupiable oasis or
  unoccupiable oasis (marked as wilderness))
- `attributes` (object, containing `resourceFieldComposition` if tile is `free`, `oasisGraphics` & `isOccupied` if tile
  is `oasis`)

Additional properties then depend on the `type`.

## 3. Map Generation (Seeder)

The map is generated and seeded when a game world is created. This process happens in `tiles-seeder.ts`.

### Grid generation

Initially, a square grid is generated based on the server's map size. To determine the bounds of the usable map, a
circle radius is calculated and any tile outside of this radius is considered a border tile.

### Border tiles

Border tiles are actually not persisted in the database (or anywhere else). Since they don't provide any game value, we
skip
saving them to the database to reduce the size and improve query performance a bit. Since we still need to render them,
we actually dynamically generate them on the frontend.
All border tiles have `type` of `oasis`. They are non-occupiable, provide no bonuses and can spawn no animals.

### Oasis

After this step, we being placing so-called shaped oasis. A shaped oasis is any oasis which spans through multiple
columns or rows.
We implement the same shaped oasis for each resource. We currently implement the following oasis shapes:

Non-shaped group #0:

```
+----+
|    |
+----+
```

Shaped oasis group #1:

```
+----+----+
|    |    |
+----+----+
```

Shaped oasis group #2:

```
+----+----+
|    |    |
+----+----+
|    |    |
+----+----+
```

Shaped oasis group #3:

```
+----+
|    |
+----+
|    |
+----+
|    |
+----+
```

Shaped oasis group #4:

```
+----+----+----+
|    |    |    |
+----+----+----+
```

### Oasis images

Each individual tile in this has a position. Position includes `x` and `y` component and is 0-indexed.

A top-left most tile has position of `0-0`, a tile on the right of it would have a position of `1-0` and a tile,
directly below it, would have a position of `0-1`.

Each individual tile also supports a variant.

All together, resource, group number, position within this group and a variant are used to display the correct image.

Tile image names are generated in the following format:

`{resource}/{oasis-group}-{oasis-group-position-x}-{oasis-group-position-y}-{variant}.avif`

### Occupiable fields

After shaped-oasis have been placed, we begin placing occupiable fields and single-tile oasis. Each field a 5% chance (
at the time of the writing) small
chance of becoming a 1x1 oasis. If field is to become a occupiable field, a `resource_field_composition` property is
determined.

Available resource field compositions:

* `4446`
* `5436`
* `5346`
* `4536`
* `3546`
* `4356`
* `3456`
* `4437`
* `4347`
* `3447`
* `3339`
* `11115`
* `00018`

### Occupiable tile images

Tile image names are generated in the following format:

`{resource_field_composition}.avif`

## 4. API Layer

The API worker serves map data through several endpoints, primarily handled in `map-controllers.ts`:

- **`GET /tiles`**: Fetches all tiles for the current game world. It performs a complex join to include village
  information, player details, and resource compositions. It also calculates the grid layout to ensure the frontend
  receives a complete array representing the map.
- **`GET /tiles/:tileId/troops`**: Fetches troops currently stationed on a specific tile. Used only for querying oasis
  animal troops.
- **`GET /tiles/:tileId/oasis-bonuses`**: Fetches resource production bonuses provided by an oasis.

## 5. Frontend (Hooks)

The frontend consumes map data using React hooks:

- **`useTiles`**: Fetches the raw tile data from the API.
- **`useBorderTiles`**: Generates "border tiles" (the edges of the map that are not explicitly stored in the database)
  to provide a consistent visual boundary.
- **`useMap`**: Combines the database tiles and border tiles into a single, unified map array for rendering.

Map is rendered using a `FixedSizeGrid` component from `react-window` and supports keyboard, scroll pad and mouse-drag
navigation.

## 6. Important files

- [`tile.ts`](/packages/types/src/models/tile.ts): Zod schemas and TypeScript types for tiles.
- [`tiles-seeder.ts`](/packages/db/src/seeders/tiles-seeder.ts): Logic for map generation and initial seeding.
- [`use-map.ts`](/apps/web/app/(game)/(village-slug)/hooks/use-map.ts): Main hook for map data integration on the
  frontend.
- [`map-controllers.ts`](/packages/api/src/controllers/map-controllers.ts): API controllers for fetching map and
  tile-related data.
