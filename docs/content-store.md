# Content store

Quiz content (situations and their questions) is data, not code. Today it lives in JSON files; the plan below moves it to SQLite and then PostgreSQL as the collection grows, without touching the quiz engine or UI.

## Today: JSON files

```
content/situations/<situation-id>.json   one situation and its questions per file
src/content/schema.ts                    the format (TypeScript types, SCHEMA_VERSION)
src/content/validate.ts                  structural checks: ids, references, coverage
src/content/repository.ts                ContentRepository interface + in-memory implementation
src/content/files.ts                     loads and validates the JSON, normalises into rows
src/content/resolve.ts                   record + side + variant -> playable board and question
src/content/index.ts                     the one line that picks the backend
```

The files are bundled into the app at build time (`import.meta.glob`), so the quiz works offline. A broken file fails on load and in `bun run test`.

To add content, add or edit a file, then run the tests. Every situation is built in both mirrors, every variant and every question, many times with jitter. Read each caption against the picture yourself; tests can't check that.

### Rules that make the later moves cheap

- **Ids are permanent.** Situation and question ids are kebab-case and never reused. Progress and stats will key on question ids. If a question's meaning changes (not just wording), give it a new id.
- **Rows already.** `normalise()` splits files into `SituationRecord` and `QuestionRecord` (with `situationId`), the same shape the tables below hold. `MemoryContentRepository` serves those rows.
- **One interface.** The quiz reads content only through `ContentRepository`, and the interface is async because every later backend will be.
- **Columns vs JSON.** Anything you might filter on is a top-level field: status, tags, question type, `when`, weight. Everything that is only ever read whole is nested: layout, variants, options, feedback, plans.
- **Versioned format.** Each file carries `"schema": 1`. A format change bumps `SCHEMA_VERSION` and comes with a migration script.

## Stage 2: SQLite on the device

**Move when** any of these is true:

- You want to track progress (attempts, per-question stats, spaced repetition). This is the likeliest trigger, and it needs a writable database regardless of where content lives.
- Content reaches a few hundred situations, so bundling and parsing all the JSON at startup becomes noticeable.
- You need queries such as "questions tagged breakout that I got wrong", "due for review" or "by difficulty".

**How:**

1. Add `tauri-plugin-sql` (SQLite via sqlx) to `src-tauri`.
2. Add a build step, `bun run content:build`. It validates the JSON, runs the tests, and writes `content.db` with the DDL below. The JSON files stay the source of truth for authoring, and the app ships the compiled database read-only.
3. Implement `SqliteContentRepository` against the same interface, then switch `src/content/index.ts` to it. The JSON loader stays for tests and the web dev server.
4. Put progress in a separate, writable `progress.db`, so a content update can replace `content.db` without touching anyone's history.

## Stage 3: PostgreSQL as the source of truth

**Move when** content needs to change without an App Store release, more than one person authors content, or you want analytics across users.

**How:**

- PostgreSQL holds content using the same DDL (`jsonb` instead of `text` for the JSON columns). Authoring happens there through an admin screen or scripts, and `status` gives a draft/published workflow.
- A publish step exports the published rows into a versioned `content.db` snapshot (with the same validation and tests as today) and uploads it.
- The app downloads new snapshots when online and keeps using the last one offline. **The app never queries PostgreSQL live;** it stays offline-first.
- If you want cross-user stats, progress syncs up separately: append-only attempts keyed by question id.

## Schema

The same tables work for the compiled SQLite file and for PostgreSQL. In SQLite, `jsonb` becomes `text` and `timestamptz` becomes `text`.

```sql
create table situations (
  id             text primary key,            -- kebab-case, permanent
  name           text not null,
  status         text not null check (status in ('draft', 'published')),
  caption        text not null,               -- may contain {side} / {otherSide}
  layout         jsonb not null,              -- { players, puck, loose?, off? }
  variants       jsonb not null default '[]', -- [{ id, weight?, players }]
  arrival_to     text,                        -- binds $F1..$F3
  schema_version integer not null,
  updated_at     timestamptz not null default now()
);

create table situation_tags (
  situation_id text not null references situations (id) on delete cascade,
  tag          text not null,
  primary key (situation_id, tag)
);

create table questions (
  id           text primary key,              -- kebab-case, permanent
  situation_id text not null references situations (id) on delete cascade,
  type         text not null check (type in ('choice', 'spot', 'order', 'pick')),
  prompt       text not null,
  weight       real not null default 1,
  when_side    text check (when_side in ('right', 'left')),
  when_variant text,
  payload      jsonb not null                 -- type-specific: options | target, label, r1, r2 | answer | fb, plan
);
create index questions_situation on questions (situation_id);

-- On the device only (progress.db), not part of published content.
create table attempts (
  id           integer primary key,
  question_id  text not null,
  situation_id text not null,
  side         text not null,
  variant      text,
  grade        integer not null check (grade in (0, 1, 2)),
  answered_at  text not null
);
create index attempts_question on attempts (question_id, answered_at);
```

### Mapping from the JSON format

| JSON (`SituationFile`)            | Table column                                       |
| --------------------------------- | -------------------------------------------------- |
| `id`, `name`, `status`, `caption` | `situations.*`                                     |
| `tags[]`                          | `situation_tags` rows                              |
| `layout`, `variants`              | `situations.layout`, `situations.variants` (JSON)  |
| `arrival.to`                      | `situations.arrival_to`                            |
| `schema`                          | `situations.schema_version`                        |
| `questions[].id/type/prompt`      | `questions.*`                                      |
| `questions[].weight`, `.when`     | `questions.weight`, `when_side`, `when_variant`    |
| everything else in a question     | `questions.payload`                                |

Placements stay inside `layout` instead of getting their own table. They are always read whole with their situation and never queried one by one, so a table would only add joins.
