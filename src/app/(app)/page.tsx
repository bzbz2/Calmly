import { auth } from "@/auth";
import Chat from "@/components/Chat";
import { accountOf } from "@/lib/account";

// Home is the chat: a message box, 4 moods and a looping buddy story. No sign-up first;
// the first message quietly makes a guest account.
export default async function Home() {
  return <Chat account={accountOf(await auth())} />;
}
