// pages/api/qr.js
const QRCode = require("qrcode");

export default async function handler(req, res) {
  const data = req.query.data || "";
  if (!data) return res.status(400).send("Missing data");

  try {
    const png = await QRCode.toBuffer(data, {
      type: "png",
      width: 600,              // 4x6 label friendly
      margin: 2,
      errorCorrectionLevel: "M",
    });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(png);

  } catch (e) {
    return res.status(500).send(e?.message || "QR error");
  }
}
