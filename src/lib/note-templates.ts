export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  content: string;
  type: "meeting" | "personal";
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "meeting",
    name: "Meeting Notes",
    description: "Capture attendees, agenda, and action items",
    icon: "Users",
    type: "meeting",
    content: `## Attendees
-

## Agenda
1.

## Discussion


## Action Items
- [ ]

## Next Steps
`,
  },
  {
    id: "one-on-one",
    name: "1:1 Meeting",
    description: "Template for one-on-one conversations",
    icon: "UserCircle",
    type: "meeting",
    content: `## Check-in
How are you doing?

## Updates


## Blockers


## Goals for Next Week


## Feedback
`,
  },
  {
    id: "standup",
    name: "Daily Standup",
    description: "Quick daily status update",
    icon: "Calendar",
    type: "meeting",
    content: `## Yesterday
-

## Today
-

## Blockers
-
`,
  },
  {
    id: "project-brief",
    name: "Project Brief",
    description: "Outline project goals and timeline",
    icon: "FileText",
    type: "personal",
    content: `## Overview


## Goals
-

## Timeline
| Phase | Dates | Deliverables |
|-------|-------|--------------|
|       |       |              |

## Resources


## Risks
-
`,
  },
  {
    id: "brainstorm",
    name: "Brainstorm",
    description: "Free-form idea capture",
    icon: "Lightbulb",
    type: "personal",
    content: `## Topic


## Ideas
-
-
-

## Pros & Cons

### Pros
-

### Cons
-

## Next Actions
-
`,
  },
  {
    id: "blank",
    name: "Blank Note",
    description: "Start with an empty canvas",
    icon: "File",
    type: "personal",
    content: "",
  },
];

export function getTemplateById(id: string): NoteTemplate | undefined {
  return NOTE_TEMPLATES.find((t) => t.id === id);
}
