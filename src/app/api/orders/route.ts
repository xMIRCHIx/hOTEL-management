import {
  ApiError,
  body,
  db,
  failure,
  guest,
  orderFields,
  sameOrigin,
} from "@/lib/order-server";
import {
  currentUser,
  seatFor,
  customer,
  settings,
  checkWifi,
  uuid,
  text,
} from "@/lib/cafe-server";
import type { CafeOrder } from "@/lib/cafe";
export async function GET() {
  try {
    const user = await currentUser(),
      owner = await guest();
    if (!user && !owner) return Response.json({ orders: [] });
    const filter = user
      ? "customer_id=eq." + user.id
      : "guest_hash=eq." + owner + "&customer_id=is.null";
    return Response.json({
      orders: await db<CafeOrder[]>(
        "cafe_orders?" +
          filter +
          "&select=" +
          orderFields +
          "&order=created_at.desc&limit=30",
      ),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const input = await body(req);
    if (!uuid.test(input.code)) throw new ApiError("Scan the QR on your seat to start an order.");
    const config = await settings();
    checkWifi(req, config);
    const user = await currentUser(true);
    await seatFor(input.code);
    if (user) await customer(user);
    const name = text(input.name, 60),
      notes = text(input.notes, 400);
    if (!name || !uuid.test(input.requestId) || !uuid.test(input.code))
      throw new ApiError("Check your name and scan your seat QR.");
    if (
      !Array.isArray(input.items) ||
      input.items.length < 1 ||
      input.items.length > 30 ||
      input.items.some(
        (i: { id: unknown; quantity: number }) =>
          !i ||
          typeof i.id !== "string" ||
          !Number.isInteger(i.quantity) ||
          i.quantity < 1 ||
          i.quantity > 10,
      )
    )
      throw new ApiError("Please check your cart.");
    const owner = await guest(true);
    const id = await db<string>("rpc/submit_cafe_order", {
      method: "POST",
      body: JSON.stringify({
        p_guest: owner,
        p_customer: user?.id || null,
        p_request: input.requestId,
        p_code: input.code,
        p_name: name,
        p_notes: notes,
        p_items: input.items,
        p_reward: input.useReward === true,
      }),
    });
    const [order] = await db<CafeOrder[]>(
      "cafe_orders?id=eq." + id + "&select=" + orderFields,
    );
    return Response.json({ order }, { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
