import { ReactNode } from 'react';
import { NextPage } from 'next';
import Header from '../../organisms/RegisterContent/Header/Header';
import Footer from '../../organisms/RegisterContent/Footer/Footer';

const Layout: NextPage<{ children: ReactNode }> = ({ children }) => {
    return (
        <>
            <header>
                <Header />
            </header>
            {children}
            <footer>
                <Footer />
            </footer>
        </>
    )
}

export default Layout;