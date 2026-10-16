import { randomUUID } from "node:crypto";
import { isIP } from "node:net";
import {
  ApiError,
  body,
  db,
  failure,
  orderFields,
  sameOrigin,
  staff,
} from "@/lib/order-server";
import { integer, settings, text, uuid } from "@/lib/cafe-server";
export async function GET() {
  try {
    await staff();
    const [items, seats, config, orders, customers] = await Promise.all([
      db("cafe_menu?order=sort_order.asc,name.asc"),
      db("cafe_seats?order=number.asc"),
      settings(),
      db(
        "cafe_orders?select=" +
          orderFields +
          "&order=created_at.desc&limit=500",
      ),
      db("cafe_customers?order=created_at.desc&limit=200"),
    ]);
    return Response.json({
      items,
      seats,
      settings: config,
      orders,
      customers,
      wifiSupported: process.env.VERCEL === "1",
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    await staff();
    const { entity, data } = await body(req);
    if (!data || typeof data !== "object")
      throw new ApiError("Invalid changes.");
    if (entity === "menu") {
      const id = data.id ? text(data.id, 80) : randomUUID();
      if (!/^[a-zA-Z0-9-]+$/.test(id)) throw new ApiError("Invalid item.");
      const name = text(data.name, 100),
        category = text(data.category, 50),
        image = text(data.image, 1000);
      if (
        !name ||
        !category ||
        !(
          (image.startsWith("/") && !image.startsWith("//")) ||
          /^https:\/\//.test(image)
        )
      )
        throw new ApiError("Add a name, category and valid image URL.");
      await db("cafe_menu?on_conflict=id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({
          id,
          name,
          category,
          image,
          description: text(data.description, 500),
          price: integer(data.price, 1, 100000),
          minutes: integer(data.minutes, 1, 180),
          badge: text(data.badge, 50),
          veg: data.veg === true,
          available: data.available === true,
          archived: data.archived === true,
          sort_order: integer(data.sort_order, 0, 9999),
        }),
      });
    } else if (entity === "seat") {
      if (data.id && !uuid.test(data.id)) throw new ApiError("Invalid seat.");
      const patch = {
        number: integer(data.number, 1, 100),
        label: text(data.label, 60),
        active: data.active === true,
        ...(data.regenerate ? { code: randomUUID() } : {}),
      };
      await db(data.id ? "cafe_seats?id=eq." + data.id : "cafe_seats", {
        method: data.id ? "PATCH" : "POST",
        body: JSON.stringify(patch),
      });
    } else if (entity === "settings") {
      const ips = text(data.wifi_public_ips, 1000)
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      if (ips.some((ip: string) => !isIP(ip)))
        throw new ApiError(
          "Enter valid public IP addresses separated by commas.",
        );
      if (data.wifi_required && (process.env.VERCEL !== "1" || !ips.length))
        throw new ApiError(
          "Wi-Fi enforcement needs supported hosting and the café public IP.",
        );
      if (!/^#[a-fA-F0-9]{6}$/.test(data.accent_color))
        throw new ApiError("Choose a valid accent colour.");
      if (data.reward_item_id && !/^[a-zA-Z0-9-]+$/.test(data.reward_item_id))
        throw new ApiError("Invalid reward item.");
      if (!["WPA", "WEP", "nopass"].includes(data.wifi_security))
        throw new ApiError("Invalid Wi-Fi security.");
      await db("cafe_settings?id=eq.1", {
        method: "PATCH",
        body: JSON.stringify({
          cafe_name: text(data.cafe_name, 60),
          tagline: text(data.tagline, 120),
          announcement: text(data.announcement, 240),
          accent_color: data.accent_color,
          ordering_open: data.ordering_open === true,
          require_login: true,
          wifi_required: data.wifi_required === true,
          wifi_ssid: text(data.wifi_ssid, 32),
          wifi_password: text(data.wifi_password, 63),
          wifi_security: data.wifi_security,
          wifi_public_ips: ips,
          discount_percent: integer(data.discount_percent, 0, 30),
          reward_item_id: data.reward_item_id || null,
        }),
      });
    } else if (entity === "customer") {
      if (!uuid.test(data.id) || !text(data.reason, 200))
        throw new ApiError("Select a customer and provide a reason.");
      const days = integer(data.days, 0, 30);
      await db("cafe_customers?id=eq." + data.id, {
        method: "PATCH",
        body: JSON.stringify({
          blocked_until: days
            ? new Date(Date.now() + days * 86400000).toISOString()
            : null,
        }),
      });
    } else throw new ApiError("Unknown change.");
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
