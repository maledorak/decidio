import Link from "next/link";
import { Github } from "lucide-react";

export const Footer = () => {
  return (
    <div className="absolute bottom-4 right-4">
      <Link
        href="https://github.com/maledorak/decidio"
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-crisis-red transition-colors"
      >
        <Github className="w-6 h-6" />
      </Link>
    </div>
  );
};
