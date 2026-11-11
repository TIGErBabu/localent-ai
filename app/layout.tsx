import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Localent.ai — Local pros, protected payments", template: "%s · Localent.ai" },
  description: "Post a local job, get bids from verified pros, and pay safely through milestone escrow. Serving Gainesville, FL.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { themeColor: "#1E3A8A" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-slate-500 md:grid-cols-3">
            <div>
              <p className="font-extrabold text-trust">Localent<span className="text-action-dark">.ai</span></p>
              <p className="mt-2">Local pros, protected payments. Your money is held in milestone escrow and only released when the work is confirmed done.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Marketplace</p>
              <ul className="mt-2 space-y-1.5">
                <li><a className="hover:text-trust" href="/directory">Find a pro</a></li>
                <li><a className="hover:text-trust" href="/register/customer">Post a job</a></li>
                <li><a className="hover:text-trust" href="/register/pro">Join as a pro</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Trust &amp; safety</p>
              <p className="mt-2">Verified Pros pass a background check and licence review. Contact details stay masked until escrow is funded. Demo data on this site is fictional.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
