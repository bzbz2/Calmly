import { redirect } from "next/navigation";

// The critter screen was merged into chat: the mood buddy now lives at the bottom
// of the chat history sidebar. Keep the old URL working.
export default function Page() {
  redirect("/chat");
}
