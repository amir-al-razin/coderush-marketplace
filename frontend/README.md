# Coderush Marketplace Frontend

This is the frontend for the Coderush Marketplace project, built with Next.js, Tailwind CSS, and Supabase.

## Features Implemented

- **Next.js App**: Modern React framework with app directory structure.
- **Supabase Integration**: Uses Supabase for authentication and database (students table).
- **User Authentication**:
  - Registration (sign up) and login forms
  - No email confirmation required (instant access after registration)
  - Secure password handling
- **Student Identity & Verification**:
  - Registration form collects:
    - Email
    - University
    - Department
    - Program
    - Year of Study
    - Phone Number
    - Date of Birth
  - All data stored in Supabase `students` table
- **Profile Page**:
  - After login/registration, users are redirected to a welcome page
  - Profile icon and logout button in the top right
  - Displays all user info from the database
- **Dark Mode**:
  - Toggle button in the top right (sun/moon icon)
  - Fully themeable UI (light/dark)
- **Routing**:
  - `/register` — Registration form
  - `/login` — Login form
  - `/welcome` — Welcome/profile page (protected, shows user info)
- **Logout**:
  - Secure logout button, redirects to login
- **Responsive UI**:
  - Mobile-friendly, modern design using Tailwind CSS and shadcn/ui

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Set up your `.env.local` with Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. Run the development server:
```bash
pnpm dev
   ```

## Project Structure

- `app/` — Next.js app directory (pages, layouts)
- `components/` — Reusable React components (e.g., DarkModeProvider)
- `lib/` — Supabase client setup

---

Feel free to extend the project with more features, such as admin dashboards, profile editing, or marketplace functionality!
