import { URGENCY_OPTIONS, IMPACT_OPTIONS, SERVICES_OPTIONS } from "./categories";

/**
 * Per-topic form field configuration.
 * Each entry maps a topic id → its field definitions.
 * Fields without an entry get the DEFAULT_FIELDS fallback.
 */
export const TOPIC_CONFIG = {
  exit: {
    fields: [
      { key: "end_date", label: "Employee End date", type: "datetime", required: true },
      { key: "desc",     label: "Description",       type: "richtext" },
    ],
  },
  new_acc: {
    summaryHint: "e.g. Create an account on Jira",
    fields: [
      {
        key: "system", label: "Select a system", type: "select", required: true,
        options: ["", "Jira", "Confluence", "Slack", "GitHub", "Google Workspace",
          "Microsoft 365", "Salesforce", "SAP", "ServiceNow", "Other"],
      },
      { key: "desc", label: "Tell us why you need an account", type: "richtext" },
    ],
  },
  fix_acc:   { fields: [{ key: "desc", label: "Description", type: "richtext" }] },
  wifi: {
    fields: [
      { key: "desc",         label: "Description",       type: "richtext" },
      { key: "arrival_date", label: "Guest arrival date", type: "date" },
    ],
  },
  vpn:       { fields: [{ key: "desc", label: "Description", type: "richtext" }] },
  admin_acc: { fields: [{ key: "desc", label: "Description", type: "richtext" }] },
  onboard: {
    summaryHint: "e.g. Joseph Wilson starts on September 1",
    fields: [
      { key: "start_date", label: "Employee start date", type: "date",
        note: "If you are not sure of the exact date, put in a tentative one." },
    ],
  },
  network: {
    fields: [
      { key: "desc",              label: "Description",      type: "richtext" },
      { key: "affected_services", label: "Affected services", type: "searchselect",
        placeholder: "Search for services", options: SERVICES_OPTIONS },
    ],
    afterFields: [
      { key: "urgency", label: "How urgently does this need to be fixed?",                   type: "select", options: URGENCY_OPTIONS },
      { key: "impact",  label: "How big of an impact is the problem to you or the organization?", type: "select", options: IMPACT_OPTIONS },
    ],
  },
  server: {
    summaryLabel: "Summarize the problem",
    fields: [
      { key: "desc",              label: "Describe what happened and how it occurred", type: "richtext", required: true },
      { key: "affected_services", label: "Affected services", type: "searchselect",
        placeholder: "Search for services", options: SERVICES_OPTIONS },
    ],
    afterFields: [
      { key: "urgency", label: "How urgently does this need to be fixed?",                   type: "select", options: URGENCY_OPTIONS },
      { key: "impact",  label: "How big of an impact is the problem to you or the organization?", type: "select", options: IMPACT_OPTIONS },
    ],
  },
  hardware2: {
    summaryLabel: "Summarize the problem",
    fields: [
      { key: "desc",              label: "Describe what happened and how it occurred", type: "richtext", required: true },
      { key: "affected_hardware", label: "Affected hardware", type: "text" },
    ],
    afterFields: [
      { key: "urgency", label: "How urgently does this need to be fixed?",                   type: "select", options: URGENCY_OPTIONS },
      { key: "impact",  label: "How big of an impact is the problem to you or the organization?", type: "select", options: IMPACT_OPTIONS },
    ],
  },
};

export const DEFAULT_FIELDS = [{ key: "desc", label: "Description", type: "richtext" }];
