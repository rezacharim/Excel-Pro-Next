import { ReactNode } from "react";

export interface ProgramTag {
    icon: JSX.Element | ReactNode |null;
    text: string;
    className: string;
}

export interface ProgramType {
    ageGroup: string;
    title: string;
    backgroundClass: string;
    textColorClass: string;
    schedule: string[];
    gameInfo: string;
    tag: {
      icon: React.ReactNode | null;
      text: string;
      className: string;
    };
    imageSrc: string;
    team_image: string; 
    description: string;
    programOutline: {
        description: string;
        additionalDetails?: string;
    },
    playerUniformsEquipment: string;    
  }
  