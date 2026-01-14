import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { Note } from "@/store/useStore";

export function NoteCard({ id, title, preview, date, tags, type, metadata }: Note) {
  return (
    <Link href={`/notes/${id}`}>
      <Card className="hover:border-l-primary group flex h-full cursor-pointer flex-col justify-between border-l-4 border-l-transparent transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="group-hover:text-primary line-clamp-1 text-lg transition-colors">
              {title}
            </CardTitle>
            {type === "meeting" && (
              <Badge variant="secondary" className="text-xs">
                Meeting
              </Badge>
            )}
          </div>
          <CardDescription className="mt-1 flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            {date}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-2 line-clamp-3 text-sm">{preview}</p>

          {metadata?.checklist && (
            <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
              <div className="flex items-center gap-1">
                <span
                  className={
                    metadata.checklist.checked === metadata.checklist.total
                      ? "font-medium text-green-500"
                      : ""
                  }
                >
                  {metadata.checklist.checked}/{metadata.checklist.total}
                </span>
                <span>items</span>
              </div>
              {metadata.checklist.checked === metadata.checklist.total && (
                <Badge
                  variant="outline"
                  className="h-4 border-green-200 bg-green-50 px-1 text-[10px] text-green-600"
                >
                  Done
                </Badge>
              )}
            </div>
          )}

          {metadata?.images && metadata.images.length > 0 && (
            <div className="bg-muted/20 relative mt-2 h-24 w-full overflow-hidden rounded-md border">
              <img
                src={metadata.images[0]}
                alt="Note attachment"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center gap-2 overflow-x-auto pt-0">
          {tags?.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-muted-foreground h-5 px-1 py-0 text-[10px] font-normal"
            >
              {tag}
            </Badge>
          ))}
        </CardFooter>
      </Card>
    </Link>
  );
}
