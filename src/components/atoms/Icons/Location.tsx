import { NextPage } from "next";
import { IoLocationOutline } from "react-icons/io5";

interface IIconSizeProps {
    size: number | string;
  }

const Location:NextPage<IIconSizeProps> = ({size}) => {
  return (
    <>
    <IoLocationOutline  size={size ? size : 18}/>
    </>
  )
}

export default Location;