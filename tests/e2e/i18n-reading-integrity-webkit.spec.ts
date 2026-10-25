import {test} from "@playwright/test";
import {registerReadingIntegrityTests} from "./helpers/reading-integrity";
test.use({browserName:"webkit"});
registerReadingIntegrityTests("webkit");
