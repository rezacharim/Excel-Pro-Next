import { NextPage } from "next";
import { FaFacebook } from "react-icons/fa";

interface IIconSizeProps {
  size: number | string;
}

const Facebook:NextPage<IIconSizeProps> = ({ size }) => {
  return (
    <>
    <FaFacebook size={size ? size : 18}/>
    </>
  )
}

export default Facebook;