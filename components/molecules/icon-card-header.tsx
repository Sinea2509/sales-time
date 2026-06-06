import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";

type IconCardHeaderProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  iconWrapClassName?: string;
  iconClassName?: string;
};

export function IconCardHeader({
  icon: Icon,
  title,
  description,
  iconWrapClassName,
  iconClassName,
}: IconCardHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            iconWrapClassName,
          )}
        >
          <Icon className={cn("size-5", iconClassName)} aria-hidden />
        </div>
        <div className="min-w-0">
          <CardTitle className={cardTitleClass}>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
      </div>
    </CardHeader>
  );
}
