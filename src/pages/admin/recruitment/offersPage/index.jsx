import React from "react";
import { Plus, RefreshCw } from "lucide-react";
import { PageHeader, Btn } from "../shared";
import { useOffersState } from "./hooks/useOffersState";
import StatusFilterBar from "./components/StatusFilterBar";
import OffersTableCard from "./components/OffersTableCard";
import OfferCreateSlideOver from "./components/OfferCreateSlideOver";
import OfferDetailSlideOver from "./components/OfferDetailSlideOver";
import OnboardModal from "./components/OnboardModal";

export default function OffersPage({ role }) {
  const s = useOffersState(role);

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard", "Offers"]}
        title="Offer Management"
        subtitle="Release, track and manage candidate offer letters"
        action={s.canCreate && (
          <div className="flex gap-2">
            <Btn variant="secondary" icon={<RefreshCw size={14} />} onClick={s.loadOffers} />
            <Btn icon={<Plus size={16} />} onClick={() => s.setOfferOpen(true)}>Release Offer</Btn>
          </div>
        )}
      />

      <StatusFilterBar offers={s.offers} filterStatus={s.filterStatus} onSelect={s.selectFilter} />

      <OffersTableCard
        tableRef={s.tableRef}
        loading={s.loading}
        visible={s.visible}
        search={s.search}
        onSearch={s.setSearch}
        filterStatus={s.filterStatus}
        onFilterChange={s.setFilterStatus}
        onView={s.openDetail}
      />

      <OfferCreateSlideOver
        open={s.offerOpen}
        onClose={s.closeCreateForm}
        form={s.form}
        computed={s.computed}
        candidates={s.candidates}
        jobs={s.jobs}
        step={s.step}
        checks={s.checks}
        saving={s.saving}
        onChange={s.handleChange}
        onSubmit={s.handleCreate}
        onBack={() => s.setStep("form")}
      />

      {s.detail && (
        <OfferDetailSlideOver
          detail={s.detail}
          joiningInv={s.joiningInv}
          isAdmin={s.isAdmin}
          acting={s.acting}
          resending={s.resending}
          onClose={s.closeDetail}
          onRelease={s.handleRelease}
          onRespond={s.handleRespond}
          onResend={s.handleResend}
          onCopyLink={s.copyJoiningLink}
          onStartOnboarding={() => {
            s.setOnboardEffDate(s.detail.date_of_joining?.slice(0, 10) || "");
            s.setOnboardModal(true);
          }}
        />
      )}

      <OnboardModal
        open={s.onboardModal}
        candidateName={s.detail?.candidate_name}
        effDate={s.onboardEffDate}
        onEffDateChange={s.setOnboardEffDate}
        onboarding={s.onboarding}
        onClose={() => { s.setOnboardModal(false); s.setOnboardEffDate(""); }}
        onConfirm={s.handleStartOnboarding}
      />
    </div>
  );
}
