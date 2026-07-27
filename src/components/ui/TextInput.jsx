const baseClassName = "box-border w-full rounded-[7px] border border-gray-300 px-[11px] py-2 text-[13px] text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-50";

export function TextInput({ className = "", ...props })
{
  return <input className={`${baseClassName} bg-white ${className}`} {...props} />;
}

export function SelectInput({ className = "", children, ...props })
{
  return <select className={`${baseClassName} cursor-pointer bg-white ${className}`} {...props}>{children}</select>;
}

export function TextareaInput({ className = "", ...props })
{
  return <textarea className={`${baseClassName} resize-y bg-white leading-relaxed ${className}`} {...props} />;
}
