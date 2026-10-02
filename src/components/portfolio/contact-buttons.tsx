import { AtSign, Globe, Mail, MessageCircle, Palette, Phone, Send } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import { Button } from "@/components/ui/button";
import { GithubIcon, InstagramIcon, LinkedinIcon } from "@/components/icons/brand-icons";
import { contactHref, opensInNewTab, parseContacts, type ContactType } from "@/lib/contacts";
import type { Json } from "@/lib/supabase/database.types";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const CONTACT_ICONS: Record<ContactType, IconComponent> = {
  email: Mail,
  telegram: Send,
  whatsapp: MessageCircle,
  viber: Phone,
  phone: Phone,
  website: Globe,
  linkedin: LinkedinIcon,
  github: GithubIcon,
  behance: Palette,
  dribbble: Palette,
  instagram: InstagramIcon,
  x: AtSign,
};

const CONTACT_LABELS: Record<ContactType, string> = {
  email: "Email",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  viber: "Viber",
  phone: "Phone",
  website: "Website",
  linkedin: "LinkedIn",
  github: "GitHub",
  behance: "Behance",
  dribbble: "Dribbble",
  instagram: "Instagram",
  x: "X",
};

export function ContactButtons({ contacts: raw }: { contacts: Json }) {
  const contacts = parseContacts(raw);
  if (contacts.length === 0) return null;

  return (
    <>
      {contacts.map((contact, index) => {
        const Icon = CONTACT_ICONS[contact.type];
        const label = `${CONTACT_LABELS[contact.type]}: ${contact.value}`;
        const newTab = opensInNewTab(contact.type);
        return (
          <Button key={`${contact.type}-${index}`} variant="secondary" size="icon" asChild>
            <a
              href={contactHref(contact)}
              aria-label={label}
              title={label}
              {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <Icon className="h-4 w-4" />
            </a>
          </Button>
        );
      })}
    </>
  );
}
