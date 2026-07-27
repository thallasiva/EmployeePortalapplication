import React from "react";
import { useJoiningForm } from "./hooks/useJoiningForm";
import LoadingView from "./components/LoadingView";
import ErrorView from "./components/ErrorView";
import SubmittedView from "./components/SubmittedView";
import PageHeader from "./components/PageHeader";
import ChangesRequestedBanner from "./components/ChangesRequestedBanner";
import TabNav from "./components/TabNav";
import ValidationErrors from "./components/ValidationErrors";
import NavigationButtons from "./components/NavigationButtons";

import HandbookTab from "../tabs/HandbookTab";
import HRPolicyTab from "../tabs/HRPolicyTab";
import PersonalInfoTab from "../tabs/PersonalInfoTab";
import TermLifeTab from "../tabs/TermLifeTab";
import GratuityTab from "../tabs/GratuityTab";
import InsuranceTab from "../tabs/InsuranceTab";
import PFDeclarationTab from "../tabs/PFDeclarationTab";
import BankDetailsTab from "../tabs/BankDetailsTab";
import ReviewSubmitTab from "../tabs/ReviewSubmitTab";

export default function JoiningFormalities() {
  const {
    inv,
    loading,
    error,
    tab,
    saving,
    submitted,
    visited,
    validErrs,
    form,
    set,
    setForm,
    goTo,
    handleSubmit
  } = useJoiningForm();

  if (loading) return <LoadingView />;
  if (error) return <ErrorView error={error} />;
  if (submitted) return <SubmittedView inv={inv} />;

  const TAB_COMPONENTS = [
    <HandbookTab form={form} set={set} setForm={setForm} />,
    <HRPolicyTab form={form} set={set} setForm={setForm} />,
    <PersonalInfoTab form={form} set={set} setForm={setForm} />,
    <TermLifeTab form={form} set={set} setForm={setForm} />,
    <GratuityTab form={form} set={set} setForm={setForm} />,
    <InsuranceTab form={form} set={set} setForm={setForm} />,
    <PFDeclarationTab form={form} set={set} setForm={setForm} />,
    <BankDetailsTab form={form} set={set} />,
    <ReviewSubmitTab form={form} />
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader inv={inv} />

      <ChangesRequestedBanner inv={inv} />

      <TabNav tab={tab} visited={visited} goTo={goTo} />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <ValidationErrors errors={validErrs} />

        {TAB_COMPONENTS[tab]}

        <NavigationButtons
          tab={tab}
          saving={saving}
          goTo={goTo}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
