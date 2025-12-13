# Astro-Playlist

A personalized astrology application that generates YouTube playlists based on user's astrological chart (Mahadasha, Antardasha) and selected life problems.

## Frontend Features

### 🎨 Beautiful Astrology Theme
- Modern, appealing UI with purple and gold color scheme
- Gradient backgrounds and smooth animations
- Responsive design for all devices
- Dark mode support (ready for implementation)

### 📱 User Flow

1. **Language Selection Screen**
   - Choose between Hindi and English
   - All subsequent screens display in selected language

2. **Mobile Authentication**
   - Fixed country code: +91 (India)
   - 10-digit mobile number input
   - OTP-based authentication
   - 6-digit OTP input with auto-focus

3. **User Details Form**
   - Name (required)
   - Date of Birth (required)
   - Time of Birth (optional)
   - Place of Birth (required)
   - Type of Problems (multi-select from 50 categorized problems)

4. **Results Display**
   - Mahadasha information
   - Antardasha information
   - End date of Antardasha
   - YouTube playlist link
   - Selected problems summary

### 📊 50 Problems Categorized

- **Marriage & Relationship Problems** (10 problems)
- **Career & Job Problems** (10 problems)
- **Business & Financial Problems** (10 problems)
- **Health Problems** (8 problems)
- **Children & Family Problems** (7 problems)
- **Spiritual, Negative Energy & Destiny Issues** (5 problems)

### 🔧 Admin Panel (`/admin`)

- Manage star/problem video mappings
- Add/update video URLs for specific star and problem combinations
- View all existing mappings in a table
- Key format: `{Star}_{S.No}`

### 📋 Submissions Page (`/submissions`)

- Search submissions by mobile number
- View all user data in a comprehensive table:
  - S.No, Mobile Number, Name
  - Date of Birth, Time of Birth, Place of Birth
  - Selected Problems
  - Mahadasha, Antardasha, End Date

### 🎯 Key Features

- **Playlist Naming**: Format is `{Mobile Number} - {Name}` to allow multiple playlists per mobile number
- **Multi-language Support**: Full Hindi and English translations
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback during API calls

## Tech Stack

- **Next.js 13** (App Router)
- **React 18**
- **CSS3** with custom properties for theming
- **Google Fonts** (Poppins & Playfair Display)

## Installation

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## API Endpoints Expected

The frontend expects the following backend endpoints:

- `POST /api/auth/send-otp` - Send OTP to mobile number
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/submit` - Submit user details and get results
- `GET /api/submissions/:mobileNumber` - Get user submissions
- `GET /api/admin/star-problems` - Get all star/problem mappings
- `POST /api/admin/star-problems` - Save star/problem mapping

## Project Structure

```
frontend/
├── app/
│   ├── admin/
│   │   └── page.jsx          # Admin panel
│   ├── submissions/
│   │   └── page.jsx          # Submissions table
│   ├── globals.css           # Global styles and theme
│   ├── layout.js             # Root layout
│   └── page.jsx              # Main user flow
├── components/
│   ├── LanguageSelection.jsx # Language selection screen
│   ├── MobileAuth.jsx        # OTP authentication
│   ├── UserDetailsForm.jsx   # User details form
│   ├── ResultsDisplay.jsx    # Results display
│   └── Navigation.jsx        # Navigation bar
└── lib/
    ├── api.js                # API functions
    └── problems.js           # Problems data and translations
```

## Notes

- The frontend is configured for static export (`next.config.js`)
- All API calls are made to an external backend server
- The playlist name format allows multiple playlists per mobile number for family members
- All 50 problems are categorized and can be selected via checkboxes
