import React, { useState, useCallback, useMemo } from "react";
import "../orgChart.css";
import { cssClass } from "../../../../utils/classStyles";
import { useOrgChart } from "./hooks/useOrgChart";
import OrgToolbar from "./components/OrgToolbar";
import Legend from "./components/Legend";
import OrgCanvas from "./components/OrgCanvas";

const OrganizationChart = React.memo(function OrganizationChart() {
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(100);
  const [expandedLevels, setExpandedLevels] = useState(0);

  const {
    selfEmp, selfId, manager, team,
    ancestorChain, depts, selfDirectReports,
    loading, error,
  } = useOrgChart();

  const visibleAncestors = useMemo(
    () => ancestorChain.slice(Math.max(0, ancestorChain.length - expandedLevels)),
    [ancestorChain, expandedLevels],
  );
  const canExpandMore = expandedLevels < ancestorChain.length;

  const onExpand = useCallback(
    () => setExpandedLevels((l) => Math.min(l + 1, ancestorChain.length)),
    [ancestorChain.length],
  );
  const onCollapse = useCallback(() => setExpandedLevels((l) => Math.max(0, l - 1)), []);
  const onExpandToOne = useCallback(() => setExpandedLevels(1), []);
  const onZoomIn = useCallback(() => setZoom((z) => Math.min(160, z + 10)), []);
  const onZoomOut = useCallback(() => setZoom((z) => Math.max(40, z - 10)), []);
  const onZoomReset = useCallback(() => setZoom(100), []);

  return (
    <div className={cssClass({
      height: "calc(100vh - 4.25rem)", background: "#f5f7fb",
      display: "flex", flexDirection: "column", padding: "12px 16px 8px",
      overflow: "hidden",
    })}>
      <OrgToolbar
        manager={manager}
        search={search}
        onSearch={setSearch}
        zoom={zoom}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onZoomReset={onZoomReset}
      />

      {!loading && !error && <Legend depts={depts} />}

      <OrgCanvas
        loading={loading}
        error={error}
        selfEmp={selfEmp}
        manager={manager}
        selfDirectReports={selfDirectReports}
        selfId={selfId}
        team={team}
        visibleAncestors={visibleAncestors}
        ancestorChain={ancestorChain}
        canExpandMore={canExpandMore}
        onExpand={onExpand}
        onCollapse={onCollapse}
        onExpandToOne={onExpandToOne}
        zoom={zoom}
        search={search}
      />

      <p className={cssClass({ fontSize: 10, color: "#94a3b8", textAlign: "center", margin: "6px 0 0", flexShrink: 0 })}>
        {manager ? (
          <>
            Click <strong>View Reporting Manager</strong> to navigate up ·{" "}
            Use <strong>+</strong> / <strong>−</strong> to expand or collapse the upper hierarchy
          </>
        ) : (
          <>Your team is shown below your card</>
        )}
      </p>
    </div>
  );
});

export default OrganizationChart;
