import { InputHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={twMerge(
        "h-8 rounded bg-gray-50 px-2 text-gray-900",
        className,
      )}
      {...props}
    />
  );
}
