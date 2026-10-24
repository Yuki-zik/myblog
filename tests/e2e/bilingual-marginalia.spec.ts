import { test } from "@playwright/test";
import { registerMarginaliaTests } from "./helpers/bilingual-marginalia";

test.use({ browserName: "chromium" });
registerMarginaliaTests("chromium");
