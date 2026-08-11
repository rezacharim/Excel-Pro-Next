import { NextPage } from 'next';
import Image from 'next/image';

interface ImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

const AtomImage: NextPage<ImageProps> = ({ src, alt, width, height, className }) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
};

export default AtomImage;