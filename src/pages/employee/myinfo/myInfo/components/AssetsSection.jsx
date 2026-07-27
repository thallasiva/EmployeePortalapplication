import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { fmtDate } from "../utils";
import Field from "./Field";
import InfoCard from "./InfoCard";
import { Grid, SectionLabel } from "./Grid";

const AssetsSection = React.memo(function AssetsSection({ e }) {
  return (
    <div id="section-assets" className={cssClass({ marginTop: 8 })}>
      <InfoCard id="card-access-card-details" title="Access Card Details">
        {e.access_card_number ? (
          <Grid cols={2}>
            <Field label="Card No"  value={e.access_card_number} />
            <Field label="Validity" value={`${fmtDate(e.access_card_from_date)} – ${e.access_card_to_date ? fmtDate(e.access_card_to_date) : "ongoing"}`} />
            <div className={cssClass({ gridColumn: "1 / -1" })}>
              <SectionLabel label="Previous" />
              <p className={cssClass({ color: "#f18200", fontSize: 13, margin: 0 })}>No data Found.</p>
            </div>
          </Grid>
        ) : (
          <>
            <p className={cssClass({ color: "#94a3b8", fontSize: 13, margin: "0 0 12px" })}>No access card assigned.</p>
            <SectionLabel label="Previous" />
            <p className={cssClass({ color: "#f18200", fontSize: 13, margin: 0 })}>No data Found.</p>
          </>
        )}
      </InfoCard>
    </div>
  );
});

export default AssetsSection;
