"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_LINKS = [
  { href: "/admin", label: "Painel" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/produtos/novo", label: "Novo" },
  { href: "/admin/produtos/importar", label: "Importar" },
  { href: "/admin/produtos/revisar", label: "Revisar" }
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSectionNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 rounded-[1.5rem] bg-white p-3 shadow-glow">
      <ul className="flex flex-wrap gap-2">
        {ADMIN_LINKS.map((link) => {
          const active = isActive(pathname, link.href);

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active ? "bg-coral text-white" : "bg-black/5 text-neutral-700 hover:bg-black/10"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
