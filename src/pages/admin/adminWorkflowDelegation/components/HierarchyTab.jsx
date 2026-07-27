import React from "react";
import { RefreshCw } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { Btn } from "./SharedUI";
import ChartPanel from "./ChartPanel";

const HierarchyTab = React.memo(function HierarchyTab({
  loadTree,
  loading,
  visibleTree,
  highlightIds,
  setSelectedNode,
  treeSearch,
  setTreeSearch,
}) {
  return (
    <div>
      <div className={cssClass({ display: "flex", justifyContent: "flex-end", marginBottom: 12 })}>
        <Btn onClick={loadTree} variant="ghost" style={{ padding: "7px 14px" }}>
          <RefreshCw size={14} /> Refresh Chart
        </Btn>
      </div>
      <ChartPanel
        loading={loading}
        visibleTree={visibleTree}
        highlightIds={highlightIds}
        setSelectedNode={setSelectedNode}
        searchVal={treeSearch}
        onSearchChange={setTreeSearch}
      />
    </div>
  );
});

export default HierarchyTab;
