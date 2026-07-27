import React from "react";
import "../teams.css";
import CreateTeamModal from "../CreateTeamModal";
import { useTeams } from "./hooks/useTeams";
import TeamsHeader from "./components/TeamsHeader";
import TeamsStats from "./components/TeamsStats";
import TeamsGrid from "./components/TeamsGrid";
import TeamsComparison from "./components/TeamsComparison";

export default function Teams() {
  const {
    rows,
    loading,
    error,
    expandedId,
    modalOpen,
    setModalOpen,
    search,
    setSearch,
    allTeams,
    managerCount,
    handleCreateTeam,
    fetchData,
    toggleExpanded,
  } = useTeams();

  return (
    <div className="teams-page">
      <TeamsHeader
        search={search}
        onSearchChange={setSearch}
        onRefresh={fetchData}
        onCreateClick={() => setModalOpen(true)}
      />

      {!loading && !error && (
        <TeamsStats
          totalEmployees={rows.length}
          managerCount={managerCount}
          visibleCount={allTeams.length}
        />
      )}

      <TeamsGrid
        loading={loading}
        error={error}
        allTeams={allTeams}
        search={search}
        expandedId={expandedId}
        onToggle={toggleExpanded}
        onRetry={fetchData}
      />

      {!loading && (
        <TeamsComparison allTeams={allTeams} />
      )}

      <CreateTeamModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateTeam}
      />
    </div>
  );
}
