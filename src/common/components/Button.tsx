import { ButtonHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ className, ...props }: ButtonProps) {
  return (
    <button
      className={twMerge(
        "h-10 min-w-20 rounded bg-gray-300 px-2 text-gray-700 hover:bg-gray-200 hover:text-gray-600 active:bg-gray-100 active:text-gray-500",
        className,
      )}
      {...props}
    />
  );
}
