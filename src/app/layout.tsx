import './globals.css';

export const metadata = {
  title: 'Project Vault',
  description: 'Secure Digital Repository',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* THE NUCLEAR BYPASS: Pulls the styling engine directly from the cloud */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="antialiased m-0 p-0 overflow-x-hidden">{children}</body>
    </html>
  )
}