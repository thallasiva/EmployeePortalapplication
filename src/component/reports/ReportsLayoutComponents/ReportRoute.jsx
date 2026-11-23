import React from "react";
import LazyPage from "../../../routes/LazyPage";
const ReportRoute = ({
  children
}) => <LazyPage label="Loading report...">{children}</LazyPage>;
export { ReportRoute };
