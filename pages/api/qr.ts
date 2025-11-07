import type { NextApiRequest, NextApiResponse } from "next";
import QRCode from "qrcode";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const data = (req.query.data as string) || "";
  if (!data) return res.status(400).send("Missing data");
  try {
    const png = await QRCode.toBuffer(data, { type: "png", width: 600, margin: 2, errorCorrectionLevel: "M" });
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(png);
  } catch (e: any) {
    return res.status(500).send(e?.message || "QR error");
  }
}
