-- Profile photo shown next to the brand name in the header.

alter table site_settings
  add column if not exists avatar_image text not null default '';
