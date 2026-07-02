function Btn({ children, primary, small, onClick, type = "button" })
{
  return (
    <button
      type={type}
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 rounded-lg font-semibold transition-all duration-200",
        primary 
          ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:shadow-lg hover:scale-105 active:scale-95" 
          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400",
        small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default Btn;