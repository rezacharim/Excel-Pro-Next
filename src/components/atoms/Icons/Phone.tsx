import { NextPage } from "next";
import { FaPhoneAlt } from "react-icons/fa";

interface IIconSizeProps {
    size: number | string;
  }

const PhoneIcon:NextPage<IIconSizeProps> = ({size}) => {
  return (
    <>
    <FaPhoneAlt  size={size ? size : 18}/>
    </>
  )
}

export default PhoneIcon;