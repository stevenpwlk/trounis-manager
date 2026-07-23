import { crestSrc } from "../src/data/crests";

export default function Crest({ code, size = "md" }: { code: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const src = crestSrc(code);
  const cls = `crest crest--${size}`;
  if (!src) {
    return <span className={`crest-badge ${size === "lg" ? "lg" : size === "xl" ? "xl" : ""}`}>{code}</span>;
  }
  return <img className={cls} src={src} alt={code} width={64} height={64} />;
}
