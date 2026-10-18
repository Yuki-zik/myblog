import {readFileSync} from "node:fs";
import {describe, expect, it} from "vitest";
const read=(path:string)=>readFileSync(path,"utf8");
describe("shared site identity",()=>{
  it("defaults every route to the architectural header",()=>{
    expect(read("src/layouts/BaseLayout.astro")).toContain('headerVariant = "drawing"');
  });
  it("does not ship the old blue interactive palette",()=>{
    const tokens=read("src/styles/tokens.css");
    for(const color of ["#0069d1","#0066cc","#0057b0","#8abbff","#a6cbff","#bedaff"]) expect(tokens).not.toContain(color);
    expect(tokens).toContain("--brand-accent: var(--drawing-accent-ink)");
  });
  it("keeps the shared discovery shell free of decorative blue ambient layers",()=>{
    expect(read("src/components/discover/DiscoverShell.astro")).not.toContain("<DiscoverAmbient");
  });
});
