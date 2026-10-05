// VoltWatch SMS relay (Node 18+, no packages needed)
// Run:  FAST2SMS_KEY=your_key node sms-server.js
// Then paste  http://YOUR-SERVER:3000  into the "SMS server URL" box on the page.
// Uses Fast2SMS as the example provider; swap the fetch() call for MSG91 or Twilio if you prefer.
// In India, check your provider's DLT / sender-ID rules before sending to real customers.

const http = require("http");
const KEY = process.env.FAST2SMS_KEY;
const ORIGIN = process.env.ALLOW_ORIGIN || "*"; // set to your page's address in production

http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  if (req.method !== "POST") { res.writeHead(404); return res.end(); }

  let body = "";
  for await (const chunk of req) body += chunk;

  try {
    const { to, message } = JSON.parse(body);
    const number = String(to).replace(/\D/g, "").slice(-10);
    if (number.length !== 10 || !message) throw new Error("Need a 10-digit number and a message");
    if (!KEY) throw new Error("FAST2SMS_KEY is not set on the server");

    const r = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: { authorization: KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ route: "q", message, language: "unicode", numbers: number })
    });
    res.writeHead(r.ok ? 200 : 502, { "Content-Type": "application/json" });
    res.end(await r.text());
  } catch (e) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: e.message }));
  }
}).listen(process.env.PORT || 3000, () => console.log("SMS relay running"));
