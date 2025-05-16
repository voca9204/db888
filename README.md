# DB888: Database Management & Visualization Tool

DB888 is a powerful, user-friendly database management and visualization tool built with modern web technologies. It provides a intuitive interface for managing MariaDB connections, exploring database schemas, building queries visually, and visualizing data.

## Features

- **Database Connection Management:** Securely store and manage MariaDB connection profiles
- **Schema Visualization:** Browse database tables and view their structure
- **Entity-Relationship Diagram (ERD):** Visual representation of database relationships
- **Visual Query Builder:** Build complex queries with an intuitive drag-and-drop interface
- **Query Templates:** Save, parameterize, and share queries with team members
- **Data Visualization:** Create charts and graphs from query results using Recharts
- **Data Export:** Export data in various formats (CSV, Excel, JSON)
- **Query Scheduling:** Schedule recurring queries and receive notifications
- **User Activity Logging:** Track user activities for auditing purposes

## Technology Stack

- **Frontend:** React, TypeScript, Vite
- **UI Framework:** Tailwind CSS, Headless UI
- **State Management:** Zustand, React Query
- **Backend:** Firebase (Authentication, Firestore, Cloud Functions, Hosting)
- **Database Connectivity:** Firebase Cloud Functions for secure database operations
- **Tables & Data Grid:** TanStack Table
- **Visualizations:** Recharts

## Project Status

This project is currently in active development. All major features have been implemented, with only real database connections via Firebase Cloud Functions remaining.

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase account and Firebase CLI
- MariaDB database for testing

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure Firebase:
   - Create a Firebase project
   - Enable Authentication, Firestore, and Cloud Functions
   - Update Firebase configuration in `.env` file
4. Start the development server: `npm run dev`

## License

This project is licensed under the MIT License - see the LICENSE file for details.
