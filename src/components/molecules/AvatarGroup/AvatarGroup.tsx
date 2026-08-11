import Avatar from './../../atoms/Avatar/Avatar';

type AvatarGroupProps = {
  members: { src: string; alt: string }[];
  extraCount?: number;
};

const AvatarGroup: React.FC<AvatarGroupProps> = ({ members, extraCount }) => (
  <div className="flex -space-x-2">
    {members.map((member, index) => (
      <Avatar key={index} src={member.src} alt={member.alt} />
    ))}
    {extraCount && (
      <div className="w-11 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
        +{extraCount}
      </div>
    )}
  </div>
);
export default AvatarGroup;