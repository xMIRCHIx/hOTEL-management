import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
const base = process.env.TEST_URL || "http://localhost:3000";
const request = (path, method = "GET", data, cookie = "") =>
  fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
test("private workspace requires staff session", async () => {
  assert.equal((await request("/api/admin")).status, 401);
  assert.equal(
    (
      await request("/api/kitchen", "PATCH", {
        id: randomUUID(),
        action: "served",
      })
    ).status,
    401,
  );
});
test("anonymous customer has no history and cannot order", async () => {
  assert.deepEqual(await (await request("/api/orders")).json(), { orders: [] });
  assert.equal(
    (
      await request("/api/orders", "POST", {
        name: "Test",
        notes: "",
        code: randomUUID(),
        requestId: randomUUID(),
        items: [{ id: "p1", quantity: 1 }],
      })
    ).status,
    401,
  );
});
test("public menu hides credentials and refuses guessed seat", async () => {
  const d = await (await request("/api/menu?seat=10")).json();
  assert.ok(d.items.length);
  assert.equal(d.seat, null);
  assert.equal(d.settings.wifi_password, undefined);
  assert.equal(d.settings.wifi_public_ips, undefined);
  const invalid = await (
    await request("/api/menu?code=" + randomUUID())
  ).json();
  assert.equal(invalid.seat, null);
  assert.ok(invalid.seatError);
});
test("orders reject a missing QR even when a seat number is supplied", async () => {
  const response = await request("/api/orders", "POST", {
    seat: 10, name: "Test", notes: "", requestId: randomUUID(),
    items: [{ id: "p1", quantity: 1 }],
  });
  assert.equal(response.status, 400);
  assert.match(JSON.stringify(await response.json()), /scan.*QR/i);
});
test("foreign-origin and malformed requests are rejected", async () => {
  assert.equal(
    (
      await fetch(base + "/api/orders", {
        method: "POST",
        headers: { Origin: "https://untrusted.example" },
        body: "{}",
      })
    ).status,
    403,
  );
  assert.equal(
    (await fetch(base + "/api/orders", { method: "POST", body: "null" }))
      .status,
    400,
  );
});
test(
  "database: QR seat, server price, idempotency, confirmation, paid visits and rewards",
  { skip: process.env.RUN_DATABASE_TESTS !== "1" },
  async () => {
    const env = Object.fromEntries(
      readFileSync(new URL("../.env.local", import.meta.url), "utf8")
        .split(/\r?\n/)
        .filter((l) => l.includes("="))
        .map((l) => {
          const i = l.indexOf("=");
          return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, "")];
        }),
    );
    const remote = async (path, method = "GET", data) => {
      const r = await fetch(env.SUPABASE_URL + path, {
        method,
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        ...(data ? { body: JSON.stringify(data) } : {}),
      });
      const raw = await r.text();
      assert.ok(
        r.ok,
        "Remote fixture operation failed: " +
          r.status +
          " " +
          raw.slice(0, 150),
      );
      return raw ? JSON.parse(raw) : null;
    };
    const id = randomUUID(),
      email = "noiric-test-" + id + "@example.com",
      password = randomUUID() + "aA!";
    let user, order;
    try {
      user = await remote("/auth/v1/admin/users", "POST", {
        email,
        password,
        email_confirm: true,
      });
      const token = await remote("/auth/v1/token?grant_type=password", "POST", {
        email,
        password,
      });
      const cookie = "noiric_access=" + token.access_token;
      const auth = await request("/api/auth", "GET", undefined, cookie);
      assert.equal(auth.status, 200);
      const [seat] = await remote("/rest/v1/cafe_seats?number=eq.10");
      const [dish] = await remote("/rest/v1/cafe_menu?id=eq.p1");
      const draft = {
        code: seat.code,
        seat: 99,
        name: "AUTOMATED TEST — do not prepare",
        notes: "Disposable integration test",
        requestId: randomUUID(),
        items: [{ id: dish.id, quantity: 2, price: 1 }],
        total: 1,
      };
      const first = await request("/api/orders", "POST", draft, cookie);
      assert.equal(first.status, 201, await first.clone().text());
      order = (await first.json()).order;
      assert.equal(order.seat, 10);
      assert.equal(order.total, dish.price * 2);
      const again = await request("/api/orders", "POST", draft, cookie);
      assert.equal((await again.json()).order.id, order.id);
      assert.deepEqual(
        (await (await request("/api/orders")).json()).orders,
        [],
      );
      assert.equal(
        (
          await request(
            "/api/orders",
            "POST",
            { ...draft, requestId: randomUUID(), code: randomUUID() },
            cookie,
          )
        ).status,
        400,
      );
      const login = await request("/api/kitchen", "POST", {
        password: env.KITCHEN_PASSWORD,
      });
      assert.equal(login.status, 200);
      const staff = login.headers.get("set-cookie").split(";")[0];
      const advance = (action, verified = false) =>
        request(
          "/api/kitchen",
          "PATCH",
          { id: order.id, action, verified },
          staff,
        );
      assert.equal((await advance("preparing")).status, 400);
      assert.equal((await advance("served")).status, 400);
      // Seed four past paid-visit fixtures for this disposable account, then earn the fifth through the actual API.
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
      }).format(new Date());
      for (let n = 1; n <= 4; n++) {
        const day = new Date(today + "T00:00:00Z");
        day.setUTCDate(day.getUTCDate() - n);
        await remote("/rest/v1/cafe_visits", "POST", {
          customer_id: user.id,
          visit_day: day.toISOString().slice(0, 10),
          order_id: order.id,
        });
      }
      assert.equal((await advance("preparing", true)).status, 200);
      assert.equal((await advance("ready")).status, 200);
      assert.equal((await advance("served")).status, 200);
      let visits = await remote(
        "/rest/v1/cafe_visits?customer_id=eq." + user.id,
      );
      assert.equal(visits.length, 4);
      assert.equal((await advance("paid")).status, 200);
      visits = await remote("/rest/v1/cafe_visits?customer_id=eq." + user.id);
      assert.equal(visits.length, 5);
      const rewards = await remote(
        "/rest/v1/cafe_rewards?customer_id=eq." + user.id,
      );
      assert.equal(rewards.length, 1);
      assert.equal(rewards[0].state, "available");
      assert.equal((await advance("paid")).status, 400);
      const anon = await fetch(
        env.SUPABASE_URL + "/rest/v1/cafe_orders?select=id",
        {
          headers: {
            apikey: env.SUPABASE_ANON_KEY,
            Authorization: "Bearer " + env.SUPABASE_ANON_KEY,
          },
        },
      );
      assert.ok([401, 403].includes(anon.status));
    } finally {
      if (user) {
        await remote(
          "/rest/v1/cafe_visits?customer_id=eq." + user.id,
          "DELETE",
        );
        await remote(
          "/rest/v1/cafe_rewards?customer_id=eq." + user.id,
          "DELETE",
        );
        await remote(
          "/rest/v1/cafe_orders?customer_id=eq." + user.id,
          "DELETE",
        );
        await remote("/rest/v1/cafe_customers?id=eq." + user.id, "DELETE");
        await remote("/auth/v1/admin/users/" + user.id, "DELETE");
      }
    }
  },
);
