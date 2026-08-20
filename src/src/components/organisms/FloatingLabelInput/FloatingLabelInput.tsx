import { NextPage } from "next";
import { Input, InputProps } from "@/components/atoms/Input/Input";
import { Label } from "@/components/atoms/Label/Label";



interface FloatingLabelInputProps extends InputProps {
    label: string;
    isFocused: boolean;
  }
  const FloatingLabelInput: NextPage<FloatingLabelInputProps> = ({
    label,
    isFocused,
    ...inputProps
  }) => (
    <div className="relative">
      <Label htmlFor={inputProps.id} text={label} isFocused={isFocused} />
      <Input {...inputProps} placeholder={isFocused ? inputProps.placeholder : ''} />
    </div>
  );


  export default FloatingLabelInput;