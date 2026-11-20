import Image from "next/image";
import Link from "next/link";
import logo from "../../public/brand/logo-light.png";

export function Logo({ className = "", priority = false, href = "/" }: { className?: string; priority?: boolean; href?: string | null }) {
  const img = <Image src={logo} alt="Cloudline Media" priority={priority} className={`h-auto w-full ${className}`} sizes="180px" />;
  if (!href) return img;
  return (
    <Link href={href} aria-label="Cloudline Media — home" className="block">
      {img}
    </Link>
  );
}
