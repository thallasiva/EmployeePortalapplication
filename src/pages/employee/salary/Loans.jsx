export default function Loans() {
  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {/* HEADER */}

      <div className="px-6 pt-5">
        <h1 className="text-[26px] font-semibold text-[#24324a]">
          Loans and Advances
        </h1>
      </div>

      {/* TAB */}

      <div className="mt-5 border-b border-[#d9e0ea]">
        <button
          className="
            h-[42px]
            px-6
            text-[#2563eb]
            text-[14px]
            font-medium
            border-b-2
            border-[#2563eb]
          "
        >
          My Loan
        </button>
      </div>

      {/* MAIN CONTENT */}

      <div
        className="
          h-[calc(100vh-150px)]
          flex
          items-center
          justify-center
        "
      >
        <div className="text-center">
          {/* IMAGE */}

          <div className="flex justify-center">
            <img
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' rx='8' fill='%23f1f5f9'/%3E%3Ctext x='24' y='30' text-anchor='middle' fill='%2364748b' font-size='20'%3E%E2%80%94%3C/text%3E%3C/svg%3E"
              alt="loan"
              className="w-[120px] opacity-90"
            />
          </div>

          {/* TITLE */}

          <h2
            className="
              mt-5
              text-[24px]
              font-medium
              text-[#374151]
            "
          >
            Nothing to show!
          </h2>

          {/* SUBTITLE */}

          <p
            className="
              mt-2
              text-[15px]
              text-[#94a3b8]
            "
          >
            Your loan details will show up here after
            approval.
          </p>
        </div>
      </div>

      {/* FOOTER */}

      <div
        className="
          fixed
          bottom-4
          left-0
          right-0
          flex
          justify-center
          text-[13px]
          text-[#94a3b8]
          gap-3
        "
      >
        <span>main-2242</span>

        <span>|</span>

        <button className="hover:text-[#2563eb]">
          Privacy Policy
        </button>

        <span>|</span>

        <button className="hover:text-[#2563eb]">
          Terms Of Service
        </button>
      </div>
    </div>
  );
}