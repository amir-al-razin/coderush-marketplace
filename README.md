# Coderush Marketplace

A modern web application for student identity and marketplace features, built with Next.js, Supabase, Tailwind CSS, and shadcn/ui.

## Tech Stack

- **Next.js** (App Router)
- **React**
- **Supabase** (Auth & Database)
- **Tailwind CSS**
- **shadcn/ui** (UI components)
- **pnpm** (package manager)

## Folder Structure

```
.
├── frontend/
│   ├── app/                # Next.js app directory (pages, layouts, routes)
│   ├── components/         # Reusable React components (e.g., DarkModeProvider)
│   ├── lib/                # Supabase client setup
│   ├── public/             # Static assets (images, icons, etc.)
│   ├── globals.css         # Global styles (Tailwind)
│   ├── tailwind.config.mjs # Tailwind CSS config
│   ├── ...                 # Other config and lock files
├── README.md               # Project documentation
└── ...                     # (You may have backend or infra here)
```

## How to Run the Frontend

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```
2. **Install dependencies:**
   ```bash
   pnpm install
   ```
3. **Set up environment variables:**
   Create a `.env.local` file in the `frontend` directory with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. **Start the development server:**
   ```bash
   pnpm dev
   ```
5. **Open your browser:**
   Go to [http://localhost:3000](http://localhost:3000)

---

For more details, see the `frontend/README.md`. 