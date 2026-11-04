"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";
import { ptPT } from "@/i18n/pt-PT";
import { openBillingPortal } from "@/lib/billing/actions";
import {
  publishOfficialSiteDirectly,
  setOfficialSiteCancel,
  startOfficialCheckout,
  unpublishOfficialSiteDirectly,
} from "@/lib/demos/official-actions";
import {
  MAX_SITE_NAME,
  OFFICIAL_SITE_PRICE_EUR,
  isLive,
  parseSiteName,
  suggestSiteName,
  type OfficialSite,
} from "@/lib/demos/official-rules";

const { official: copy } = ptPT.demos;
const dateFormat = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "long",
  timeZone: "Europe/Lisbon",
});
const formatDate = (date: string) => dateFormat.format(new Date(date));

export type Publishing = {
  available: boolean;
  returned: boolean;
  url: string | null;
  // Modo pessoal: o admin publica sem o Stripe.
  direct?: boolean;
};

function PublishDialog({
  demoId,
  initialName,
  available,
  direct = false,
}: {
  demoId: string;
  initialName: string;
  available: boolean;
  direct?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const valid = parseSiteName(name) !== null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      if (direct) {
        const result = await publishOfficialSiteDirectly(demoId, name, confirmed);
        if (result.status === "published") {
          toast.success(copy.direct.published);
          setOpen(false);
          router.refresh();
        } else {
          setError(copy.errors[result.status]);
        }
        return;
      }
      const result = await startOfficialCheckout(demoId, name, confirmed);
      if (result.status === "checkout") window.location.assign(result.url);
      else setError(copy.errors[result.status]);
    });
  }

  return (
    <>
      <Button
        ref={buttonRef}
        variant="secondary"
        disabled={!available}
        onClick={() => setOpen(true)}
      >
        {copy.publish}
      </Button>
      {!available && <p className="text-13 text-muted">{copy.unavailable}</p>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            buttonRef.current?.focus();
          }}
        >
          <DialogTitle>{copy.publish}</DialogTitle>
          <DialogDescription>
            {direct ? copy.direct.dialogBody : copy.dialogBody(OFFICIAL_SITE_PRICE_EUR)}
          </DialogDescription>
          <Badge variant={direct ? "accent" : "amber"} className="self-start">
            {direct ? copy.direct.badge : copy.testMode}
          </Badge>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field
              label={copy.nameLabel}
              help={copy.nameHelp}
              error={name && !valid ? copy.errors.invalid : error}
            >
              <Input
                value={name}
                maxLength={MAX_SITE_NAME}
                autoComplete="off"
                required
                onChange={(event) => setName(event.target.value.toLowerCase())}
              />
            </Field>
            <label className="flex items-start gap-3 text-14">
              <input
                type="checkbox"
                required
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="focus-ring mt-0.5 size-5 shrink-0 accent-(--accent)"
              />
              {copy.confirm}
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                loading={pending}
                loadingText={copy.pending}
                disabled={!valid || !confirmed}
              >
                {direct ? copy.direct.continue : copy.continue}
              </Button>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                {copy.cancelDialog}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DirectLiveSite({
  demoId,
  url,
}: {
  demoId: string;
  url: string | null;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function unpublish() {
    startTransition(async () => {
      const { ok } = await unpublishOfficialSiteDirectly(demoId);
      if (ok) toast.success(copy.direct.unpublished);
      else toast.error(ptPT.demos.errors.generic);
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          data-testid="official-url"
          className="focus-ring inline-flex min-h-11 items-center self-start rounded-sm break-all text-14 text-accent underline"
        >
          {url}
        </a>
      )}
      <p className="text-14 text-muted">{copy.direct.live}</p>
      {confirming ? (
        <div className="flex flex-col gap-3 rounded-md border border-danger p-3">
          <p className="text-14">{copy.direct.unpublishWarning}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" loading={pending} loadingText={copy.pending} onClick={unpublish}>
              {copy.direct.unpublishConfirm}
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              {copy.keepShort}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => setConfirming(true)} className="self-start">
          {copy.direct.unpublish}
        </Button>
      )}
    </>
  );
}

function LiveSite({
  demoId,
  site,
  url,
}: {
  demoId: string;
  site: OfficialSite;
  url: string | null;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function setCancel(cancel: boolean) {
    startTransition(async () => {
      const { ok } = await setOfficialSiteCancel(demoId, cancel);
      if (ok) {
        toast.success(copy.cancelRequested);
        setConfirming(false);
      } else {
        toast.error(ptPT.demos.errors.generic);
      }
      router.refresh();
    });
  }

  return (
    <>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="focus-ring inline-flex min-h-11 items-center self-start rounded-sm break-all text-14 text-accent underline"
        >
          {url}
        </a>
      )}
      {site.status === "past_due" && (
        <div role="alert" className="flex flex-col gap-3 rounded-md border border-amber/30 bg-amber-soft p-3 text-14 text-amber">
          <p>{copy.paymentProblem}</p>
          <form action={openBillingPortal}>
            <Button type="submit" variant="secondary">
              {copy.updatePayment}
            </Button>
          </form>
        </div>
      )}
      {site.cancel_at_period_end ? (
        <>
          <p className="text-14 text-muted">
            {site.period_end ? copy.endsOn(formatDate(site.period_end)) : copy.ending}
          </p>
          <Button
            variant="secondary"
            loading={pending}
            loadingText={copy.pending}
            onClick={() => setCancel(false)}
            className="self-start"
          >
            {copy.keep}
          </Button>
        </>
      ) : confirming ? (
        <div className="flex flex-col gap-3 rounded-md border border-danger p-3">
          <p className="text-14">
            {site.period_end
              ? copy.cancelWarning(formatDate(site.period_end))
              : copy.cancelWarningNoDate}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              loading={pending}
              loadingText={copy.pending}
              onClick={() => setCancel(true)}
            >
              {copy.cancelConfirm}
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              {copy.keepShort}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => setConfirming(true)} className="self-start">
          {copy.cancel}
        </Button>
      )}
    </>
  );
}

export function OfficialSiteSection({
  demoId,
  companyName,
  site,
  publishing,
}: {
  demoId: string;
  companyName: string;
  site?: OfficialSite | null;
  publishing: Publishing;
}) {
  const router = useRouter();
  const live = isLive(site);
  const waiting = site?.status === "pending" && publishing.returned;

  return (
    <section
      aria-label={copy.title}
      data-testid="official-site"
      className="flex flex-col gap-3 border-t border-border p-4 lg:p-8"
    >
      <h2 className="text-14 font-bold">{copy.title}</h2>
      {live && site?.published_directly ? (
        <DirectLiveSite demoId={demoId} url={publishing.url} />
      ) : live && site ? (
        <LiveSite demoId={demoId} site={site} url={publishing.url} />
      ) : waiting ? (
        <div role="status" className="flex flex-col items-start gap-3">
          <p className="text-14 text-muted">{copy.confirming}</p>
          <Button variant="secondary" onClick={() => router.refresh()}>
            {copy.refresh}
          </Button>
        </div>
      ) : (
        <>
          {site?.status === "ended" && site.name_reserved_until && (
            <p role="status" className="rounded-md border border-amber/30 bg-amber-soft p-3 text-14 text-amber">
              {copy.ended(site.name, formatDate(site.name_reserved_until))}
            </p>
          )}
          <PublishDialog
            demoId={demoId}
            initialName={site?.name ?? suggestSiteName(companyName)}
            available={publishing.available || Boolean(publishing.direct)}
            direct={Boolean(publishing.direct)}
          />
        </>
      )}
    </section>
  );
}
