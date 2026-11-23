import React from "react";
import { GitBranch, Search, RefreshCw, X, ArrowRight } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../../constants/tabs";
import { statusColor } from "../../utils/formatters";
import OrgChart from ".././OrgChart";
/**
 * The main org-chart block shown in the Overview tab.
 * Includes legend/search header, the SVG chart (or focused-path view),
 * and the employee search sidebar.
 */
import { FocusedPathView } from "./FocusedPathView";
/**
 * The main org-chart block shown in the Overview tab.
 * Includes legend/search header, the SVG chart (or focused-path view),
 * and the employee search sidebar.
 */
const OrgChartWithSidebar = React.memo(function OrgChartWithSidebar({
  loading,
  visibleTree,
  highlightIds,
  setHighlightIds,
  setSelectedNode,
  treeSearch,
  setTreeSearch,
  searchQ,
  setSearchQ,
  searching,
  searchResults,
  focusedPath,
  setFocusedPath
}) {
  return <div className={cssClass({
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16
  })}>
      {/* Header */}
      <div className={cssClass({
      padding: "14px 16px",
      borderBottom: "1px solid #f3f4f6",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 10
    })}>
        <div className={cssClass({
        display: "flex",
        alignItems: "center",
        gap: 8
      })}>
          <GitBranch size={16} color={BRAND} />
          <span className={cssClass({
          fontSize: 14,
          fontWeight: 700,
          color: "#111827"
        })}>Organisation Chart</span>
        </div>
        <div className={cssClass({
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap"
      })}>
          {[["#c45f00", "Top Level"], ["#e87500", "Manager"], ["#fb923c", "Employee"], ["#d97706", "Delegated"], ["#9ca3af", "Inactive"]].map(([c, l]) => <div key={l} className={cssClass({
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11,
          color: "#6b7280"
        })}>
              <div className={cssClass({
            width: 10,
            height: 10,
            borderRadius: 2,
            background: c
          })} />{l}
            </div>)}
          <div className={cssClass({
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 7,
          padding: "5px 10px"
        })}>
            <Search size={12} color="#9ca3af" />
            <input value={treeSearch} onChange={e => setTreeSearch(e.target.value)} placeholder="Filter chart…" className={cssClass({
            border: "none",
            background: "none",
            outline: "none",
            fontSize: 12,
            width: 100
          })} />
            {treeSearch && <button onClick={() => setTreeSearch("")} className={cssClass({
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9ca3af",
            padding: 0
          })}>
                <X size={11} />
              </button>}
          </div>
        </div>
      </div>
      {/* Body: chart + sidebar */}
      <div className={cssClass({
      display: "flex",
      background: "#f8fafc",
      minHeight: 360
    })}>
        {/* Chart area */}
        <div className={cssClass({
        flex: 1,
        minWidth: 0,
        overflowX: "auto",
        overflowY: "auto",
        maxHeight: "65vh",
        padding: 16
      })}>
          {loading ? <div className={cssClass({
          textAlign: "center",
          padding: 60,
          color: "#9ca3af"
        })}>
              <RefreshCw size={20} className={cssClass({
            animation: "spin 1s linear infinite"
          })} />
              <div className={cssClass({
            marginTop: 8,
            fontSize: 13
          })}>Loading chart…</div>
            </div> : focusedPath ? <FocusedPathView focusedPath={focusedPath} setFocusedPath={setFocusedPath} /> : visibleTree.length === 0 ? <div className={cssClass({
          textAlign: "center",
          padding: 60,
          color: "#9ca3af",
          fontSize: 13
        })}>
              {treeSearch ? "No matching employees" : "No data — restart the backend to auto-seed hierarchy"}
            </div> : <OrgChart nodes={visibleTree} onSelect={setSelectedNode} highlightIds={highlightIds} />}
        </div>
        {/* Search sidebar */}
        <div className={cssClass({
        width: 280,
        flexShrink: 0,
        borderLeft: "1px solid #e5e7eb",
        padding: 16,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 10
      })}>
          <div className={cssClass({
          fontSize: 13,
          fontWeight: 700,
          color: "#111827",
          display: "flex",
          alignItems: "center",
          gap: 8
        })}>
            <Search size={15} color={BRAND} /> Find Employee
          </div>
          <div className={cssClass({
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "8px 10px"
        })}>
            <Search size={13} color="#9ca3af" className={cssClass({
            flexShrink: 0
          })} />
            <input value={searchQ} onChange={e => {
            setSearchQ(e.target.value);
            if (!e.target.value) {
              setFocusedPath(null);
            }
          }} placeholder="Name, code, email…" className={cssClass({
            border: "none",
            background: "none",
            outline: "none",
            fontSize: 12,
            flex: 1,
            minWidth: 0
          })} />
            {searching && <RefreshCw size={13} color={BRAND} className={cssClass({
            animation: "spin 1s linear infinite",
            flexShrink: 0
          })} />}
            {searchQ && !searching && <button onClick={() => {
            setSearchQ("");
            setFocusedPath(null);
          }} className={cssClass({
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9ca3af",
            padding: 0
          })}>
                <X size={13} />
              </button>}
          </div>
          <div className={cssClass({
          flex: 1,
          overflowY: "auto"
        })}>
            {searchResults.length > 0 ? <div className={cssClass({
            display: "flex",
            flexDirection: "column",
            gap: 8
          })}>
                {searchResults.map(r => <div key={r.employee_id} onClick={() => {
              const path = r.hierarchy_path || [];
              setFocusedPath({
                main: path[0] || null,
                manager: path.length >= 2 ? path[path.length - 2] : null,
                employee: path[path.length - 1] || {
                  id: r.employee_id,
                  name: r.full_name
                },
                raw: r
              });
              setHighlightIds(new Set());
            }} className={cssClass({
              border: `2px solid ${focusedPath?.raw?.employee_id === r.employee_id ? BRAND : "#e5e7eb"}`,
              borderRadius: 10,
              padding: "10px 12px",
              cursor: "pointer",
              background: focusedPath?.raw?.employee_id === r.employee_id ? "#fff8f0" : "#fff",
              transition: "all .15s"
            })}>
                    <div className={cssClass({
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 6
              })}>
                      <div className={cssClass({
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#111827",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                })}>
                        {r.full_name}
                      </div>
                      <span className={cssClass({
                  ...statusColor(r.employee_status),
                  borderRadius: 5,
                  padding: "1px 6px",
                  fontSize: 10,
                  fontWeight: 600,
                  flexShrink: 0
                })}>
                        {r.employee_status}
                      </span>
                    </div>
                    <div className={cssClass({
                fontSize: 10,
                color: "#6b7280",
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              })}>
                      {r.designation_name || "—"} · {r.department_name || "—"}
                    </div>
                    <div className={cssClass({
                marginTop: 4,
                fontSize: 10,
                color: BRAND,
                fontWeight: 600
              })}>
                      Click to view hierarchy <ArrowRight size={12} className="inline -mt-0.5" />
                    </div>
                  </div>)}
              </div> : searchQ && !searching ? <div className={cssClass({
            textAlign: "center",
            padding: "14px 0",
            color: "#9ca3af",
            fontSize: 12
          })}>
                No results found
              </div> : <div className={cssClass({
            textAlign: "center",
            padding: "24px 0",
            color: "#d1d5db"
          })}>
                <Search size={28} className={cssClass({
              margin: "0 auto 8px",
              display: "block",
              opacity: 0.4
            })} />
                <div className={cssClass({
              fontSize: 12
            })}>Search to find an employee<br />and view their hierarchy</div>
              </div>}
          </div>
        </div>
      </div>
    </div>;
});
/** Inline mini-SVG showing the focused path (main → manager → employee). */
export { OrgChartWithSidebar };
