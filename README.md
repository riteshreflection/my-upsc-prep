# UPSC Prep Portal

A comprehensive UPSC Civil Services preparation platform with daily tests, flash cards, analytics, and personalized study plans.

## Features

- 📚 **Daily Tests** - Practice with curated questions
- 🗂️ **Flash Cards** - Interactive learning with AI-generated cards
- 📊 **Analytics Dashboard** - Track your progress and performance
- 🎯 **Personalized Study Plans** - Tailored to your exam schedule
- 🔥 **Streak Tracking** - Stay motivated with daily streaks
- 📱 **Responsive Design** - Works on all devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Firebase (Authentication & Database)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/my-upsc-prep.git
cd my-upsc-prep
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

For local development, create a `.env.local` file:

```env
# Firebase Configuration (already configured in firebase.ts)
# No additional environment variables needed for basic deployment
```

## Deployment

### Deploy to Vercel

1. **Push to GitHub**: 
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect it's a Next.js project

3. **Deploy**:
   - Vercel will automatically build and deploy your app
   - Your app will be available at `https://your-project-name.vercel.app`

### Manual Deployment

```bash
# Build the project
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── analytics/         # Analytics dashboard
│   ├── daily-test/        # Daily test functionality
│   ├── flash-cards/       # Flash card system
│   ├── login/            # Authentication
│   ├── signup/           # User registration
│   └── tasks/            # Task management
├── firebase.ts           # Firebase configuration
└── globals.css           # Global styles
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

---

Built with ❤️ for UPSC aspirants
