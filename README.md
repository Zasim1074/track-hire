## TrackHire 🚀
TrackHire is a modern job board and job tracking platform built with a scalable frontend architecture.
It allows users to explore job opportunities, save jobs, and manage applications while enabling recruiters to post and manage job listings.

The project demonstrates production-ready frontend architecture, secure authentication, protected routing, and backend integration.

## 🌐 Live Application
Preview - https://track-hire-jq.vercel.app/

## 🧠 System Architecture
Client (React + Vite)
        │
        │ Authentication
        ▼
Clerk Auth Service
        │
        │ Session + User Metadata
        ▼
Frontend Application
        │
        │ API Queries
        ▼
Supabase (Database + APIs)


## Flow
    User signs in using Clerk authentication
    Clerk generates a secure session token
    React app reads session using useUser()
    User role stored in Clerk metadata
    Application queries Supabase for job data
    Protected routes restrict access to authenticated users

## ✨ Features
    Authentication
    Secure authentication using Clerk
    Persistent sessions
    Modal-based sign in / sign up
    Role-based onboarding
    Job Discovery

# Users can:
    Browse job listings
    View job details
    Explore opportunities across companies
    Job Management

# Users can:
    Save jobs
    Track job opportunities
    Access personalized job lists
    Recruiter Features

# Recruiters can:
    Post job listings
    Manage job posts
    View applications
    Protected Routes

# Custom ProtectedRoute ensures:
    Only authenticated users access private pages
    Role onboarding is completed before accessing features
    Performance Optimizations
    The project implements several frontend performance techniques:
    Code Splitting
    Pages are lazy-loaded using:
    React.lazy()
    Suspense
    This reduces initial bundle size and improves load performance.
    Loading States

# Implemented using:
    react-spinners
    This ensures smooth UI feedback during async operations.
    Route-level Lazy Loading
    All major pages are loaded dynamically to optimize rendering.

### 🧰 Tech Stack
    Frontend
    React
    React Router
    Tailwind CSS
    Vite
    Authentication
    Clerk
    Backend
    Supabase
    Deployment
    Vercel

## 📂 Project Structure

src
│
├── components
│   ├── AppLayout
│   ├── ProtectedRoute
│   ├── UI Components
│
├── pages
│   ├── LandingPage
│   ├── JobListing
│   ├── Job
│   ├── SavedJobs
│   ├── MyJobs
│   ├── PostJob
│   └── OnBoarding
│
├── hooks
├── utils
└── main.jsx

## 🔐 Environment Variables
# Create .env file.
    VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_key

## 🛠 Installation
    Clone repository
    git clone https://github.com/yourusername/trackhire.git
    Navigate to project
    cd trackhire
    Install dependencies
    npm install
    Run development server
    npm run dev

## 🚀 Deployment
    Deployment is handled via Vercel.
    Steps:
        Push project to GitHub
        Import repository in Vercel
        Add environment variables
        Deploy

## 📸 Screenshots
# Add screenshots of:
    Landing page
    Job listing
    Job details
    Recruiter dashboard
    This helps recruiters visually understand the project quickly.

## 📈 Future Improvements
    Planned improvements include:
    Resume upload system
    Job application tracking
    Search and filters
    Real-time notifications
    Admin dashboard
    AI-based job recommendations

## 👨‍💻 Author
# Jaseem Quraishi

# Portfolio
    https://jaseem-codes.vercel.app

# LinkedIn
    https://www.linkedin.com/in/jaseem-quraishi/

# GitHub
    https://github.com/jaseem-quraishi
