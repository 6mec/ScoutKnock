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
import { Clock } from "lucide-react";
import { useState } from "react";
import { ptPT } from "@/i18n/pt-PT";
import { stalledFor } from "@/lib/contacts/crm";
import {
  CONTACT_STATUSES,
  isContactStatus,
  type Contact,
  type ContactStatus,
} from "@/lib/contacts/rules";
import { cn } from "@/lib/utils";
import { StatusDot } from "./status-dot";
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

const money = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function formatMoney(value: number) {
  return money.format(value);
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
  const [now] = useState(() => Date.now());
  const stalled = stalledFor(contact, now);
  return (
    <>
      <div className="flex items-start gap-2">
        {onOpen ? (
          <button
            type="button"
            onClick={() => onOpen(contact.id)}
            className="focus-ring min-h-11 min-w-0 flex-1 rounded-sm text-left text-15 leading-snug font-semibold underline-offset-2 hovered:underline"
          >
            {contact.label}
          </button>
        ) : (
          <p className="min-h-11 min-w-0 flex-1 text-15 leading-snug font-semibold">{contact.label}</p>
        )}
      </div>
      {stalled !== null && (
        <p className="inline-flex items-center gap-1.5 self-start rounded-pill bg-amber-soft px-2 py-0.5 text-12 font-medium text-amber" data-testid="stalled">
          <Clock aria-hidden="true" size={12} />
          {copy.crm.stalled(stalled)}
        </p>
      )}
      {(contact.deal_value !== null || contact.do_not_contact) && (
        <p className="flex flex-wrap gap-x-3 text-13 text-muted">
          {contact.deal_value !== null && (
            <span className="type-number font-medium text-foreground">
              {formatMoney(contact.deal_value)}
            </span>
          )}
          {contact.do_not_contact && <span>{copy.crm.doNotContactBadge}</span>}
        </p>
      )}
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
        "flex cursor-grab flex-col gap-1.5 rounded-md border border-panel-border bg-surface px-3 pt-1 pb-3 shadow-[inset_0_1px_0_var(--panel-highlight),0_1px_2px_rgb(0_0_0/0.06)] transition-colors duration-(--duration-fast) touch-manipulation select-none hovered:border-border-strong",
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
  const total = contacts.reduce((sum, contact) => sum + Number(contact.deal_value ?? 0), 0);

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      data-testid={`column-${status}`}
      className={cn(
        "flex w-68 shrink-0 flex-col gap-3 rounded-lg border border-border-subtle bg-surface-raised/40 p-2.5 transition-colors duration-(--duration-fast) ease-out",
        isOver && "border-accent",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-1.5 pt-1">
        <h2 id={headingId} className="flex items-center gap-2 text-13 font-semibold">
          <StatusDot status={status} />
          {copy.statuses[status]}
        </h2>
        <span className="type-number rounded-pill bg-surface-raised px-2 py-0.5 text-12 text-muted">
          {contacts.length}
          {total > 0 && ` · ${formatMoney(total)}`}
        </span>
      </div>
      <ul className="flex min-h-20 flex-1 flex-col gap-2">
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
