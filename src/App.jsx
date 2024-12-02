
import { onAuthStateChanged } from "firebase/auth";
import Chat from "./components/chat/Chat"
import Detail from "./components/detail/Detail"
import List from "./components/list/list"
import Login from "./components/login/login";
import Notification from "./components/notification/Notification";
import { useEffect } from "react";
import {auth } from "../src/lib/firebase"
// import { useUsersStore } from "./lib/userStore";
import { useUserStore } from "./lib/userStore";         
import { useChatStore } from "./lib/chatStore";
import { getDatabase , ref, onValue, set, serverTimestamp, onDisconnect} from "firebase/database";




const App = () => {
  // const user = false;
  
//CHHECK ONLINE OR OFFLINE

const trackPresence = () => {
  const database = getDatabase();
  const user = auth.currentUser;
  if (!user) return;
  const userStatusRef = ref(database, `/presence/${user.uid}`);
  // Monitor connection state
  const connectedRef = ref(database, ".info/connected");
  onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === false) {
          // Client is offline
          return;
      }

      // Set initial presence to `online` and register onDisconnect action
      set(userStatusRef, {
          online: true,
          lastActive: serverTimestamp(),
      });

      onDisconnect(userStatusRef).set({
          online: false,
          lastActive: serverTimestamp(),
      });
      console.log("Check login status: " + userStatusRef )
  });
};

//END OOF CHECKING


  
const {currentUser, isLoading, fetchUserInfo} = useUserStore()
const {chatId} = useChatStore()
//listening to authen state
useEffect(() => {
  const unSub = onAuthStateChanged(auth, (user) => {
   
    if (user) {
      // User is logged in, start tracking their presence
      trackPresence();
  }
  fetchUserInfo(user?.uid);
  });

  return () => {
    unSub();
    // return () => unsubscribe(); // Cleanup listener on unmoun
  };
}, [fetchUserInfo]);
//  useEffect(() => {
//     const unSub = onAuthStateChanged(auth, (user) => {
//       fetchUserInfo(user?.uid);
//     });

//     return () => {
//       unSub();
//     };
//   }, [fetchUserInfo]);



console.log(currentUser)

if (isLoading) return <div className="loading">Loading ...</div>

  return (
    <div className="container">
      {currentUser ? ( 
        <>
        <List />
        {chatId && <Chat />}
        {/* {chatId &&  <Detail />} */}
        </>
      ) : (
      <Login />
    )
  }
  <Notification />
  </div>
  );
};

export default App