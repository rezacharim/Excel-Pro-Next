import { forwardRef } from "react";

export interface TextareaProps {
    id: string;
    name: string;
    rows: number;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onFocus: () => void;
    onBlur: () => void;
  }
  export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ id, name, rows, value, onChange, onFocus, onBlur }, ref) => (
      <textarea
        ref={ref}
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none"
      ></textarea>
    )
  );
  Textarea.displayName = 'Textarea';