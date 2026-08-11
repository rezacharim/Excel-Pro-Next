import { NextPage } from "next";
import FAQItem from "@/components/atoms/FAQItem/FAQItem";

interface FAQListProps {
    data: {
        id: number;
        question: string;
        answer: string;
    }[];
    openItemId: number | null;
    toggleItem: (id: number) => void;
}

const FAQList:NextPage<FAQListProps> = ({ data, openItemId, toggleItem }) => (
  <>
    {data.map((item) => (
      <FAQItem
        key={item.id}
        question={item.question}
        answer={item.answer}
        isOpen={openItemId === item.id}
        toggleOpen={() => toggleItem(item.id)}
      />
    ))}
  </>
);

export default FAQList;