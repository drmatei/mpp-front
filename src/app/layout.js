// layout.js

import './globals.css';

export const metadata = {
  title: 'Eventful Library',
  description: 'A collection of amazing events',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


