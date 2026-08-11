import Image from "next/image"
import LogoImage from "@/../public/images/logo/excelpro_logo.png"

const Logo = () => {
  return (
    <>
        <Image 
        src={LogoImage}
        alt="Excel Pro Soccer Academy Markham logo"
        width={42}
        height={42}
        className="h-11 w-auto"
        />
    </>
  )
}

export default Logo