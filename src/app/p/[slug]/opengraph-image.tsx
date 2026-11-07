import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { ptPT } from "@/i18n/pt-PT";
import { findPortfolio } from "@/lib/portfolio/public";

// Imagem da pré-visualização ao partilhar o link (WhatsApp e outras), gerada pela app:
// o nome, a frase e os nomes de até 3 trabalhos. Nada de números nem avaliações.
export const alt = "Pré-visualização do portfólio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const portfolio = await findPortfolio((await params).slug);
  const name = portfolio?.display_name ?? ptPT.brand.name;
  const headline = portfolio?.headline ?? (portfolio ? ptPT.portfolio.page.description(name) : "");
  const works = (portfolio?.works ?? []).slice(0, 3).map((work) => work.company_name);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #ffffff 0%, #f7f9fb 55%, #e6f4ef 100%)",
          color: "#0b0f14",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 112,
            height: 112,
            borderRadius: 28,
            background: "#0b0f14",
            color: "#ffffff",
            fontSize: 44,
            fontWeight: 700,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {initials}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{name}</div>
          {headline && <div style={{ display: "flex", fontSize: 36, lineHeight: 1.3, color: "#3d4754", maxWidth: 1000 }}>{headline}</div>}
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 26, color: "#0a7f5b", fontWeight: 600 }}>
          {works.map((work) => (
            <div key={work} style={{ display: "flex", padding: "10px 20px", borderRadius: 999, background: "#ffffff", border: "2px solid #cfe9df" }}>
              {work}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
