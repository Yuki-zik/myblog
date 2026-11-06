import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
const read = (path:string) => readFileSync(new URL("../../../" + path,import.meta.url),"utf8");
const config=JSON.parse(read("vercel.json"));
describe("analytics deployment boundaries",()=>{
 it("only proxies collection and article counters; never the authenticated dashboard API",()=>{
  expect(config.rewrites.filter((r:{source:string})=>r.source.startsWith("/_analytics"))).toEqual([
   {source:"/_analytics/count",destination:"https://vps.a-znk.com:8443/analytics/count"},
   {source:"/_analytics/counter/:path*",destination:"https://vps.a-znk.com:8443/analytics/counter/:path*"}
  ]);
  expect(config.redirects.find((r:{source:string})=>r.source==="/analytics")).toEqual({source:"/analytics",destination:"https://vps.a-znk.com:8443/analytics/",permanent:false});
 });
 it("pins upstream tracker content and license",()=>{
  expect(createHash("sha256").update(read("public/vendor/goatcounter/count.v2.7.0.js")).digest("hex")).toBe("030ad75a7c80a04107a9b91f79e4b1572da0a583a80a9b67e111b310da11cbe9");
  expect(read("public/vendor/goatcounter/LICENSE")).toContain("Permission");
 });
});
