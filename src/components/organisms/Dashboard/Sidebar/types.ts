import { ReactNode } from "react";

export interface NavigationItemsTypes {
    id: number;
    icon: ReactNode,
    label: string;
    active: boolean;
}