export const metadata = {
  title: "Astro Playlist",
  description: "Astrology App Frontend"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
