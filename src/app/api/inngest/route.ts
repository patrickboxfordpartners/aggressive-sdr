import { serve } from "inngest/next";
import { exampleCron, executeAutomation, generateScheduledReports } from "@/inngest";
import { inngest } from "@/inngest/client";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [exampleCron, executeAutomation, generateScheduledReports],
  logLevel: "debug",
});
