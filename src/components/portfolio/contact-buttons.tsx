import { Globe, Mail, MessageCircle } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import { Button } from "@/components/ui/button";
import { GithubIcon, InstagramIcon, LinkedinIcon } from "@/components/icons/brand-icons";
import type { Json } from "@/lib/supabase/database.types";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface Contacts {
  telegram?: string;
  whatsapp?: string;
  email?: string;
  linkedin?: string;
  github?: string;
  behance?: string;
  dribbble?: string;
  instagram?: string;
  x?: string;
  website?: string;
}

function parseContacts(raw: Json): Contacts {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Contacts;
}

export function ContactButtons({ contacts: raw }: { contacts: Json }) {
  const contacts = parseContacts(raw);

  const links: Array<{ href: string; icon: IconComponent; label: string }> = [];

  if (contacts.telegram) {
    links.push({
      href: `https://t.me/${contacts.telegram.replace(/^@/, "")}`,
      icon: MessageCircle,
      label: "Telegram",
    });
  }
  if (contacts.whatsapp) {
    links.push({
      href: `https://wa.me/${contacts.whatsapp.replace(/\D/g, "")}`,
      icon: MessageCircle,
      label: "WhatsApp",
    });
  }
  if (contacts.email) {
    links.push({ href: `mailto:${contacts.email}`, icon: Mail, label: "Email" });
  }
  if (contacts.linkedin) {
    links.push({ href: contacts.linkedin, icon: LinkedinIcon, label: "LinkedIn" });
  }
  if (contacts.github) {
    links.push({ href: contacts.github, icon: GithubIcon, label: "GitHub" });
  }
  if (contacts.instagram) {
    links.push({
      href: `https://instagram.com/${contacts.instagram.replace(/^@/, "")}`,
      icon: InstagramIcon,
      label: "Instagram",
    });
  }
  if (contacts.website) {
    links.push({ href: contacts.website, icon: Globe, label: "Website" });
  }

  if (links.length === 0) return null;

  return (
    <>
      {links.map((link) => (
        <Button key={link.href} variant="secondary" size="icon" asChild>
          <a href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label}>
            <link.icon className="h-4 w-4" />
          </a>
        </Button>
      ))}
    </>
  );
}
