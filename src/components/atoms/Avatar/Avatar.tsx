import { NextPage } from "next";
import Image from "next/image";

type AvatarProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

const Avatar: NextPage<AvatarProps> = ({ src, alt, width=32, height=32 }) => (
  <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
    <Image src={src} width={width} height={height} alt={alt} className="w-full h-full object-cover" />
  </div>
);
export default Avatar;