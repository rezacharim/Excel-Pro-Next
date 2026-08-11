import { NextPage } from "next";
import { Label } from "@/components/atoms/Label/Label";
import { Textarea, TextareaProps } from "@/components/atoms/Textarea/Textarea";

interface FloatingLabelTextareaProps extends TextareaProps {
    label: string;
    isFocused: boolean;
  }
  const FloatingLabelTextarea: NextPage<FloatingLabelTextareaProps> = ({
    label,
    isFocused,
    ...textareaProps
  }) => (
    <div className="relative">
      <Label htmlFor={textareaProps.id} text={label} isFocused={isFocused} />
      <Textarea {...textareaProps} />
    </div>
  );
  

  export default FloatingLabelTextarea;