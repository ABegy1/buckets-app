"use client"
import styles from "./Header.module.css"

import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image'
import bucketsLogo from "@/assets/images/buckets.png"
import scoreLogo from "@/assets/images/add.png" 
import standingsLogo from "@/assets/images/speedometer.png"
import freeAgencyLogo from "@/assets/images/bench.png"
import rulesLogo from "@/assets/images/document.png"
import statsLogo from "@/assets/images/analytics.png"
import userLogo from "@/assets/images/user.png" 
import adminLogo from "@/assets/images/administrator.png" 


export default function Header() {

    const router = useRouter(); // Router for navigation
    const pathname = usePathname(); // Current pathname of the app

    /**
     * Navigates to a different page based on the provided route.
     * @param page The route to navigate to.
     */
    const handleNavigation = (page: string) => {
        router.push(`/${page}`);
        };
    
    
    return(

        <header className={styles.navbar}>
            <div className={styles.navMenu}>
                <Image className={`${styles.navItem} invert`} 
                            src={bucketsLogo}
                            alt='Buckets!'
                            width="75"
                            height="75"
                >
                </Image>
                <h1 className={`${styles.navbarTitle}`}>Buckets</h1>
            </div>
            <nav className={styles.navMenu}>
                {/* Navigation Buttons */}
                <div className="relative group">
                    <Image
                        data-tooltip="Score"
                        data-tooltip-loc="below"
                        className={`${styles.navItem} ${pathname === '/Admin' ? styles.active : ''} invert`}
                        src={scoreLogo}
                        alt='Score'
                        width="65"
                        height="65"
                        onClick={() => handleNavigation('Admin')}>
                    </Image>
                </div>
                <Image 
                    data-tooltip="Standings"
                    data-tooltip-loc="below"
                    className={`${styles.navItem} ${pathname === '/Standings' ? styles.active : ''} invert`} 
                    src={standingsLogo}
                    alt='Standings'
                    width="65"
                    height="65"
                    onClick={() => handleNavigation('Standings')}>
                </Image>
                <Image 
                    data-tooltip="Free Agency"
                    data-tooltip-loc="below"
                    className={`${styles.navItem} ${pathname === '/FreeAgency' ? styles.active : ''} invert`} 
                    src={freeAgencyLogo}
                    alt='Free Agency'
                    width="65"
                    height="65"
                    onClick={() => handleNavigation('FreeAgency')}>
                </Image>
                <Image 
                    data-tooltip="Rules"
                    data-tooltip-loc="below"
                    className={`${styles.navItem} ${pathname === '/Rules' ? styles.active : ''} invert`} 
                    src={rulesLogo}
                    alt='Rules'
                    width="65"
                    height="65"
                    onClick={() => handleNavigation('Rules')}>
                </Image>
                <Image
                    data-tooltip="Stats"
                    data-tooltip-loc="below" 
                    className={`${styles.navItem} ${pathname === '/Stats' ? styles.active : ''} invert`} 
                    src={statsLogo}
                    alt='Stats'
                    width="65"
                    height="65"
                    onClick={() => handleNavigation('Stats')}>
                </Image>
                {/* <Image 
                    data-tooltip="User"
                    data-tooltip-loc="below"
                    className={`${styles.navItem} ${pathname === '/User' ? styles.active : ''} invert`} 
                    src={userLogo}
                    alt='Stats'
                    width="65"
                    height="65">
                </Image> */}
                <Image 
                    data-tooltip="Admin"
                    data-tooltip-loc="below"
                    className={`${styles.navItem} ${pathname === '/Admin' ? styles.active : ''} invert`} 
                    src={adminLogo}
                    alt='Admin'
                    width="65"
                    height="65"
                    onClick={() => handleNavigation('Admin')}>
                </Image>
            </nav>
        </header>
    );
}