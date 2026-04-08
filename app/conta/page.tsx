import type { Metadata } from "next";

import { AccountPageView } from "@/features/auth";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Area basica do usuario com resumo de favoritos, lista comparativa e estado da conta."
};

export default function AccountPage() {
  return <AccountPageView />;
}
