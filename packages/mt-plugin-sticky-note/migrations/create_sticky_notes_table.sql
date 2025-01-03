create table notes (
  id bigint generated by default as identity primary key,
  screen_id varchar(255) not null,
  user_id varchar(100) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index notes_screen_id_idx on notes(screen_id); 
