import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGuestOrder } from "@/app/actions";

/**
 * createGuestOrder touches the DB through prisma.product.findMany and a
 * interactive transaction. Both are fully mocked so unit tests run without a
 * database, and the data written *into* the transaction can be asserted.
 */
const mocks = vi.hoisted(() => {
  const tx = {
    order: {
      create: vi.fn(
        async (args: {
          data: {
            orderNumber: string;
            customerName: string;
            customerEmail: string;
            address: string;
            note: string | null;
            totalCents: number;
          };
        }) => ({ id: "order-1", ...args.data }),
      ),
    },
    orderItem: {
      createMany: vi.fn(
        async (args: {
          data: Array<{ orderId: string; productId: string; quantity: number; priceCents: number }>;
        }) => ({ count: args.data.length }),
      ),
    },
    product: {
      update: vi.fn(
        async (args: { where: { id: string }; data: { stock: { decrement: number } } }) => ({
          ...args,
        }),
      ),
    },
  };
  const $transaction = vi.fn(
    async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
  );
  return {
    tx,
    prisma: {
      product: { findMany: vi.fn() },
      $transaction,
    },
  };
});

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));

const dbProduct = (id: string, priceCents = 1000, stock = 10) => ({
  id,
  name: `Product ${id}`,
  priceCents,
  stock,
});

const goodInput = {
  customerName: "Mary Smith",
  customerEmail: "mary@example.com",
  address: "1 Test Lane",
  items: [{ id: "p1", qty: 1 }],
};

beforeEach(() => {
  vi.clearAllMocks();
  // restore the "run the transaction callback against tx" behavior
  mocks.prisma.$transaction.mockImplementation(
    async (fn: (t: typeof mocks.tx) => Promise<unknown>) => fn(mocks.tx),
  );
});

