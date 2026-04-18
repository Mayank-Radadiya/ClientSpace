import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "clientspace",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
