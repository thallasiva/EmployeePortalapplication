import React from "react";
import { VIEW } from "./constants";
import { useDocumentCenter } from "./hooks/useDocumentCenter";
import HomeView from "./components/HomeView";
import DocumentsView from "./components/DocumentsView";
import PayslipsView from "./components/PayslipsView";
import PoliciesView from "./components/PoliciesView";
import Form16View from "./components/Form16View";
import FormsView from "./components/FormsView";
import LettersView from "./components/LettersView";

export default function DocumentCenter() {
  const {
    view, setView,
    docSectionOpen, setDocSectionOpen,
    payslipYearOpen, setPayslipYearOpen,
    payslipMonthOpen, togglePayslipMonth,
    policyOpen, setPolicyOpen,
    policyDetailOpen, setPolicyDetailOpen,
    form16YearOpen, setForm16YearOpen,
    formSectionOpen, setFormSectionOpen,
    letterSectionOpen, setLetterSectionOpen,
    myDocs, docsLoading, joiningDocs, docsByCategory, payslipByYear,
    jumpToSection,
    handleViewPayslip, handleDownloadPayslip
  } = useDocumentCenter();

  if (view === VIEW.HOME) {
    return <HomeView setView={setView} />;
  }

  if (view === VIEW.DOCUMENTS) {
    return (
      <DocumentsView
        myDocs={myDocs} docsLoading={docsLoading}
        joiningDocs={joiningDocs} docsByCategory={docsByCategory}
        docSectionOpen={docSectionOpen} setDocSectionOpen={setDocSectionOpen} />
    );
  }

  if (view === VIEW.PAYSLIPS) {
    return (
      <PayslipsView
        payslipByYear={payslipByYear}
        payslipYearOpen={payslipYearOpen} setPayslipYearOpen={setPayslipYearOpen}
        payslipMonthOpen={payslipMonthOpen} togglePayslipMonth={togglePayslipMonth}
        jumpToSection={jumpToSection}
        handleViewPayslip={handleViewPayslip} handleDownloadPayslip={handleDownloadPayslip} />
    );
  }

  if (view === VIEW.POLICIES) {
    return (
      <PoliciesView
        joiningDocs={joiningDocs}
        policyOpen={policyOpen} setPolicyOpen={setPolicyOpen}
        policyDetailOpen={policyDetailOpen} setPolicyDetailOpen={setPolicyDetailOpen}
        jumpToSection={jumpToSection}
        handleViewPayslip={handleViewPayslip} handleDownloadPayslip={handleDownloadPayslip} />
    );
  }

  if (view === VIEW.FORM16) {
    return (
      <Form16View
        form16YearOpen={form16YearOpen} setForm16YearOpen={setForm16YearOpen}
        jumpToSection={jumpToSection} />
    );
  }

  if (view === VIEW.FORMS) {
    return (
      <FormsView
        formSectionOpen={formSectionOpen} setFormSectionOpen={setFormSectionOpen}
        jumpToSection={jumpToSection} />
    );
  }

  return (
    <LettersView
      letterSectionOpen={letterSectionOpen} setLetterSectionOpen={setLetterSectionOpen}
      jumpToSection={jumpToSection} />
  );
}
