import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";

type ContentCardProps = {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function ContentCard({
  title,
  description,
  children,
  className,
}: ContentCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className={cardTitleClass}>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
