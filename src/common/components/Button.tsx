import { ButtonHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ className, ...props }: ButtonProps) {
  return (
    <button
      className={twMerge(
        "h-10 min-w-20 rounded bg-gray-300 px-2 text-gray-700 enabled:hover:bg-gray-200 enabled:hover:text-gray-600 enabled:active:bg-gray-100 enabled:active:text-gray-500 disabled:opacity-25",
        className,
      )}
      {...props}
    />
  );
}
