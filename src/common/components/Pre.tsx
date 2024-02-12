import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export type PreProps = HTMLAttributes<HTMLPreElement>;

export default function Pre({ className, ...props }: PreProps) {
  return (
    <pre
      className={twMerge(
        "whitespace-pre-wrap rounded border border-gray-400 bg-gray-800 p-2",
        className,
      )}
      {...props}
    />
  );
}
