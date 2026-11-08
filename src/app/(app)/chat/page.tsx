import { auth } from "@/auth";
import Chat from "@/components/Chat";
import { accountOf } from "@/lib/account";

export default async function ChatPage() {
  return <Chat account={accountOf(await auth())} />;
}
