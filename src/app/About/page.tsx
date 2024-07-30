'use client';
import React, { useEffect, useState } from 'react';
import styles from './about.module.css';
import Modal from '@/components/Modal/Modal';
import Sidebar from '@/components/Sidebar/Sidebar';
import CurrentSeasonModal from '@/components/CurrentSeason/CurrentSeasonModal';
import NextSeasonModal from '@/components/NextSeason/NextSeason';
import { supabase } from '@/supabaseClient';
import { User } from '@supabase/supabase-js';


const useUserView = (fullName: string) => {
  const [view, setView] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch(`/api/addUser?full_name=${encodeURIComponent(fullName)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user role');
        }
        const data = await response.json();
        console.log(data)
        setView(data.view);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [fullName]);

  return { view, loading };
};

const About = () => {
  const [user, setUser] = useState<User | null>(null);
  

  useEffect(() => {
    const getUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);


  const { view } = useUserView(user?.user_metadata.full_name ?? '');


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCurrentSeasonModalOpen, setIsCurrentSeasonModalOpen] = useState(false);
  const [isNextSeasonModalOpen, setIsNextSeasonModalOpen] = useState<boolean>(false);

  const handleOpenModal = (name: string) => {
    setSelectedName(name);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleStandings = async () => {

    let newView;
if (view) {
  
  if (view === 'Standings') {
    newView = 'Agent';
  } else if (view === 'Agent') {
    newView = 'Standings';
  }
  console.log(newView);
  // try {
  //   if (user) {
  //     const response = await fetch('/api/addUser', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ name: user.user_metadata.full_name, view: newView }),
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to update user view');
  //     }
  //   }
  // } catch (error) {
  //   console.error(error);
  // }
};

}
   
    

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleOpenCurrentSeasonModal = () => {
    setIsCurrentSeasonModalOpen(true);
    setIsSidebarOpen(false);
  };

  const handleCloseCurrentSeasonModal = () => {
    setIsCurrentSeasonModalOpen(false);
  };

  const handleOpenNextSeasonModal = () => {
    setIsNextSeasonModalOpen(true);
    setIsCurrentSeasonModalOpen(false);
  };

  const handleCloseNextSeasonModal = () => {
    setIsNextSeasonModalOpen(false);
  };

  const handleStartSeason = () => {
    console.log("Start Season clicked");
    setIsNextSeasonModalOpen(false);
  };

  return (
    <div className={styles.aboutPage}>
      <div className={styles.container}>
        <div className={styles.secondaryScreenOptions}>
          <button className={styles.button} onClick={handleOpenSidebar}>Settings</button>
          <button className={styles.button} onClick={handleStandings}>Standings</button>
        </div>

        <div className={styles.players}>
          <div className={styles.column}>
            <div className={styles.header}>Green</div>
            <div className={styles.box} onClick={() => handleOpenModal('Stephen')}>Stephen</div>
            <div className={styles.box} onClick={() => handleOpenModal('David')}>David</div>
            <div className={styles.box} onClick={() => handleOpenModal('Brandon')}>Brandon</div>
          </div>
          <div className={styles.column}>
            <div className={styles.header}>Yellow</div>
            <div className={styles.box} onClick={() => handleOpenModal('Andrew')}>Andrew</div>
            <div className={styles.box} onClick={() => handleOpenModal('McNay')}>McNay</div>
            <div className={styles.box} onClick={() => handleOpenModal('Jay')}>Jay</div>
          </div>
          <div className={styles.column}>
            <div className={styles.header}>Red</div>
            <div className={styles.box} onClick={() => handleOpenModal('Jarrod')}>Jarrod</div>
            <div className={styles.box} onClick={() => handleOpenModal('Brad')}>Brad</div>
            <div className={styles.box} onClick={() => handleOpenModal('Jason')}>Jason</div>
          </div>
          <div className={styles.column}>
            <div className={styles.header}>Black</div>
            <div className={styles.box} onClick={() => handleOpenModal('Ryan')}>Ryan</div>
            <div className={styles.box} onClick={() => handleOpenModal('Kevin')}>Kevin</div>
            <div className={styles.box} onClick={() => handleOpenModal('Malson')}>Malson</div>
          </div>
        </div>
      </div>

      <Modal name={selectedName} isOpen={isModalOpen} onClose={handleCloseModal} />
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={handleCloseSidebar} 
        onCurrentSeasonClick={handleOpenCurrentSeasonModal} 
        onStartSeasonClick={handleOpenNextSeasonModal}
      />
      <CurrentSeasonModal isOpen={isCurrentSeasonModalOpen} onClose={handleCloseCurrentSeasonModal} />
      <NextSeasonModal 
        isOpen={isNextSeasonModalOpen} 
        onClose={handleCloseNextSeasonModal} 
        onStartSeason={handleStartSeason} 
      />
    </div>
  );
};

About.displayName = 'About';

export default About;


