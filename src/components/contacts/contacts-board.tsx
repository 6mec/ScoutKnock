"use client";

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { ScoreChip } from "@/components/ui/score-chip";
import { ptPT } from "@/i18n/pt-PT";
import {
  CONTACT_STATUSES,
  isContactStatus,
  type Contact,
  type ContactStatus,
} from "@/lib/contacts/rules";
import { cn } from "@/lib/utils";
import { StatusMenu } from "./status-menu";

const { contacts: copy } = ptPT;
const dateFormat = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "medium",
  timeZone: "UTC",
});

// O arrasto é só para rato e toque: quem usa teclado tem o menu de estado.
const SILENT_DND = {
  screenReaderInstructions: { draggable: "" },
  announcements: {
    onDragStart: () => undefined,
    onDragOver: () => undefined,
    onDragEnd: () => undefined,
    onDragCancel: () => undefined,
  },
};
const MOUSE_DISTANCE = 8;
const TOUCH_DELAY_MS = 200;
const TOUCH_TOLERANCE = 8;

export function formatDay(day: string) {
  return dateFormat.format(new Date(`${day}T00:00:00Z`));
}

function CardContent({
  contact,
  onOpen,
  onStatusChange,
}: {
  contact: Contact;
  onOpen?: (id: string) => void;
  onStatusChange?: (id: string, status: ContactStatus) => void;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        {onOpen ? (
          <button
            type="button"
            onClick={() => onOpen(contact.id)}
            className="focus-ring min-h-11 min-w-0 flex-1 rounded-sm text-left font-semibold underline-offset-2 hovered:underline"
          >
            {contact.company_name}
          </button>
        ) : (
          <p className="min-h-11 min-w-0 flex-1 font-semibold">{contact.company_name}</p>
        )}
        <ScoreChip score={contact.score} className="shrink-0" />
      </div>
      <p className="text-13 text-muted">{contact.locality}</p>
      {contact.next_action && (
        <p className="text-13">
          {contact.next_action}
          {contact.next_action_at && (
            <span className="type-number text-muted">
              {" · "}
              {formatDay(contact.next_action_at)}
            </span>
          )}
        </p>
      )}
      {onStatusChange && (
        <div className="mt-1">
          <StatusMenu contact={contact} onChange={onStatusChange} />
        </div>
      )}
    </>
  );
}

function Card({
  contact,
  onOpen,
  onStatusChange,
}: {
  contact: Contact;
  onOpen: (id: string) => void;
  onStatusChange: (id: string, status: ContactStatus) => void;
}) {
  const { listeners, setNodeRef, isDragging } = useDraggable({ id: contact.id });

  return (
    <li
      ref={setNodeRef}
      {...listeners}
      data-testid="contact-card"
      className={cn(
        "flex cursor-grab flex-col gap-2 rounded-md border border-border bg-surface p-3 touch-manipulation select-none",
        isDragging && "opacity-40",
      )}
    >
      <CardContent
        contact={contact}
        onOpen={onOpen}
        onStatusChange={onStatusChange}
      />
    </li>
  );
}

function Column({
  status,
  contacts,
  onOpen,
  onStatusChange,
}: {
  status: ContactStatus;
  contacts: Contact[];
  onOpen: (id: string) => void;
  onStatusChange: (id: string, status: ContactStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const headingId = `contacts-column-${status}`;

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      data-testid={`column-${status}`}
      className={cn(
        "flex w-68 shrink-0 flex-col gap-3 rounded-lg border border-border-subtle bg-background p-3 transition-colors duration-(--duration-fast) ease-out",
        isOver && "border-accent",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 id={headingId} className="text-14 font-semibold">
          {copy.statuses[status]}
        </h2>
        <span className="type-number text-12 text-muted">{contacts.length}</span>
      </div>
      <ul className="flex min-h-24 flex-1 flex-col gap-2">
        {contacts.map((contact) => (
          <Card
            key={contact.id}
            contact={contact}
            onOpen={onOpen}
            onStatusChange={onStatusChange}
          />
        ))}
      </ul>
    </section>
  );
}

export function ContactsBoard({
  contacts,
  onOpen,
  onStatusChange,
}: {
  contacts: Contact[];
  onOpen: (id: string) => void;
  onStatusChange: (id: string, status: ContactStatus) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: MOUSE_DISTANCE } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: TOUCH_DELAY_MS, tolerance: TOUCH_TOLERANCE },
    }),
  );
  const dragging = contacts.find(({ id }) => id === draggingId);

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDraggingId(null);

    const contact = contacts.find(({ id }) => id === active.id);
    if (contact && isContactStatus(over?.id) && over.id !== contact.status) {
      onStatusChange(contact.id, over.id);
    }
  }

  return (
    <DndContext
      id="contacts-board"
      sensors={sensors}
      accessibility={SILENT_DND}
      onDragStart={({ active }) => setDraggingId(String(active.id))}
      onDragCancel={() => setDraggingId(null)}
      onDragEnd={handleDragEnd}
    >
      <div
        tabIndex={0}
        role="region"
        aria-label={copy.views.board}
        className="focus-ring flex gap-3 overflow-x-auto rounded-md pb-3"
      >
        {CONTACT_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            contacts={contacts.filter((contact) => contact.status === status)}
            onOpen={onOpen}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
      <DragOverlay>
        {dragging && (
          <div className="flex w-62 cursor-grabbing flex-col gap-2 rounded-md border border-accent bg-surface-raised p-3 shadow-float">
            <CardContent contact={dragging} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
