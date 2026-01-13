import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import Link from "next/link";

interface NoteProps {
  id: string;
  title: string;
  preview: string;
  date: string;
  tags?: string[];
  type: "meeting" | "personal";
}

export function NoteCard({ id, title, preview, date, tags, type }: NoteProps) {
  return (
    <Link href={`/notes/${id}`}>
      <Card className="h-full hover:shadow-md transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-primary group">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1">{title}</CardTitle>
            {type === "meeting" && <Badge variant="secondary" className="text-xs">Meeting</Badge>}
          </div>
          <CardDescription className="flex items-center gap-1 text-xs mt-1">
            <Calendar className="h-3 w-3" />
            {date}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {preview}
          </p>
        </CardContent>
        <CardFooter className="pt-0 flex gap-2">
            {tags?.map(tag => (
                <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0 h-5 text-muted-foreground font-normal">
                    {tag}
                </Badge>
            ))}
        </CardFooter>
      </Card>
    </Link>
  );
}
