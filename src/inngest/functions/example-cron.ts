import { inngest } from "../client";

export const exampleCron = inngest.createFunction(
  { id: "example-cron" },
  { cron: "0 0 * * *" },
  async ({ step }) => {
    await step.run("example-step", async () => {
      console.log("Example cron job ran at", new Date().toISOString());
      return { success: true };
    });
  },
);