describe("createGuestOrder: input validation", () => {
  it("rejects when fields are missing", async () => {
    expect((await createGuestOrder({ ...goodInput, customerName: "  " })).error).toBe(
      "Name, email, and address are required.",
    );
    expect((await createGuestOrder({ ...goodInput, customerEmail: "" })).error).toBe(
      "Name, email, and address are required.",
    );
    expect((await createGuestOrder({ ...goodInput, address: "" })).error).toBe(
      "Name, email, and address are required.",
    );
    expect(mocks.prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("rejects a malformed email", async () => {
    expect((await createGuestOrder({ ...goodInput, customerEmail: "not-an-email" })).error).toBe(
      "Please enter a valid email address.",
    );
  });

  it("rejects an empty cart", async () => {
    expect((await createGuestOrder({ ...goodInput, items: [] })).error).toBe(
      "Your cart is empty.",
    );
  });

  it("rejects when all items are filtered out (bad qty)", async () => {
    expect(
      (
        await createGuestOrder({
          ...goodInput,
          items: [
            { id: "p1", qty: 0 },
            { id: "p1", qty: -2 },
            { id: "", qty: 3 },
          ],
        })
      ).error,
    ).toBe("Your cart is empty.");
  });
});

describe("createGuestOrder: authoritative data comes from the DB", () => {
  it("errors when a requested product no longer exists", async () => {
    mocks.prisma.product.findMany.mockResolvedValue([dbProduct("p1")]);

    const result = await createGuestOrder({
      ...goodInput,
      items: [
        { id: "p1", qty: 1 },
        { id: "deleted", qty: 1 },
      ],
    });
    expect(result.error).toContain("Some items are no longer available");
  });

  it("errors listing product names when stock became insufficient", async () => {
    mocks.prisma.product.findMany.mockResolvedValue([
      dbProduct("p1", 1000, /* stock */ 2),
      dbProduct("p2", 500, /* stock */ 50),
    ]);

    const result = await createGuestOrder({
      ...goodInput,
      items: [
        { id: "p1", qty: 3 },
        { id: "p2", qty: 1 },
      ],
    });
    expect(result.error).toContain("Product p1");
    expect(result.error).toContain("fewer items than requested");
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("recomputes the total and per-item prices from DB values", async () => {
    mocks.prisma.product.findMany.mockResolvedValue([
      dbProduct("p1", 1000), // $10.00
      dbProduct("p2", 250), // $2.50
    ]);

    const result = await createGuestOrder({
      ...goodInput,
      items: [
        { id: "p1", qty: 2 }, // 2 × $10.00
        { id: "p2", qty: 1 }, // 1 × $2.50
      ],
    });
    // 2000 + 250 cents
    expect(mocks.tx.order.create.mock.calls[0][0].data.totalCents).toBe(2250);

    const items = mocks.tx.orderItem.createMany.mock.calls[0][0].data;
    expect(items).toEqual([
      { orderId: "order-1", productId: "p1", quantity: 2, priceCents: 1000 },
      { orderId: "order-1", productId: "p2", quantity: 1, priceCents: 250 },
    ]);
    expect(result.orderNumber).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]+$/);
  });

  it("floors fractional quantities", async () => {
    mocks.prisma.product.findMany.mockResolvedValue([dbProduct("p1", 1000, 50)]);

    await createGuestOrder({ ...goodInput, items: [{ id: "p1", qty: 2.7 }] });

    const items = mocks.tx.orderItem.createMany.mock.calls[0][0].data;
    expect(items[0].quantity).toBe(2);
    const decs = mocks.tx.product.update.mock.calls.map((c) => c[0].data.stock.decrement);
    expect(decs).toEqual([2]);
  });

  it("decrements stock for every line in the transaction", async () => {
    mocks.prisma.product.findMany.mockResolvedValue([
      dbProduct("p1", 1000),
      dbProduct("p2", 250),
    ]);

    await createGuestOrder({
      ...goodInput,
      items: [
        { id: "p1", qty: 2 },
        { id: "p2", qty: 1 },
      ],
    });

    expect(mocks.tx.product.update).toHaveBeenCalledTimes(2);
  });

  it("passes customer/note data through with an empty note as null", async () => {
    mocks.prisma.product.findMany.mockResolvedValue([dbProduct("p1")]);

    await createGuestOrder({ ...goodInput, note: "   " });

    const data = mocks.tx.order.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      customerName: "Mary Smith",
      customerEmail: "mary@example.com",
      address: "1 Test Lane",
      note: null,
    });
  });
});

describe("createGuestOrder: order number collisions", () => {
  it("retries with a fresh order number after a P2002 unique violation", async () => {
    mocks.prisma.product.findMany.mockResolvedValue([dbProduct("p1")]);
    mocks.prisma.$transaction
      .mockRejectedValueOnce({ code: "P2002" })
      .mockRejectedValueOnce({ code: "P2002" });

    const result = await createGuestOrder(goodInput);

    expect(result.orderNumber).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]+$/);
    // two failed attempt cycles + the successful one; the callback (and so
    // tx.order.create) only ever ran inside the successful transaction
    expect(mocks.prisma.$transaction).toHaveBeenCalledTimes(3);
    expect(mocks.tx.order.create).toHaveBeenCalledTimes(1);
  });

  it("gives up with a friendly error after 5 failed attempts", async () => {
    mocks.prisma.product.findMany.mockResolvedValue([dbProduct("p1")]);
    mocks.prisma.$transaction.mockRejectedValue({ code: "P2002" });

    const result = await createGuestOrder(goodInput);

    expect(result.error).toBe("Could not place the order. Please try again.");
    expect(mocks.prisma.$transaction).toHaveBeenCalledTimes(5);
    expect(mocks.tx.order.create).not.toHaveBeenCalled();
  });

  it("propagates non-P2002 errors", async () => {
    mocks.prisma.product.findMany.mockResolvedValue([dbProduct("p1")]);
    mocks.prisma.$transaction.mockRejectedValue(new Error("boom"));

    await expect(createGuestOrder(goodInput)).rejects.toThrow("boom");
  });
});
