# Contacts Entity Design

## Overview

Replace the current `social_links` table/entity with a generic `contacts` entity that supports multiple phone numbers and social media links in a single ordered list.

## Data Model

### Table: `contacts`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | |
| `type` | VARCHAR | NOT NULL, CHECK('phone' OR 'social') | Discriminator — phone number or social link |
| `value` | VARCHAR | NOT NULL | Phone number as entered (+7 999 123-45-67) or social URL |
| `platform` | VARCHAR | NULL | Social platform name ("Instagram", "Telegram"), NULL for phones |
| `iconName` | VARCHAR | NULL | Icon identifier ("SiInstagram"), NULL for phones |
| `label` | VARCHAR | NULL | Optional description (e.g. "Мобильный", "Рабочий") |
| `orderIndex` | INTEGER | DEFAULT 0 | Sort order |

### TypeScript Interface

```ts
interface Contact {
  id: number;
  type: 'phone' | 'social';
  value: string;
  platform?: string | null;
  iconName?: string | null;
  label?: string | null;
  orderIndex?: number;
}
```

## Backend API

### Admin endpoints (JWT-guarded, prefix `/api/admin/contacts`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/contacts` | List all contacts ordered by `orderIndex` |
| GET | `/api/admin/contacts/:id` | Get one contact |
| POST | `/api/admin/contacts` | Create contact |
| PATCH | `/api/admin/contacts/:id` | Update contact |
| DELETE | `/api/admin/contacts/:id` | Delete contact |
| PATCH | `/api/admin/contacts/reorder` | Reorder contacts |

### Public endpoint (prefix `/api/content/contacts`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/content/contacts` | List all contacts ordered by `orderIndex` |

### DTOs

```ts
class CreateContactDto {
  @IsEnum(['phone', 'social'])
  type: 'phone' | 'social';

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  iconName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;

  @IsOptional()
  @IsInt()
  orderIndex?: number;
}
```

`UpdateContactDto` extends `PartialType(CreateContactDto)`.

## Frontend: Public

### Component: `Contacts.tsx`

Renders all contacts in a single flex container, ordered by `orderIndex`:

- **Phone entries**: Phone icon (📞) + `value` as `tel:` link + `label` (e.g. "Мобильный")
- **Social entries**: Brand icon (from `socialIconMap`) + `value` as external link + `label` (text next to icon)

Replaces `SocialLinks.tsx`. Used in:
- `Layout.tsx` (footer)
- `About.tsx` (bio section)

### Hook: `useContacts.ts`

```ts
const useContacts = () => {
  const { data, loading, error } = useFetch<Contact[]>('/content/contacts');
  return { contacts: data ?? [], loading, error };
};
```

Replaces `useSocialLinks.ts`.

## Frontend: Admin

### Page: `ContactsAdmin.tsx` (route `/admin/contacts`)

Single unified admin page:

- **Add button**: Dropdown with type selection (Телефон / Соцсеть)
- **Dynamic form**:
  - `type='phone'`: `value` (phone number) + `label` (description)
  - `type='social'`: `platform` select (auto-fills `iconName`) + `value` (URL) + `label`
- **Table**: All contacts in one draggable/reorderable list
  - Phone rows: show icon + value + label
  - Social rows: show brand icon + platform + URL + label
- **Actions**: Edit (inline form), Delete (with confirmation)

### Hook: `useAdminContacts.ts`

```ts
const useAdminContacts = () => {
  return useAdminCrud<Contact>('/admin/contacts');
};
```

Replaces `useAdminSocialLinks.ts`.

## Migration

1. Create `contacts` table
2. Insert all existing `social_links` rows into `contacts` with `type='social'`
3. Drop `social_links` table
4. Remove old social_links migration record (or let it be)

## Files to Delete

- `backend/src/content/entities/social-link.entity.ts`
- `backend/src/content/dtos/create-social-link.dto.ts`
- `backend/src/content/dtos/update-social-link.dto.ts`
- `backend/src/content/services/social-links.service.ts`
- `backend/src/content/controllers/admin-social-links.controller.ts`
- `frontend/src/components/SocialLinks.tsx`
- `frontend/src/components/SocialLinks.module.css`
- `frontend/src/hooks/useSocialLinks.ts`
- `frontend/src/hooks/admin/useAdminSocialLinks.ts`
- `frontend/src/pages/admin/SocialLinksAdmin.tsx`
- `frontend/src/pages/admin/SocialLinksAdmin.module.css` (if exists)

## Files to Create

- `backend/src/content/entities/contact.entity.ts`
- `backend/src/content/dtos/create-contact.dto.ts`
- `backend/src/content/dtos/update-contact.dto.ts`
- `backend/src/content/services/contacts.service.ts`
- `backend/src/content/controllers/admin-contacts.controller.ts`
- `backend/src/migrations/<timestamp>-CreateContactsTable.ts`
- `frontend/src/components/Contacts.tsx`
- `frontend/src/components/Contacts.module.css`
- `frontend/src/hooks/useContacts.ts`
- `frontend/src/hooks/admin/useAdminContacts.ts`
- `frontend/src/pages/admin/ContactsAdmin.tsx`
- `frontend/src/pages/admin/ContactsAdmin.module.css` (if needed)
- `frontend/src/pages/admin/adminCrud.module.css` (if needed, shared styles)

## Files to Modify

- `backend/src/content/content.module.ts` — register Contact entity, ContactsService, AdminContactsController
- `backend/src/content/controllers/public-content.controller.ts` — replace social-links endpoint with contacts
- `frontend/src/types/index.ts` — replace SocialLink interface with Contact
- `frontend/src/App.tsx` — route `/admin/contacts` → `ContactsAdmin`, remove `/admin/social-links`
- `frontend/src/pages/admin/AdminLayout.tsx` — sidebar link "Контакты" instead of "Социальные сети"
- `frontend/src/components/Layout.tsx` — import + use `Contacts` instead of `SocialLinks`
- `frontend/src/pages/About.tsx` — import + use `useContacts` instead of `useSocialLinks`, `Contacts` instead of `SocialLinks`
- `frontend/src/hooks/index.ts` — update exports