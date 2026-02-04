# Wedding Planner

A lightweight, collaborative wedding planning tool with a category × timeframe grid layout. Track tasks, set due dates, and coordinate with your partner in real-time.

## Features

- **Grid View**: Category rows × timeframe columns for organized task management
- **Calendar Views**: Monthly, weekly, and daily views based on task due dates
- **Real-time Sync**: Firebase Firestore keeps everything in sync across devices
- **Drag & Drop**: Move tasks between cells easily
- **Filters**: Filter by status, assignee, or hide completed tasks
- **Mobile Friendly**: Responsive design works on phones and tablets

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/wedding-planner.git
cd wedding-planner
npm install
```

### 2. Set Up Firebase (Optional but recommended)

Without Firebase, the app stores data in localStorage (works on one device only).

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database (start in test mode for development)
4. Go to Project Settings > Your Apps > Add Web App
5. Copy the config values

Create `.env.local` from the example:

```bash
cp .env.example .env.local
```

Fill in your Firebase values in `.env.local`.

### 3. Run Locally

```bash
npm run dev
```

Open http://localhost:5173

### 4. Deploy to Vercel

```bash
npm run build
npx vercel --prod
```

Add your Firebase environment variables in Vercel Dashboard > Settings > Environment Variables.

## Project Structure

```
src/
├── components/       # React components
│   ├── views/        # Grid, Monthly, Weekly, Daily views
│   └── calendar/     # Calendar navigation
├── hooks/            # useBoard context hook
└── lib/              # Types, utils, Firebase config

scripts/
├── firebase-tasks.mjs         # CLI for bulk task management
├── set-due-dates.mjs          # Auto-set due dates from timeframes
└── set-intelligent-dates.mjs  # Smart date distribution

skills/
└── weddingplannerskill.md     # Template for wedding context
```

## Firebase CLI

Manage tasks directly from the command line:

```bash
# List all tasks
node scripts/firebase-tasks.mjs list

# Export your board
node scripts/firebase-tasks.mjs export backup.json

# Import tasks from JSON
node scripts/firebase-tasks.mjs add-tasks tasks.json --dry-run
```

See `scripts/firebase-tasks.mjs` for all commands.

## Customization

### Personalizing for Your Wedding

1. Copy `skills/weddingplannerskill.md` to `skills/weddingplannerskill.personal.md`
2. Edit the personal version with your dates, vendors, contacts
3. The `.personal.md` files are gitignored (won't be pushed)

### Adding Categories & Timeframes

Use the app's UI to add/edit categories and timeframes, or use the CLI:

```bash
node scripts/firebase-tasks.mjs add-category "Honeymoon"
```

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- Firebase Firestore
- @dnd-kit for drag & drop
- Lucide React icons

## License

MIT
