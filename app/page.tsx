import { Chat } from "@/components/Chat";

export default function HomePage() {
  const operatorEmail = process.env.OPERATOR_EMAIL || "operater@dinos.si";

  return (
    <main>
      <Chat operatorEmail={operatorEmail} />
    </main>
  );
}
