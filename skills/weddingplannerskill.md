# Wedding Planner Skill

## Overview

This skill helps plan a wedding using the Wedding Planner app. Customize this file with your own wedding details, dates, and vendor information.

## Quick Reference (Template)

### Key Dates
- **Wedding Weekend:** [Your dates here]
- **Ceremony:** [Date and time]
- **Venue:** [Venue name and location]

### Critical Deadlines
| Date | Deadline |
|------|----------|
| [Date] | [Deadline description] |
| [Date] | [Deadline description] |

### Confirmed Vendors
- **DJ:** [Vendor name]
- **Photographer:** [Vendor name]
- **Florist:** [Vendor name]
- **Hair & Makeup:** [Vendor name]

---

## Timeframes for Planning App

The app uses customizable timeframes. Example structure:

### Past/Historical
- `juneAug2025` - June-Aug 2025
- `septNov2025` - Sept-Nov 2025

### Current Planning (Weekly)
- `feb1_7` - Feb 1-7
- `feb8_14` - Feb 8-14
- (Add weekly timeframes as needed)

### Wedding Week (Daily)
- `weddingFri` - Friday (Welcome dinner)
- `weddingSat` - Saturday (Wedding day)
- `weddingSun` - Sunday (Checkout)

### Post-Wedding
- `postWedding` - Post-Wedding

---

## Categories for Planning App

Suggested categories (customize as needed):

1. `venue` - Venue coordination, payments
2. `foodDrink` - Catering, dessert, alcohol
3. `invitations` - RSVPs, thank yous
4. `housing` - Guest accommodations
5. `website` - Wedding website, registry
6. `outfits` - Attire, accessories, rings
7. `weddingParty` - Bridesmaids, groomsmen, gifts
8. `family` - Parents, family coordination
9. `ceremony` - Vows, readings, music, flowers
10. `reception` - Seating, toasts, dances, music
11. `hairMakeup` - Hair & Makeup
12. `photography` - Photos, video
13. `entertainment` - Games, activities
14. `decorations` - Decor, signage
15. `transportation` - Shuttles, parking
16. `travel` - Flights, lodging
17. `other` - Admin, license, tips, honeymoon

---

## Task Schema

```typescript
interface Task {
  id: string;
  title: string;
  categoryId: string;
  timeframeId: string;
  notes: string;
  priority: 'normal' | 'high';
  assignee: 'unassigned' | 'bride' | 'groom' | 'both' | 'other';
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  dueDate: Date | null;
  checklist: { id: string; title: string; completed: boolean; }[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Firebase CLI Quick Reference

**Script location:** `scripts/firebase-tasks.mjs`

**Run from project root:** `node scripts/firebase-tasks.mjs <command> [args] [--dry-run]`

| Command | Description |
|---------|-------------|
| `list` | Show all tasks grouped by category |
| `list-categories` | Show all categories with task counts |
| `list-timeframes` | Show all timeframes with task counts |
| `add-category "Name"` | Create a new category |
| `add-tasks file.json` | Import tasks from JSON file |
| `move-tasks "pattern" "Cat"` | Move matching tasks to category |
| `delete-task <id\|pattern>` | Delete a task |
| `update-task <id> <field> <value>` | Update a task field |
| `bulk-update <field> <value> "pattern"` | Update matching tasks |
| `export [file.json]` | Export board to JSON backup |

**Tip:** Add `--dry-run` to any command to preview without saving.

---

## Workflow: Adding Tasks

1. **List current state:**
   ```bash
   node scripts/firebase-tasks.mjs list
   ```

2. **Create task JSON:**
   ```json
   [
     {
       "title": "Task description",
       "category": "Category Name",
       "timeframe": "Feb 15-21",
       "notes": "Details and context",
       "assignee": "both",
       "priority": "normal",
       "checklist": ["Step 1", "Step 2"]
     }
   ]
   ```

3. **Preview with dry-run:**
   ```bash
   node scripts/firebase-tasks.mjs add-tasks tasks.json --dry-run
   ```

4. **Import if approved:**
   ```bash
   node scripts/firebase-tasks.mjs add-tasks tasks.json
   ```

---

## Assignee Conventions

| Value | Use For |
|-------|---------|
| `both` | Joint decisions, shared tasks |
| `bride` | Bride's responsibility |
| `groom` | Groom's responsibility |
| `other` | Delegated to family/vendors/wedding party |
| `unassigned` | Not yet decided |

---

## Customization

Replace this template with your own wedding details:
- Update Key Dates section with your dates
- Add your vendors and contacts
- Customize categories and timeframes
- Add any venue-specific notes

To keep your personal details private while using this repo:
1. Copy this file to `weddingplannerskill.personal.md`
2. Edit the personal version with your real details
3. The `.personal.md` files are gitignored and won't be pushed
