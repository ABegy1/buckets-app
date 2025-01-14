Here's the completed and extended README file tailored to your **Buckets** application:

---

# Buckets App

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app). It serves as a dynamic application for managing a sports-based ecosystem, featuring user roles (Admin/User), real-time updates, and various season/game management functionalities.

## Getting Started

First, clone the repository and install the required dependencies:

```bash
git clone <repository-url>
cd buckets-app
npm install
```

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

### Important Notes:
- **Google Authentication Redirection Issue**: While running locally, logging in with Google redirects to the live hosted web domain address. This is a high-priority issue to enable seamless local component testing. For now, ensure your environment variables are correctly set for testing locally.
- The app uses real-time updates extensively through Supabase, so ensure your local Supabase instance or connection is correctly configured.

---

## File Structure

This project is organized as follows:

```
/app
  /components    # Reusable UI components (e.g., modals, forms)
  /hooks         # Custom hooks for state management and data fetching
  /styles        # Global and modular styles
  /pages         # Next.js pages
  /api           # API routes (e.g., for user role management)
```

Key files:
- `app/page.tsx`: Home page for the app.
- `supabaseClient.js`: Configuration for connecting to Supabase.
- `components/Modal.tsx`: Core modal logic reused across the app.
- `components/EditPlayerModal.tsx`: For editing player details.
- `components/NextSeasonModal.tsx`: Handles next season configuration.

---

## Database

The app uses [Supabase](https://supabase.com) as its backend, leveraging its database and real-time functionalities. Below is an overview of the database schema and key tables:

### Key Tables:
- **`players`**: Stores information about players, their tier, team associations, and free-agent status.
- **`teams`**: Manages team information, including scores and associated players.
- **`tiers`**: Tracks tier-specific data, such as names and colors.
- **`player_instance`**: Contains player stats for specific seasons.
- **`stats`**: Historical statistics for players across all seasons.
- **`seasons`**: Tracks season-level information, including name, rules, and shot totals.
- **`shots`**: Logs individual player shots, including outcomes and tier associations.

![Database Schema](image.png)

For more details, refer to the [Supabase documentation on real-time functionality](https://supabase.com/docs/guides/realtime?queryGroups=language&language=js).

---

## Key Features

1. **Role-Based Access Control**:
   - Admins can manage teams, tiers, players, and rules.
   - Regular users interact with standings and track performance.

2. **Season Management**:
   - Admins can close current seasons and set up new ones.
   - Automatic MVP and team stats calculations at season close.

3. **Real-Time Updates**:
   - Standings, free-agency lists, and stats are updated in real time.
   - Supabase channels track database changes.

4. **Custom Modals for Data Management**:
   - Modals for editing players, teams, tiers, and other resources.

5. **Responsive UI**:
   - Built with Tailwind CSS and modular components for consistency.

---

## Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Ensure these variables are correctly configured for both local and production environments.

---

## Onboarding a New Developer

If you're new to the **Buckets App**, follow these steps to get started:

1. **Set Up the Development Environment**:
   - Clone the repository and install dependencies.
   - Ensure you have a Supabase account and the necessary environment variables.

2. **Familiarize Yourself with Supabase**:
   - The app uses Supabase for authentication, real-time updates, and database management. Review the [Supabase docs](https://supabase.com/docs).

3. **Understand the Core Features**:
   - Focus on the key components like `Modal.tsx`, `NextSeasonModal.tsx`, and `EditPlayerModal.tsx`.
   - Review the `supabaseClient.js` file for API interactions.

4. **Run and Debug Locally**:
   - Run `npm run dev` and test the app locally.
   - Pay attention to Google OAuth redirection issues (documented above).

5. **Explore the File Structure**:
   - Check the `/hooks` directory for reusable logic like `useUserView` and `/components` for UI elements.

6. **Common Debugging Tips**:
   - Use the browser console and `console.log` for inspecting data flow.
   - Check Supabase logs for errors in real-time updates or API calls.

---

## Deployment

Deploy the app using Vercel for seamless integration with Next.js:
1. Connect your repository to Vercel.
2. Set up environment variables in the Vercel dashboard.
3. Deploy and test the live app.

For more details, refer to the [Next.js Deployment Documentation](https://nextjs.org/docs/deployment).

---

## Future Enhancements

1. Fix the Google authentication redirection issue during local development.
2. Add unit and integration tests using Jest and React Testing Library.
3. Expand player and team management features with bulk operations.
4. Improve documentation for API routes and Supabase functions.

---
# Developer Notes

## Author Information
- **Name**: Aaron Begy
- **Email**: [abegy7@gmail.com](mailto:abegy7@gmail.com)
- **Phone**: 440-591-2020

## Onboarding Instructions
To gain access to the Supabase database and begin development, follow these steps:

1. **Create a Supabase Account**  
   Visit [Supabase](https://supabase.com) and create an account if you do not already have one.

2. **Request Access**  
   Contact Aaron Begy via email or phone to be added to the Supabase team associated with this project.

3. **Accept the Invitation**  
   Once added, you will receive an email invitation to join the Supabase project team. Follow the instructions in the invitation to gain access.

4. **Environment Setup**  
   Ensure your local development environment is configured with the correct Supabase credentials and environment variables. Refer to the `.env.example` file for required keys.

5. **Review the Documentation**  
   Check the project `README.md` or related documentation for additional setup and development guidelines.

## Support
If you encounter any issues or need further clarification, feel free to reach out to Aaron Begy using the contact information provided above.
