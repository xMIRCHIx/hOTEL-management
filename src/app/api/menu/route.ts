import { db, failure } from "@/lib/order-server";
import { settings, seatFor } from "@/lib/cafe-server";
import type { Dish } from "@/lib/cafe";
export async function GET(req: Request) {
  try {
    const [items, c] = await Promise.all([
      db<Dish[]>("cafe_menu?archived=eq.false&order=sort_order.asc,name.asc"),
      settings(),
    ]);
    const code = new URL(req.url).searchParams.get("code");
    let seat = null,
      seatError = "";
    if (code)
      try {
        const s = await seatFor(code);
        seat = { number: s.number, label: s.label, code: s.code };
      } catch (e) {
        seatError = (e as Error).message;
      }
    const {
      cafe_name,
      tagline,
      announcement,
      accent_color,
      ordering_open,
      wifi_required,
      discount_percent,
      reward_item_id,
    } = c;
    return Response.json({
      items,
      seat,
      seatError,
      settings: {
        cafe_name,
        tagline,
        announcement,
        accent_color,
        ordering_open,
        require_login: true,
        wifi_required,
        discount_percent,
        reward_item_id,
      },
    });
  } catch (e) {
    return failure(e);
  }
}
