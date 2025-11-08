import { useRouter } from "next/router";
import useSWR from "swr";
import { useEffect, useMemo } from "react";

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function LabelPage() {
  const r = useRouter();
  const slug = r.query.slug as string;
  const auto = r.query.auto === "1";
  const copies = Math.max(1, parseInt((r.query.copies as string) || "1", 10));
  const { data } = useSWR(slug ? `/api/tickets/${slug}` : null, fetcher);
  const trade = data?.trade;

  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  const targetUrl = useMemo(() => {
    if (!slug || !site) return "";
    return `${site.replace(/\/+$/,"")}/t/${slug}`;
  }, [slug, site]);

  useEffect(() => {
    if (auto && trade) {
      const t = setTimeout(() => window.print(), 350);
      return () => clearTimeout(t);
    }
  }, [auto, trade]);

  if (!trade) return <div style={{color:"#000"}}>Loading…</div>;

  return (
    <div>
      <style jsx global>{`
  @page { size: 4in 6in; margin: 0; }
  @media print {
    html, body { margin: 0; padding: 0; background: #fff; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  html, body { background: #fff; } /* keep screen preview white too */
`}</style>
      {Array.from({ length: copies }).map((_, i) => (
        <div className="page" key={i}>
          <OneLabel trade={trade} targetUrl={targetUrl} />
        </div>
      ))}
    </div>
  );
}

function OneLabel({ trade, targetUrl }: { trade: any; targetUrl: string }) {
  const big = (n:number)=>String(n).padStart(3,"0");
  const now = new Date();
  const lines = [
    trade.customer_name || trade.customer_phone || trade.customer_email || "Guest",
    `Intake: ${trade.intake_id}`,
    trade.sortswift_order_no ? `SortSwift: ${trade.sortswift_order_no}` : null,
  ].filter(Boolean) as string[];

  return (
    <div style={wrap}>
      <div style={grid}>
        <div style={left}>
          <div style={queue}>#{big(trade.queue_number)}</div>
          <div style={name}>{lines[0]}</div>
          <div style={meta}>{lines.slice(1).join("  •  ")}</div>
          <div style={metaSmall}>
            {now.toLocaleDateString()} {now.toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"})}
          </div>
        </div>
        <div style={right}>
          {targetUrl && (
            <img
  src={`https://chart.googleapis.com/chart?cht=qr&chs=600x600&chld=M|2&chl=${encodeURIComponent(targetUrl)}`}
  alt="QR"
  style={{ width: "100%", height: "100%", objectFit: "contain" }}
/>
          )}
        </div>
      </div>
      <div style={footer}>
        {targetUrl}
      </div>
    </div>
  );
}

// --- styles (high-contrast for thermal) ---
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
  gridTemplateColumns: "2fr 1.2fr", // give text more space
  gap: "0.18in",
  alignItems: "center",
};

const left: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.06in" };
const right: React.CSSProperties = { width: "2.2in", height: "2.2in" };

// Large queue number, very bold
const queue: React.CSSProperties = { fontSize: "1.6in", fontWeight: 900, lineHeight: 1, color: "#000" };

// Big name line
const name: React.CSSProperties = { fontSize: "0.50in", fontWeight: 800, marginTop: "0.02in", color: "#000" };

// Meta lines: no opacity, a bit larger
const meta: React.CSSProperties = { fontSize: "0.28in", fontWeight: 600, color: "#000" };
const metaSmall: React.CSSProperties = { fontSize: "0.24in", fontWeight: 600, color: "#000" };

// URL footer: readable, no gray
const footer: React.CSSProperties = {
  marginTop: "0.06in",
  fontSize: "0.22in",
  fontWeight: 600,
  color: "#000",
  wordBreak: "break-all",
};
