"use client";

import { Trash2, UserPlus } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { inviteMember, removeMember, setMemberRole } from "@/lib/team/actions";
import { TEAM_ROLES, type TeamMember, type TeamRole } from "@/lib/team/rules";

const copy = ptPT.team;
const ROLE_KEYS: Record<TeamRole, keyof typeof copy.roles> = { admin: "admin", sales: "sales", read_only: "readOnly" };

// Convidados e as suas funções. O convite fica pendente: não é enviado nem dá acesso.
export function TeamMembers({ members: initial, available }: { members: TeamMember[]; available: boolean }) {
  const [members, setMembers] = useState(initial);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("sales");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!available) return <p className="text-13 text-muted">{copy.unavailable}</p>;

  function invite(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await inviteMember(email, role);
      if (!result.ok) {
        setError(copy.errors[result.error]);
        return;
      }
      setMembers((list) => [...list, { id: crypto.randomUUID(), email: email.trim().toLowerCase(), role, status: "invited", created_at: new Date().toISOString() }]);
      setEmail("");
      toast.success(copy.invited);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {members.length > 0 && (
        <ul className="flex flex-col divide-y divide-border" data-testid="team-invites">
          {members.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-14 font-medium">{member.email}</span>
                <span className="text-13 text-muted">{copy.statuses[member.status]}</span>
              </span>
              <span className="flex items-center gap-2">
                <Select
                  aria-label={copy.roleFor(member.email)}
                  value={member.role}
                  disabled={pending}
                  onChange={(event) => {
                    const next = event.target.value as TeamRole;
                    startTransition(async () => {
                      const { ok } = await setMemberRole(member.id, next);
                      if (ok) setMembers((list) => list.map((item) => (item.id === member.id ? { ...item, role: next } : item)));
                      else toast.error(copy.errors.generic);
                    });
                  }}
                  className="h-10 w-auto"
                >
                  {TEAM_ROLES.map((item) => (
                    <option key={item} value={item}>
                      {copy.roles[ROLE_KEYS[item]]}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  aria-label={copy.remove(member.email)}
                  onClick={() =>
                    startTransition(async () => {
                      const { ok } = await removeMember(member.id);
                      if (ok) setMembers((list) => list.filter((item) => item.id !== member.id));
                      else toast.error(copy.errors.generic);
                    })
                  }
                >
                  <Trash2 aria-hidden="true" size={15} />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={invite} noValidate className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end" data-testid="team-invite">
        <Field label={copy.email}>
          <Input type="email" value={email} maxLength={200} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label={copy.role}>
          <Select value={role} onChange={(event) => setRole(event.target.value as TeamRole)}>
            {TEAM_ROLES.map((item) => (
              <option key={item} value={item}>
                {copy.roles[ROLE_KEYS[item]]}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" variant="secondary" loading={pending} loadingText={copy.inviting} disabled={!email.trim()}>
          <UserPlus aria-hidden="true" size={15} />
          {copy.invite}
        </Button>
        {error && (
          <p role="alert" className="text-14 text-danger sm:col-span-3">
            {error}
          </p>
        )}
      </form>
      <p className="text-13 text-muted">{copy.inviteNote}</p>
      <dl className="grid gap-3 rounded-md border border-border-subtle p-3 text-13 sm:grid-cols-3">
        {TEAM_ROLES.map((item) => (
          <div key={item} className="flex flex-col gap-0.5">
            <dt className="font-semibold">{copy.roles[ROLE_KEYS[item]]}</dt>
            <dd className="text-muted">{copy.roleHelp[ROLE_KEYS[item]]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
