import { HeroEcg } from "./ui";

export function AuthHero({
  cardA,
  cardB,
  heading,
  description,
}: {
  cardA: { title: string; subtitle: string };
  cardB: { title: string; subtitle: string };
  heading: string;
  description: string;
}) {
  return (
    <div className="hero">
      <div className="logo">
        <b></b>PulseBoard
      </div>
      <div className="fl a">
        {cardA.title}
        <small>{cardA.subtitle}</small>
      </div>
      <div className="fl b">
        {cardB.title}
        <small>{cardB.subtitle}</small>
      </div>
      <HeroEcg />
      <div>
        <h2>{heading}</h2>
        <p style={{ color: "#B9CCDA", maxWidth: 400 }}>{description}</p>
      </div>
    </div>
  );
}
