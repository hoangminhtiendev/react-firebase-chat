
import "./userInfo.css"
// import { auth, db } from "../../lib/firebase"
import { useUserStore } from "../../../lib/userStore";
import { getDatabase , ref, onValue, set, serverTimestamp, onDisconnect} from "firebase/database";
// import { useEffect } from "react";
import { auth } from "../../../lib/firebase";
import { useEffect } from "react";



const handleLogout = async () => {
    const database = getDatabase();
    const user = auth.currentUser;
    if (!user) {
        return;}
    const userStatusRef = ref(database, `/presence/${user.uid}`);
    await set(userStatusRef, {
        online: false,
        lastActive: Date.now(),
    });

    await auth.signOut();
};

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



const Userinfo = () =>{
    // const {chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock} = useChatStore();
    const {currentUser} = useUserStore();
    useEffect(() => {
        trackPresence(); // Start tracking when the user is on this page
    }, []);
    
    return (
        <div className="userInfo">
            <div className="user">
                <img src={currentUser.avatar || "./avatar.png"} alt=""/>
                <h2>{currentUser.username}</h2>
                <button className = "logout" onClick={handleLogout}>Logout</button>
            </div>
            {/* <div className="icons">
            <img src="./more.png" alt=""/>
            <img src="./video.png" alt=""/>
            <img src="./edit.png" alt=""/>
            </div> */}
        </div>
    )
}

export default Userinfo