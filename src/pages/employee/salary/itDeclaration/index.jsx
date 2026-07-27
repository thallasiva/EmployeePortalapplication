import React, { useState } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { useITDeclaration } from "./hooks/useITDeclaration";

import DeclarationHeader from "./components/DeclarationHeader";
import LockedBanner from "./components/LockedBanner";
import StatusBanner from "./components/StatusBanner";
import DeclCard from "./components/DeclCard";
import ActionButtons from "./components/ActionButtons";

import Modal123 from "./components/Modal123";
import ModalCh8 from "./components/ModalCh8";
import ModalHRA from "./components/ModalHRA";
import ModalMedical from "./components/ModalMedical";
import ModalHouseProperty from "./components/ModalHouseProperty";
import ModalOtherIncome from "./components/ModalOtherIncome";
import ModalTcsTds from "./components/ModalTcsTds";

export default function ITDeclaration() {
  const [openModal, setOpenModal] = useState(null);

  const {
    loading,
    saving,
    cycle,
    declaration,
    status,
    isLocked,
    isReadOnly,
    annualHRA,
    annualGross,
    vals123, setVals123,
    valsCh8, setValsCh8,
    hraData, setHraData,
    medVals, setMedVals,
    houseData, setHouseData,
    selfOccupied, setSelfOccupied,
    incomes, setIncomes,
    tcsTds, setTcsTds,
    declared123,
    declaredCh8,
    declaredHRA,
    declaredMed,
    declaredHouse,
    declaredIncome,
    declaredTcsTds,
    totalDeclared,
    handleSave,
  } = useITDeclaration();

  if (loading) {
    return (
      <div className={cssClass({ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 })}>
        Loading…
      </div>
    );
  }

  const CARDS = [
    { key: "123", icon: "📊", title: "Tax-Saving Investments (80C / 80CCD)", declared: declared123 || null },
    { key: "ch8", icon: "📋", title: "Other Deductions (80D / 80E / 80G)", declared: declaredCh8 || null },
    { key: "hra", icon: "🏠", title: "HRA Exemption (Sec. 10(13A))", declared: declaredHRA || null },
    { key: "med", icon: "🏥", title: "Medical & Health Benefits (Sec. 80D)", declared: declaredMed || null },
    { key: "house", icon: "🏡", title: "House Property Income / Loss (Sec. 24)", declared: declaredHouse },
    { key: "income", icon: "💰", title: "Other Sources of Income", declared: declaredIncome || null },
    { key: "tcs", icon: "📄", title: "Tax Credits — TDS / TCS", declared: declaredTcsTds || null },
  ];

  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f5f7fb", padding: 24 })}>
      <DeclarationHeader cycle={cycle} totalDeclared={totalDeclared} annualGross={annualGross} />

      {isLocked && <LockedBanner />}

      <StatusBanner
        declaration={declaration}
        status={status}
        onEditResubmit={() => handleSave(false)}
      />

      {}
      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, opacity: isReadOnly ? 0.7 : 1 })}>
        {CARDS.map((card) => (
          <DeclCard
            key={card.key}
            icon={card.icon}
            title={card.title}
            declared={card.declared}
            onClick={() => !isLocked && !isReadOnly && setOpenModal(card.key)}
            locked={isLocked || isReadOnly}
          />
        ))}
      </div>

      {}
      {!isLocked && !isReadOnly && (
        <ActionButtons
          saving={saving}
          totalDeclared={totalDeclared}
          onSaveDraft={() => handleSave(false)}
          onSubmit={() => handleSave(true)}
        />
      )}

      {}
      {openModal === "123" && (
        <Modal123 values={vals123} setValues={setVals123} onClose={() => setOpenModal(null)} />
      )}
      {openModal === "ch8" && (
        <ModalCh8 values={valsCh8} setValues={setValsCh8} onClose={() => setOpenModal(null)} />
      )}
      {openModal === "hra" && (
        <ModalHRA hraData={hraData} setHraData={setHraData} annualHraReceived={annualHRA} onClose={() => setOpenModal(null)} />
      )}
      {openModal === "med" && (
        <ModalMedical values={medVals} setValues={setMedVals} onClose={() => setOpenModal(null)} />
      )}
      {openModal === "house" && (
        <ModalHouseProperty
          houseData={houseData}
          setHouseData={setHouseData}
          selfOccupied={selfOccupied}
          setSelfOccupied={setSelfOccupied}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "income" && (
        <ModalOtherIncome incomes={incomes} setIncomes={setIncomes} onClose={() => setOpenModal(null)} />
      )}
      {openModal === "tcs" && (
        <ModalTcsTds values={tcsTds} setValues={setTcsTds} onClose={() => setOpenModal(null)} />
      )}
    </div>
  );
}
