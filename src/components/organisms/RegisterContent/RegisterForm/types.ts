import { ReactNode } from "react";

export interface StepType {
  number: number;
  title: string;
  subtitle: string;
  isLast: boolean;
  component?: ReactNode | JSX.Element;
};