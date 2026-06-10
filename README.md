# Mann Beauty Studio — Attendance Manager

A premium, custom-built attendance management application for Mann Beauty Studio. Built with React, Vite, Tailwind CSS, and powered by Firebase Firestore.

## ✨ Features

- **Full-Screen Admin Gate**: A beautiful, secret-key protected login screen ensures only authorized personnel can access the dashboard.
- **Real-Time Data Sync**: Powered by Firebase Firestore, all attendance records and staff additions reflect instantly across devices.
- **Interactive Grid**: A robust, spreadsheet-like grid to view and manage daily attendance, automatically grouped by month.
- **Monthly Summaries**: Automatically calculates total hours per staff member and total hours across the entire studio for any given month.
- **CSV Export**: Export any month's attendance data directly to a perfectly formatted CSV file for payroll processing.
- **Premium UI/UX**: Designed with deep plums, glassmorphism, floating micro-animations, and fluid framer-motion page transitions.

## 🚀 Tech Stack

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 + Material Symbols
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Database**: Firebase Firestore

## 🔒 Security & Environment Setup

To run this app locally or deploy it, you will need a Firebase project and a custom admin password. 

Create a `.env.local` file in the root directory and add the following keys:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Change this to your desired password for the Admin Gate
VITE_ADMIN_SECRET=your_super_secret_password
```

## 🛠️ Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser.

## 🌐 Deployment

This application is ready to be deployed on **Vercel** or **Netlify**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/meetkapadia1710-tech/Attendance-Manager&env=VITE_FIREBASE_API_KEY,VITE_FIREBASE_AUTH_DOMAIN,VITE_FIREBASE_PROJECT_ID,VITE_FIREBASE_STORAGE_BUCKET,VITE_FIREBASE_MESSAGING_SENDER_ID,VITE_FIREBASE_APP_ID,VITE_ADMIN_SECRET)

**Important when Deploying:** Make sure to copy the variables from your `.env.local` file into the Environment Variables section of your hosting provider!

---
*Built specifically for Mann Beauty Studio.*
