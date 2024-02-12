'use client'
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth'; // Adjust as per your authentication library
import { auth } from "@/config/firebase.js"
import { getUserData, updateUser, getUserMedia } from '@/api/api'
import { useRouter } from 'next/navigation'
const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
    const router = useRouter()
    const [user, setUser] = useState(null);
    const [data, setData] = useState([]);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        // Subscribe to authentication state changes
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            try {
                if (authUser) {
                    // makes it only run once on first page load
                    if (!hasMounted) {

                        // get data from firestore users collection
                        let FSUserData = await getUserData(authUser);
                        let FSData = {}
                        // if first login, set some user data
                        if (FSUserData === null) {
                            await updateUser(authUser, 'first_login')
                            const newData = await getUserData(authUser);
                            FSData = { role: newData.role, lastLoginTime: newData.lastLoginTime }

                            // else simply get the data
                        } else {
                            FSData = { role: FSUserData.role, lastLoginTime: FSUserData.lastLoginTime }
                        }
                        let userData = {
                            uid: authUser.uid,
                            email: authUser.email,
                            displayName: authUser.displayName,
                            photoURL: authUser.photoURL,
                            role: FSData.role,
                            lastLoginTime: FSData.lastLoginTime,
                        };
                        setUser(userData);

                        // get data
                        const userMediaList = await getUserMedia(authUser.uid);
                        setData(userMediaList);

                        setHasMounted(true);
                    }
                } else {
                    setUser(null);
                    router.push('/auth');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                // Handle error as needed
            }
        });

        // Clean up subscription on unmount
        return () => unsubscribe();
    }, []);

    return (
        <GlobalContext.Provider value={{ user, data, setData }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobalContext = () => useContext(GlobalContext);