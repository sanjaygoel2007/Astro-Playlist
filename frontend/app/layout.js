export const metadata = {
  title: "Astro Playlist - Personalized Astrological Video Playlists",
  description: "Get personalized YouTube playlists based on your astrological chart and life problems. Discover remedies through Mahadasha and Antardasha insights.",
  keywords: "astrology, horoscope, mahadasha, antardasha, remedies, YouTube playlist",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes",
  themeColor: "#FF6B35",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Astro Playlist"
  }
};

import Navigation from "../components/Navigation";
import "../app/globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Navigation />
        <div style={{ paddingTop: "80px" }} className="main-content-wrapper">
          {children}
        </div>
      </body>
    </html>
  );
}
