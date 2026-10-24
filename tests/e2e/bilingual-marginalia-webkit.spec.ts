import { test } from "@playwright/test";
import { registerMarginaliaTests } from "./helpers/bilingual-marginalia";

test.use({ browserName: "webkit" });
registerMarginaliaTests("webkit");
