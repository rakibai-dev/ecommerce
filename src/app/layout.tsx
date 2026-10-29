import type { Metadata } from "next";
import Link from "next/link";
import {
  fontDisplay,
  fontMono,
  fontSans,
  fontSticker,
} from "@/lib/fonts";
import "./globals.css";
import { CartProvider, CartBadge } from "@/lib/cart-provider";
import { AuthBar } from "@/components/auth-bar";
import { STORE_NAME, SUPPORT_EMAIL } from "@/lib/format";

export const metadata: Metadata = {
  title: {
    default: STORE_NAME,
    template: `%s · ${STORE_NAME}`,
  },
  description: "A small, honest store for desk, kitchen, and everyday-carry goods.",
};

/** Quiet text link used in the footer directory. */
function FooterLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="w-fit rounded-sm underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      {children}
    </Link>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontSticker.variable} ${fontMono.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-background font-sans antialiased">
        <CartProvider>
          <header className="border-b bg-card">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-1 px-4">
              <Link
                href="/"
                className="mr-2 font-heading text-[26px] font-bold uppercase leading-none tracking-[0.02em] opacity-100 transition-opacity hover:opacity-75 sm:text-3xl"
              >
                {STORE_NAME}
              </Link>
              <div className="ml-auto flex items-center gap-1">
                <Link
                  href="/shop"
                  className="rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  Shop
                </Link>
                <AuthBar />
                <CartBadge />
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t py-10">
            <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 text-sm text-muted-foreground sm:grid-cols-[1.2fr_0.8fr_1fr] sm:gap-6">
              {/* Identity + demo honesty */}
              <div className="flex flex-col gap-2.5">
                <p className="font-heading text-2xl font-bold uppercase leading-none tracking-[0.02em] text-foreground">
                  {STORE_NAME}
                </p>
                <p>
                  A small, honest store for desk, kitchen, and everyday-carry
                  goods.
                </p>
                <p>
                  Demo store: payments are mocked, so placing an order never
                  charges anything.
                </p>
              </div>

              {/* Store directory */}
              <nav aria-label="Footer" className="flex flex-col gap-2">
                <p className="text-sm font-medium text-foreground">Store</p>
                <FooterLink href="/shop">Shop</FooterLink>
                <FooterLink href="/cart">Cart</FooterLink>
                <FooterLink href="/login">Sign in</FooterLink>
                <FooterLink href="/register">Create account</FooterLink>
                <FooterLink href="/admin">Store admin</FooterLink>
              </nav>

              {/* The fine print */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-foreground">
                  The fine print
                </p>
                <p>
                  Orders reserve the item: stock counts come down when an order
                  is placed.
                </p>
                <p>Accounts are optional. The cart works signed out.</p>
                <p>
                  Questions about an order? Email{" "}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                  .
                </p>
                <p>Prices in USD.</p>
              </div>
            </div>

            <div className="mx-auto mt-8 flex w-full max-w-6xl flex-col gap-1 px-4 text-xs text-muted-foreground/80 sm:flex-row sm:justify-between">
              <p>© 2026 {STORE_NAME}. Nothing here is charged or shipped.</p>
              <p>Open around the clock — it is a website.</p>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
