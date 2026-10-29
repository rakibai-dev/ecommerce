"use client";

import { useRef } from "react";
import { updateOrderStatus } from "./order-actions";

/**
 * Native <select> (not the radix-based shadcn Select) because radix Select is
 * div-based and doesn't participate in native form submission; requestSubmit
 * after onChange reads the committed value directly from the DOM.
 */
export function OrderStatusSelect({
  orderId,
  current,
}: {
  orderId: string;
  current: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={updateOrderStatus}>
      <input type="hidden" name="id" value={orderId} />
      <select
        name="status"
        defaultValue={current}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-md border bg-transparent px-2 py-1 text-xs capitalize"
      >
        <option value="PENDING">Pending</option>
        <option value="SHIPPED">Shipped</option>
        <option value="DELIVERED">Delivered</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      <noscript>
        <button type="submit" className="ml-2 text-xs underline">
          Save status
        </button>
      </noscript>
    </form>
  );
}
