import { CartView } from "./cart-view";

export const metadata = { title: "Cart" };

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10">
      <h1 className="mb-10 font-heading text-5xl font-bold uppercase leading-none sm:text-6xl">
        Your cart
      </h1>
      <CartView />
    </div>
  );
}
