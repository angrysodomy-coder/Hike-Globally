import * as migration_20261002_145222_initial from './20261002_145222_initial';

export const migrations = [
  {
    up: migration_20261002_145222_initial.up,
    down: migration_20261002_145222_initial.down,
    name: '20261002_145222_initial'
  },
];
