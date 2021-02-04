import React, { useEffect, useState } from "react";

export default () => {
  const [s, setS] = useState("123");
  useEffect(() => {
    if (s !== "12345") {
      setS("12345");
    }
  });
  return (
    <div>
      <button>{s}</button>
      <div>
        {typeof navigator !== "undefined"
          ? navigator.userAgent
          : "ssr has no navigator"}
      </div>
    </div>
  );
};
