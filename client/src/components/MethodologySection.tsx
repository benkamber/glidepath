import { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ExternalLink } from "lucide-react";

interface MethodologySectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function MethodologySection({ title, children, defaultOpen = false }: MethodologySectionProps) {
  return (
    <AccordionItem value={title} className="border-border">
      <AccordionTrigger className="text-lg font-semibold text-primary hover:text-primary/80">
        {title}
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4 text-sm text-muted-foreground">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

interface ExternalLinkItemProps {
  href: string;
  children: ReactNode;
}

export function ExternalLinkItem({ href, children }: ExternalLinkItemProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-primary hover:text-primary/80 hover:underline"
    >
      {children}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

interface CodeBlockProps {
  children: ReactNode;
}

export function CodeBlock({ children }: CodeBlockProps) {
  return (
    <pre className="rounded-lg bg-secondary/50 p-4 overflow-x-auto">
      <code className="text-xs font-mono text-foreground">{children}</code>
    </pre>
  );
}

interface DefinitionListProps {
  items: { term: string; definition: string }[];
}

export function DefinitionList({ items }: DefinitionListProps) {
  return (
    <dl className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="border-l-2 border-primary/30 pl-4">
          <dt className="font-semibold text-foreground">{item.term}</dt>
          <dd className="mt-1 text-muted-foreground">{item.definition}</dd>
        </div>
      ))}
    </dl>
  );
}
