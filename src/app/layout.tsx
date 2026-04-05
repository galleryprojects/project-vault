import './globals.css';

export const metadata = {
  title: 'Fine Media',
  description: 'Premium Digital Access',
}

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