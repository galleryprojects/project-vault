import { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "SY Exclusives | The Vault",
  description: "Exclusive digital collections and private media vaults.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* Removed the Cloud Bypass so the local Pink Theme works */}
      <body className="antialiased m-0 p-0 overflow-x-hidden">{children}</body>
    </html>
  )
}