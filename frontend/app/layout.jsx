import "./globals.css";

export const metadata = {
  title: "Unicorn PC Builder",
  description: "AI-Powered PC Building Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
