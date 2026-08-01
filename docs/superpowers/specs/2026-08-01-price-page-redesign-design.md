# Price Page Redesign

## Goal
Redesign the public Price page with service photo cards, overlay name/price on the photo, and description as a bullet list below.

## Frontend Changes

### PriceItem type (`types/index.ts`)
Add `imageUrl` field:
```diff
export interface PriceItem {
  id: number;
  name: string;
  description: string;
  price: string;
  orderIndex?: number;
+ imageUrl: string | null;
}
```

### Card design (`Price.tsx` + `Price.module.css`)
Each service renders as a card with two visual zones:

**Photo zone (top)**
- Photo fills the card width at fixed height (220px on desktop, 180px on mobile)
- `object-fit: cover` so all photos fill uniformly regardless of original aspect ratio
- Gradient overlay from bottom: `linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.15) 55%, rgba(0,0,0,.05) 100%)`
- Over the overlay, bottom-aligned:
  - **Name** — `var(--font-heading-display) (Bad Script)`, white, large
  - **Price** — `var(--accent) (#5c6a42)`, prominent below the name

**Description zone (bottom)**
- Separated visually from the photo — white background (`var(--card-bg)`)
- Description text is split by newlines, each line becomes a `<li>` with `•` marker and dashed bottom border
- Lines rendered in `var(--text-secondary) (#666)`, small font
- Last item has no border

**Grid layout**
- Base: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))` — adapts columns to available width
- Desktop: 3 columns at 960px+, 2 at 640-959px, 1 below 640px
- Cards have `border-radius: 16px`, `box-shadow: var(--shadow)`, `border: 1px solid var(--border)`
- Hover: subtle translateY(-4px) and enhanced shadow

### Updated `Price.module.css`
New or heavily modified styles:
- `.card` — flex column, overflow hidden, border-radius 16px
- `.photoWrapper` — relative container, height 220px, overflow hidden
- `.overlay` — absolute, inset 0, gradient background
- `.overlayContent` — absolute, bottom 0, padding, white text
- `.photoTitle` — font-heading-display, white, 1.5rem
- `.photoPrice` — accent color, 1.3rem, bold
- `.descriptionList` — white bg, padding, list reset
- `.descriptionItem` — flex row, dash border bottom, padding 0.4rem 0, text-secondary

### Updated `usePrice.ts`
No changes needed — already fetches from `/content/price-items` which returns all fields including the new `imageUrl`.

### Admin page (`PriceItemsAdmin.tsx`)
Add image upload to the form:
- New field `imageUrl` with a `DropZone` component (same pattern as other admin CRUD pages)
- Use `useUploadImage` hook for file upload
- After upload, save the returned URL to the PriceItem
- Preview thumbnail in the admin table row
- Add `imageUrl` column to `DraggableTable` columns array

## Backend Changes

### Entity (`price-item.entity.ts`)
Add column:
```ts
@Column({ nullable: true })
imageUrl!: string;
```

### DTOs
- `CreatePriceItemDto` — add `@IsOptional() @IsString() imageUrl?`
- `UpdatePriceItemDto` — inherits via PartialType, no change needed
- Price validation regex: `@Matches(/^[\d\s]+$/)` → relax to accept any text since some prices may be discussed individually. Change to just `@IsString()` with no regex.

## Migration
Generate TypeORM migration to add `imageUrl` column to `price_items` table.

## Description rendering
The admin continues to enter description as plain text. On the frontend, the text is split by newlines (`\n`). Each non-empty line becomes one `<li>` item.

This allows admins to enter bullet points naturally:
```
Полный день съёмки (до 10 часов)
2 фотографа
Обработка всех удачных фото
Выезд по городу и области
```

## Build order
1. Backend entity + DTO + migration
2. Admin page: add image upload
3. Frontend: Price page redesign + CSS
4. Lint + type-check + verify

## Affected files

| File | Change |
|------|--------|
| `backend/src/content/entities/price-item.entity.ts` | Add `imageUrl` column |
| `backend/src/content/dtos/create-price-item.dto.ts` | Add `imageUrl`, relax price regex |
| Backend migration | Auto-generated `AddPriceItemImageUrl` |
| `frontend/src/types/index.ts` | Add `imageUrl` to `PriceItem` |
| `frontend/src/pages/Price.tsx` | Complete redesign |
| `frontend/src/pages/Price.module.css` | New card styles |
| `frontend/src/pages/admin/PriceItemsAdmin.tsx` | Add image upload field |

## Non-goals
- No changes to the public API endpoint structure
- No changes to the price-items service logic
- No changes to other pages or routing