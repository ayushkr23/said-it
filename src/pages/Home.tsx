import { Page } from "../components/Page";
import { Details } from "../sections/Details";
import { Hero } from "../sections/Hero";
import { Lever } from "../sections/Lever";
import { Night } from "../sections/Night";
import { Open, Outro } from "../sections/Open";
import { Problem } from "../sections/Problem";

export default function Home() {
  return (
    <Page title="Said It — the promises you forgot, found offline">
      <Hero />
      <Problem />
      <Lever />
      <Night />
      <Details />
      <Open />
      <Outro />
    </Page>
  );
}
