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
        @media print { body { margin: 0; }
          .page { page-break-after: always; }
        }
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
              src={`/api/qr?data=${encodeURIComponent(targetUrl)}`}
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

// --- styles ---
const wrap: React.CSSProperties = {
  width: "4in", height: "6in",
  boxSizing: "border-box",
  padding: "0.35in",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
  display: "flex", flexDirection: "column", justifyContent: "space-between",
};
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.8fr 1fr",
  gap: "0.2in",
  alignItems: "center",
};
const left: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.06in" };
const right: React.CSSProperties = { width: "1.8in", height: "1.8in" };
const queue: React.CSSProperties = { fontSize: "1.2in", fontWeight: 900, lineHeight: 1 };
const name: React.CSSProperties = { fontSize: "0.35in", fontWeight: 700, marginTop: "0.04in" };
const meta: React.CSSProperties = { fontSize: "0.22in", opacity: 0.9 };
const metaSmall: React.CSSProperties = { fontSize: "0.18in", opacity: 0.7 };
const footer: React.CSSProperties = { marginTop: "0.1in", fontSize: "0.18in", opacity: 0.7, wordBreak: "break-all" };
