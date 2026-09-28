import { FileText, Globe, Image as ImageIcon, PlayCircle, Presentation } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import { FigmaIcon, GithubIcon } from "@/components/icons/brand-icons";
import type { Database } from "@/lib/supabase/database.types";

type SourceType = Database["public"]["Tables"]["works"]["Row"]["source_type"];
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export const SOURCE_TYPE_ICONS: Record<SourceType, IconComponent> = {
  website: Globe,
  figma: FigmaIcon,
  github: GithubIcon,
  youtube: PlayCircle,
  vimeo: PlayCircle,
  loom: PlayCircle,
  google_doc: FileText,
  google_slides: Presentation,
  notion: FileText,
  telegram_post: Globe,
  behance: ImageIcon,
  dribbble: ImageIcon,
  upload_image: ImageIcon,
  upload_video: PlayCircle,
  upload_pdf: FileText,
  other: Globe,
};

export function SourceTypeIcon({ type, className }: { type: SourceType; className?: string }) {
  const Icon = SOURCE_TYPE_ICONS[type] ?? Globe;
  return <Icon className={className} />;
}
