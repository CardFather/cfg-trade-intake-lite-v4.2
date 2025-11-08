// pages/labels/[slug].tsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

type Trade = {
  id?: string;
  qr_slug?: string;
  queue_number?: number | string;
  customer_name?: string | null;
  customer_phone?: string | null;
  sortswift_order_no?: string | null;
  est_item_count?: number | null;
  created_at?: string | null;
  intake_id?: string | null;
};

export default function LabelPage(){
  const router = useRouter();
  const { slug } = router.query;
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const copies = Math.max(1, parseInt(String(router.query.copies || "1"), 10));
  const auto = String(router.query.auto || "0") === "1";

  useEffect(()=>{
    if(!slug) return;
    (async ()=>{
      try{
        const r = await fetch(`/api/tickets/${slug}`);
        const j = await r.json();
        const t = j?.trade || j?.ticket || j;
        setTrade(t);
      }finally{
        setLoading(false);
      }
    })();
  },[slug]);

  useEffect(()=>{
    if (!loading && auto) {
      setTimeout(()=>{
        try { window.print(); } catch {}
      }, 400);
    }
  },[loading, auto]);

  const targetUrl = useMemo(()=>{
    const s = (trade?.qr_slug || slug || "").toString();
    const base = siteUrl.replace(/\/$/, "");
    if (base) return `${base}/t/${s}`;
    return `/t/${s}`;
  },[trade, slug, siteUrl]);

  if (loading) return <div style={{padding:20, fontFamily:"ui-sans-serif"}}>Loading…</div>;
  if (!trade) return <div style={{padding:20, fontFamily:"ui-sans-serif"}}>Not found.</div>;

  const items = Array.from({length: copies}, (_,i)=> i);

  return (
    <div style={pageWrap}>
      <style jsx global>{`
        @page { size: 4in 6in; margin: 0; }
        @media print {
          html, body { background: #000; margin: 0; padding: 0; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        html, body { background: #000; }
      `}</style>
      {items.map((i)=> (
        <div key={i} style={outer}>
          <OneLabel trade={trade!} targetUrl={targetUrl} />
          {i < items.length - 1 ? <div style={pageBreak} /> : null}
        </div>
      ))}
    </div>
  );
}

function OneLabel({trade, targetUrl}:{trade: Trade, targetUrl:string}){
  const queue = (trade.queue_number ?? "").toString().padStart(3, "0");
  const name = trade.customer_name || trade.customer_phone || "Guest";
  const intakeId = trade.intake_id || `TI-${new Date(trade.created_at || Date.now()).toISOString().slice(0,10)}-${queue}`;
    const metaLeft = [
      `Intake: ${intakeId}`,
      trade.sortswift_order_no ? `SortSwift: ${trade.sortswift_order_no}` : null
    ].filter(Boolean).join(" • ");

  return (
    <div style={wrap}>
      <div style={grid}>
        <div style={left}>
          <div style={queueStyle}>#{queue}</div>
          <div style={nameStyle}>{name}</div>
          <div style={metaStyle}>{metaLeft}</div>
          {trade.created_at ? <div style={metaSmallStyle}>{new Date(trade.created_at).toLocaleString()}</div> : null}
        </div>
        <div style={right}>
          <img
            src={`https://chart.googleapis.com/chart?cht=qr&chs=900x900&chld=M|2&chl=${encodeURIComponent(targetUrl)}`}
            alt="QR"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      </div>
      <div style={footerStyle}>{targetUrl}</div>
    </div>
  );
}

// --- styles (thermal safe) ---
const pageWrap: React.CSSProperties = {
  width: "4in",
  background: "#fff",
};

const outer: React.CSSProperties = {
  width: "4in",
  height: "6in",
  background: "#fff",
};

const pageBreak: React.CSSProperties = {
  pageBreakAfter: "always",
  breakAfter: "page",
  height: 0
};

const wrap: React.CSSProperties = {
  width: "4in",
  height: "6in",
  boxSizing: "border-box",
  padding: "0.30in",
  background: "#fff",
  color: "#000",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1.2fr",
  gap: "0.18in",
  alignItems: "center",
};

const left: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.06in" };
const right: React.CSSProperties = { width: "2.3in", height: "2.3in" };

const queueStyle: React.CSSProperties = { fontSize: "1.7in", fontWeight: 900, lineHeight: 1, color: "#000" };
const nameStyle: React.CSSProperties = { fontSize: "0.55in", fontWeight: 800, marginTop: "0.02in", color: "#000" };
const metaStyle: React.CSSProperties = { fontSize: "0.30in", fontWeight: 700, color: "#000" };
const metaSmallStyle: React.CSSProperties = { fontSize: "0.24in", fontWeight: 700, color: "#000" };
const footerStyle: React.CSSProperties = { marginTop: "0.06in", fontSize: "0.23in", fontWeight: 700, color: "#000", wordBreak: "break-all" };
