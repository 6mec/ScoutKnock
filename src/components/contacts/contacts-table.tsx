"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";
import { ptPT } from "@/i18n/pt-PT";
import {
  sortContacts,
  type Contact,
  type ContactSortKey,
  type ContactStatus,
  type SortDirection,
} from "@/lib/contacts/rules";
import { formatDay, formatMoney } from "./contacts-board";
import { StatusMenu } from "./status-menu";

const { contacts: copy } = ptPT;
const COLUMNS: { key: ContactSortKey; label: string }[] = [
  { key: "name", label: copy.table.company },
  { key: "status", label: copy.table.status },
  { key: "nextAction", label: copy.table.nextAction },
  { key: "value", label: copy.table.value },
];
const ARIA_SORT = { asc: "ascending", desc: "descending" } as const;

export function ContactsTable({
  contacts,
  onOpen,
  onStatusChange,
}: {
  contacts: Contact[];
  onOpen: (id: string) => void;
  onStatusChange: (id: string, status: ContactStatus) => void;
}) {
  const [sortKey, setSortKey] = useState<ContactSortKey>("name");
  const [direction, setDirection] = useState<SortDirection>("asc");
  const SortIcon = direction === "asc" ? ArrowUp : ArrowDown;
  const rows = sortContacts(contacts, sortKey, direction);

  function sortBy(key: ContactSortKey) {
    if (key === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("asc");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Sem linhas, o ecrã dos contactos já diz porquê (filtro ou pesquisa). */}
      {rows.length === 0 ? null : (
        <div
          tabIndex={0}
          role="region"
          aria-label={copy.views.table}
          className="focus-ring overflow-x-auto panel"
        >
          <table className="w-full min-w-180 text-left text-14">
            <thead className="border-b border-border">
              <tr>
                {COLUMNS.map(({ key, label }) => (
                  <th
                    key={key}
                    scope="col"
                    aria-sort={sortKey === key ? ARIA_SORT[direction] : undefined}
                    className="p-1 font-medium"
                  >
                    <button
                      type="button"
                      onClick={() => sortBy(key)}
                      className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-sm px-3 text-muted hovered:text-foreground"
                    >
                      {label}
                      {sortKey === key && (
                        <SortIcon aria-hidden="true" size={14} strokeWidth={1.75} />
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((contact) => (
                <tr key={contact.id} className="border-b border-border last:border-b-0">
                  <th scope="row" className="p-1 font-medium">
                    <button
                      type="button"
                      onClick={() => onOpen(contact.id)}
                      className="focus-ring block min-h-11 w-full rounded-sm px-3 text-left underline-offset-2 hovered:underline"
                    >
                      {contact.label}
                    </button>
                    {contact.do_not_contact && (
                      <span className="block px-3 text-13 font-normal text-muted">
                        {copy.crm.doNotContactBadge}
                      </span>
                    )}
                  </th>
                  <td className="px-4 py-2">
                    <StatusMenu contact={contact} onChange={onStatusChange} />
                  </td>
                  <td className="px-4 py-2">
                    {contact.next_action ?? "–"}
                    {contact.next_action_at && (
                      <span className="type-number block text-13 text-muted">
                        {formatDay(contact.next_action_at)}
                      </span>
                    )}
                  </td>
                  <td className="type-number px-4 py-2">
                    {contact.deal_value === null ? "–" : formatMoney(contact.deal_value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
