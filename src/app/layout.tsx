import { Metadata } from 'next';
import './globals.css';
import DepositInterceptor from '@/components/DepositInterceptor';

export const metadata: Metadata = {
  title: "SY Exclusives | The Vault",
  description: "Exclusive digital collections and private media vaults.",
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* This runs in the background globally */}
        <DepositInterceptor /> 
        
        {children}
      </body>
    </html>
  );
}