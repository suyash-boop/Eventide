# 🎉 Eventide

**Eventide** is a modern, feature-rich event management platform built with Next.js 15, TypeScript, and PostgreSQL. It enables users to create, discover, and manage events with features like registration workflows, organizer approval systems, email-based check-ins, AI-powered content generation, and comprehensive event analytics.

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=flat&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Routes](#-api-routes)
- [Database Schema](#-database-schema)
- [AI Features](#-ai-features)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Features
- **Event Creation & Management**: Create events with detailed information, custom questions, and flexible settings
- **Event Discovery**: Browse and search events with advanced filtering (category, type, price, location)
- **User Authentication**: Secure authentication using NextAuth.js with Google OAuth
- **Registration System**: Complete registration workflow with custom questions and organizer approval
- **Event Types**: Support for In-Person, Online, and Hybrid events
- **Pricing Options**: Free and paid events with revenue tracking

### 🎫 Registration & Check-In
- **Custom Registration Forms**: Add custom questions for attendees
- **Approval Workflow**: Organizers can approve/reject/waitlist registrations
- **QR Code Generation**: Unique QR codes for each registered attendee
- **Email-Based Check-In**: Hosts can check in attendees using their email
- **Registration Status Tracking**: Real-time status updates for attendees

### 🤖 AI-Powered Features
- **Event Description Enhancement**: Use gemini AI to improve event descriptions
- **Auto-Fill Event Details**: Describe your event in natural language (min 30 words) and AI fills the form
- **LinkedIn Post Generation**: AI-generated LinkedIn posts for attendees after events end
- **Smart Content**: Powered by gemini's Llama 3.3 70B model

### 📅 Integrations
- **Google Calendar**: Add events directly to Google Calendar after registration
- **Real-Time Updates**: Live event updates and registration status
- **Email Notifications**: Automated email notifications for registrations and status changes

### 📊 Analytics & Management
- **Event Dashboard**: Comprehensive dashboard for event organizers
- **Attendee Management**: View and manage all registrations
- **Revenue Tracking**: Track ticket sales and revenue per event
- **Event Statistics**: Total events, attendees, and engagement metrics

### 🎨 User Experience
- **Modern Dark UI**: Sleek dark theme with smooth animations
- **Responsive Design**: Fully responsive across all devices
- **Real-Time Search**: Instant search and filtering
- **Interactive Components**: Built with shadcn/ui and Radix UI

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **QR Codes**: [qrcode.react](https://github.com/zpao/qrcode.react)
- **QR Scanner**: [react-qr-reader](https://github.com/JodusNodus/react-qr-reader)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **API Routes**: Next.js API Routes
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Neon)

### AI & ML
- **AI Provider**: [gemini](https://gemini.com/)
- **Model**: Llama 3.3 70B Versatile
- **SDK**: [gemini-sdk](https://www.npmjs.com/package/gemini-sdk)

### Development Tools
- **Package Manager**: pnpm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Git Hooks**: Husky (optional)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- pnpm (or npm/yarn)
- PostgreSQL database (Neon recommended)
- Google OAuth credentials
- gemini API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/eventide.git
cd eventide
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```
Then fill in your environment variables (see [Environment Variables](#-environment-variables))

4. **Set up the database**
```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed the database
npx prisma db seed
```

5. **Run the development server**
```bash
pnpm dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# gemini AI
gemini_API_KEY="your-gemini-api-key"

# Optional: For production
NODE_ENV="development"
```

### Getting API Keys

- **Database URL**: Sign up at [Neon](https://neon.tech/) or use any PostgreSQL provider
- **Google OAuth**: Create credentials at [Google Cloud Console](https://console.cloud.google.com/)
- **gemini API**: Get your API key at [gemini Console](https://console.gemini.com/)
- **NextAuth Secret**: Generate with `openssl rand -base64 32`

---

## 📁 Project Structure

```
eventide/
├── app/                      # Next.js App Router
│   ├── api/                 # API Routes
│   │   ├── auth/           # NextAuth routes
│   │   ├── events/         # Event management
│   │   ├── checkin/        # Check-in system
│   │   ├── enhancedescription/  # AI description
│   │   ├── event-ai-fill/  # AI form fill
│   │   └── generate-linkedin-post/  # AI post generation
│   ├── dashboard/          # User dashboard
│   ├── discover/           # Event discovery
│   ├── events/             # Event pages
│   │   ├── create/        # Create event
│   │   └── [id]/          # Event details
│   │       └── manage/    # Event management
│   ├── my-events/         # User's events
│   ├── profile/           # User profile
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Auth components
│   ├── layout/           # Layout components
│   └── providers/        # Context providers
├── lib/                  # Utility functions
│   ├── api.ts           # API client
│   ├── auth.ts          # Auth config
│   ├── prisma.ts        # Prisma client
│   └── utils.ts         # Helper functions
├── prisma/              # Database
│   └── schema.prisma    # Prisma schema
├── public/              # Static assets
└── hooks/               # Custom React hooks
```

---

## 🌐 API Routes

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth.js authentication

### Events
- `GET /api/events` - Get all public events
- `POST /api/events` - Create new event
- `GET /api/events/[id]` - Get event by ID
- `PUT /api/events/[id]` - Update event
- `DELETE /api/events/[id]` - Delete event

### Registration
- `POST /api/events/[id]/register` - Register for event
- `GET /api/events/[id]/register` - Check registration status
- `GET /api/events/[id]/my-registration` - Get user's registration

### Event Management
- `GET /api/events/[id]/manage` - Get event management data
- `PUT /api/events/[id]/questions` - Update event questions
- `GET /api/events/[id]/registrations` - Get all registrations
- `PATCH /api/events/[id]/registrations/[registrationId]` - Update registration status

### Check-In
- `POST /api/checkin` - Check in by QR code
- `POST /api/checkin-by-email` - Check in by email

### AI Features
- `POST /api/enhancedescription` - Enhance event description
- `POST /api/event-ai-fill` - Auto-fill event form
- `POST /api/generate-linkedin-post` - Generate LinkedIn post

### User
- `GET /api/user/events` - Get user's created events
- `GET /api/user/events/registrations` - Get user's registrations
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

---

## 🗄 Database Schema

### Core Models

- **User**: User accounts with authentication
- **Event**: Event information and settings
- **Registration**: Event registrations with status
- **Question**: Custom registration questions
- **RegistrationAnswer**: Answers to custom questions

### Key Relationships

- User → Events (one-to-many, as organizer)
- User → Registrations (one-to-many)
- Event → Registrations (one-to-many)
- Event → Questions (one-to-many)
- Registration → RegistrationAnswers (one-to-many)

See [`prisma/schema.prisma`](prisma/schema.prisma) for the complete schema.

---

## 🤖 AI Features

### 1. Event Description Enhancement
- **Model**: gemini Llama 3.3 70B
- **Purpose**: Improve event descriptions to be more engaging
- **Usage**: Click "Enhance" button in event creation form

### 2. AI Form Auto-Fill
- **Model**: gemini Llama 3.3 70B
- **Purpose**: Fill entire event form from natural language description
- **Usage**: Write 30+ words describing your event, click "Fill with AI"

### 3. LinkedIn Post Generation
- **Model**: gemini Llama 3.3 70B
- **Purpose**: Generate professional LinkedIn posts for attendees
- **Usage**: Available after event ends for checked-in attendees

---

## 🎨 UI Components

Built with [shadcn/ui](https://ui.shadcn.com/), including:

- **Forms**: Input, Textarea, Select, Checkbox, Radio Group
- **Navigation**: Tabs, Dropdown Menu
- **Feedback**: Badge, Button, Card, Dialog, Sonner (Toast)
- **Layout**: Separator, Avatar
- **Custom**: QR Code display, Event cards, Registration forms

---

## 🧪 Development

### Available Scripts

```bash
# Development
pnpm dev          # Start dev server

# Building
pnpm build        # Build for production
pnpm start        # Start production server

# Database
npx prisma studio        # Open Prisma Studio
npx prisma db push       # Push schema changes
npx prisma migrate dev   # Create migration
npx prisma generate      # Generate Prisma Client

# Linting
pnpm lint         # Run ESLint
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Suyash**

- GitHub: [@yourusername](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Vercel](https://vercel.com/) - Deployment platform
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [gemini](https://gemini.com/) - AI inference
- [Neon](https://neon.tech/) - Serverless PostgreSQL

---

## 📞 Support

If you have any questions or need help, please:

- Open an issue on [GitHub](https://github.com/yourusername/eventide/issues)
- Contact: your-email@example.com

---

**Made with ❤️ using Next.js and TypeScript**