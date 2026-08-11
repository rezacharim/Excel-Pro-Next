import { NextPage } from "next";
import { FaEnvelope } from "react-icons/fa";

interface IIconSizeProps {
    size: number | string;
  }

const EmailIcon:NextPage<IIconSizeProps> = ({size}) => {
  return (
    <>
    <FaEnvelope  size={size ? size : 18}/>
    </>
  )
}

export default EmailIcon;