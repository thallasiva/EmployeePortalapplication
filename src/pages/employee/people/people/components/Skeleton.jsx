import React from "react";

const Skeleton = React.memo(function Skeleton({ w = "100%", h = 14, r = 6, mb = 0 }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: "#f1f5f9",
        marginBottom: mb,
        flexShrink: 0,
      }}
    />
  );
});

export default Skeleton;
