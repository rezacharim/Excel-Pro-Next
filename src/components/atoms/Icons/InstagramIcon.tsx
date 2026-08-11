import { NextPage } from "next";
import { FaInstagram } from "react-icons/fa"

interface IIconSizeProps {
  size: number | string;
}

const InstagramIcon: NextPage<IIconSizeProps> = ({ size }) => {
  return (
    <>
        <FaInstagram size={size ? size : 18} />
    </>
  )
}

export default InstagramIcon;