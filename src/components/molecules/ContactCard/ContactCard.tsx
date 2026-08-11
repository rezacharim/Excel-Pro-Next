// components/molecules/ContactCard.tsx
import Image from "next/image";

type ContactCardProps = {
  iconSrc: string;
  title: string;
  content: string;
};

const ContactCard = ({ iconSrc, title, content }: ContactCardProps) => {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center w-[80px] h-[80px] rounded-full overflow-hidden bg-white mb-4 shadow-sm">
        <Image
          src={iconSrc}
          alt={`${title} Icon`}
          width={35}
          height={35}
          className="object-contain"
        />
      </div>
      <p className="my-2 font-bold text-black">{title}</p>
      <p className="my-2 font-medium text-gray-600 text-center px-2 break-words">{content}</p>
    </div>
  );
};

export default ContactCard;