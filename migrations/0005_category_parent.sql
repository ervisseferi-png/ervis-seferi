-- Hierarchical categories, up to three levels (parent → child → grandchild).

alter table categories
  add column if not exists parent_id integer references categories(id) on delete cascade;

create index if not exists categories_parent_idx
  on categories (parent_id, sort_order);
