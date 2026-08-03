import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function getInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0) : "ک";
}

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
};

export function UserAvatar({ name, className, size = "md" }: UserAvatarProps) {
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
        {getInitial(name)}
      </AvatarFallback>
    </Avatar>
  );
}
