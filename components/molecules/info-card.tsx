import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";

type InfoCardProps = {
  title: string;
  description: string;
  className?: string;
};

export function InfoCard({ title, description, className }: InfoCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className={cardTitleClass}>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
