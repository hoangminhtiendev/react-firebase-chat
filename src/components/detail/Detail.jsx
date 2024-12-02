
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { useChatStore } from "../../lib/chatStore"
import { auth, db } from "../../lib/firebase"
import { useUserStore } from "../../lib/userStore";
import "./detail.css"
import { getDatabase , ref, onValue, set, serverTimestamp, onDisconnect} from "firebase/database";
import { useEffect } from "react";


const Detail = () =>{
    const {chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock} = useChatStore();
    const {currentUser} = useUserStore()
    const handleBlock = async () => {
        if (!user) return;
        const userDocRef = doc(db, "users",  currentUser.id)
        try {
            await updateDoc(userDocRef, {
                blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
            })
            changeBlock()
        } catch (error) {
            console.log(error)
        }
    }
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
    useEffect(() => {
        trackPresence(); // Start tracking when the user is on this page
    }, []);
    return (
        <div className="detail">
            <div className="user">
                <img src={user?.avatar || "./avatar.png"} alt=""></img>
                <h2>{user?.username}</h2>
                <p>Lorem ipsum dolor sit amet .</p>
            </div>
            <div className="info">
            <div className="option">
                <div className="title">
                    <span>Chat Settings</span>
                    <img src="./arrowUp.png" alt=""/>
                </div>
            </div>
            <div className="option">
                <div className="title">
                    <span>Privacy % help</span>
                    <img src="./arrowUp.png" alt=""/>
                </div>
            </div>
            <div className="option">
                <div className="title">
                    <span>Shared Photos</span>
                    <img src="./arrowDown.png" alt=""/>
                </div>
                <div className="photos">
                    <div className="photoItem">
                        <div className="photoDetail">
   <img src="https://hoangminhtiendev.github.io/photos/pets/goldfish.png" alt=""/>
   <span>phonto_goldfish.png</span>
                    <img src="./download.png" alt="" className="icon"/>
                        </div>
                     
                    </div>
                </div>
            </div>
            <div className="option">
                <div className="title">
                    <span>Shared files</span>
                    <img src="./arrowUp.png" alt=""/>
                </div>
            </div>
            <button onClick={handleBlock}> {
            isCurrentUserBlocked ?
            "You are blocked"
            : isReceiverBlocked
            ? "User blocked"
            :"Block User"}</button>
            <button className = "logout" onClick={handleLogout}>Logout</button>
            {/* <button className = "logout" onClick={() => auth.signOut()}>Logout</button> */}
            </div>
        </div>
    )
}

export default Detail