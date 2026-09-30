import type { Metadata, Viewport } from "next";
import { Lora, Nunito_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const lora = Lora({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-lora" });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "Is your pet having more good days than bad? | CodaPet",
  description:
    "A free 2-minute quiz designed with CodaPet veterinarians. Learn what vets look for as pets age or get sick.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf8f5",
};

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lora.variable} ${nunito.variable}`}>
      <body>
        {/* Full viewport on mobile, a centered 440px column on desktop. */}
        <div className="mx-auto min-h-dvh max-w-[440px] bg-page sm:shadow-[0_0_40px_rgba(31,47,69,.08)]">
          {children}
        </div>
        {PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
          </Script>
        )}
      </body>
    </html>
  );
}
