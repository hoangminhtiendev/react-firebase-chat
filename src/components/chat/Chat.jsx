import { useEffect, useRef, useState } from "react"
import "./chat.css"
import EmojiPicker from "emoji-picker-react"
import { onSnapshot , doc, updateDoc, arrayUnion, getDoc} from "firebase/firestore"
import { db,auth } from "../../lib/firebase"
import { useChatStore } from "../../lib/chatStore"
import { useUserStore } from "../../lib/userStore"
import upload from "../../lib/upload"
// import { getDatabase } from "firebase/database"
import { getDatabase , ref, onValue, set, serverTimestamp, onDisconnect} from "firebase/database";
const Chat = () =>{
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [lastMessageSeen, setLastMessageSeen] = useState(false);

    const [chat, setChat] = useState({});
    const [img, setImg] = useState({
        file: null,
        url: "",
    });
    const endRef = useRef(null);
    const {chatId, user, isCurrentUserBlocked, isReceiverBlocked} = useChatStore();
    const {currentUser} = useUserStore();
    const handleSend = async() =>{
        if (text === "") return;

        let imgUrl = null

        try {
        if(img.file){
             imgUrl = await upload(img.file)
                    }
            
            await updateDoc(doc(db,"chats",chatId),
        {
            messages:arrayUnion({
                senderId:  currentUser.id,
                text,
                createdAt: new Date(),
                ...(imgUrl && {img: imgUrl}),
            })
        });

        const userIDs = [currentUser.id, user.id];
        userIDs.forEach(async (id) => {
        const userChatsRef = doc(db, "userchats", id)
        const userChatsSnapshot = await getDoc(userChatsRef)
      
        if(userChatsSnapshot.exists()){
            const userChatsData = userChatsSnapshot.data()
            const chatIndex = userChatsData.chats.findIndex((c)=> c.chatId === chatId)
            userChatsData.chats[chatIndex].lastMessage = text;
            userChatsData.chats[chatIndex].isSeen = id === currentUser.id ? true :  false;
            userChatsData.chats[chatIndex].updateAt = Date.now();

            await updateDoc(userChatsRef, {
                chats: userChatsData.chats,
            });

        }
    });
        } catch (error) {
            console.log(error)
        }
        setImg({
            file: null,
            url: "",
        })
        setText("");
    };

    // useEffect(() => {
    //     const unSub = onSnapshot(
    //         doc(db,"userchats",user.id), 
    //         (res) => {
    //             const userChats = res.data();
    //             const chatIndex = userChats.chats.findIndex((c) => c.chatId === chatId)
    //             const seenState = userChats.chats[chatIndex].isSeen;
    //             setChat(seenState);
    //         }
    //         )
         
    //     });
        
    //     return () => {
    //         unSub();
    //     };
    // },[chatId, user.id]);
    useEffect(() => {
        if (!user?.id || !chatId) return;

        const unSub = onSnapshot(doc(db, "userchats", user.id), (res) => {
            try {
                const userChats = res.data();
                if (userChats?.chats) {
                    const chatIndex = userChats.chats.findIndex(
                        (c) => c.chatId === chatId
                    );
                    if (chatIndex !== -1) {
                        const seenState = userChats.chats[chatIndex].isSeen;
                        setLastMessageSeen(seenState);
                    }
                }
            } catch (error) {
                console.error("Error processing user chats data:", error);
            }
        });

        return () => {
            unSub(); // Cleanup listener when the component unmounts or dependencies change
        };
    }, [db, user.id, chatId]); // Ensure all dependencies are included

  useEffect( ()=>{
    endRef.current?.scrollIntoView({behavior: "smooth"})
  },[])
//   AAhDH0UX4avlGsdmvjw1
    useEffect(() => {
        const unSub = onSnapshot(
            doc(db,"chats",chatId), 
            (res) => {
            setChat(res.data());
        });
        
        return () => {
            unSub();
        };
    },[chatId]);
    console.log(chat)
    const handleEmoji = (e) => {
        setText((prev) => prev + e.emoji);
        setOpen(false)
    }
    const handleImg = e => {
        if (e.target.files[0]) {
         setImg({
             file: e.target.files[0],
             url: URL.createObjectURL(e.target.files[0])
         })
     }
     }

     ///START TIMING
     


    const subscribeToPresence = (userId, setStatusCallback) => {
        const db = getDatabase();
        const userStatusRef = ref(db, `/presence/${userId}`);

      

        const unsubscribe = onValue(userStatusRef, (snapshot) => {
            if (snapshot.exists()) {
                const { online, lastActive } = snapshot.val();
                if (online) {
                    setStatusCallback("Online");
                } else {
                    const lastSeen = new Date(lastActive);
                    const now = new Date();
                    const timeDifference = Math.floor((now - lastSeen) / 1000 / 60);
                    // setStatusCallback(`Last seen at ${lastSeen.toLocaleTimeString()}`);
                    setStatusCallback(`Offline. Online ${timeDifference} phút trước`);
                }
            } else {
                setStatusCallback("Offline");
            }
        });
    
        return () => unsubscribe();
    };

    const FriendStatus = (friendId ) => {
        const [status, setStatus] = useState("Loading...");
    
        useEffect(() => {
            const unsubscribe = subscribeToPresence(friendId, setStatus);
    
            return () => unsubscribe(); // Clean up listener
        }, [friendId]);
    
        return <p>Status: {status}</p>;
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

     ///END TIMING








    return (
        <div className="chat">
            <div className="top">
                <div className="user">
                    <img src={user?.avatar ||   "./avatar.png"} alt=""/>
                    <div className="texts">
                        <span>{user?.username}</span>
                        <span>{FriendStatus(user?.id)}</span>
                        {/* <p>Something interesting</p> */}
                    </div>
                </div>
                {/* <div className="icons">
                    <img src="./phone.png" alt=""/>
                    <img src="./video.png" alt=""/>
                    <img src="./info.png" alt=""/>
                </div> */}
            </div>
            <div className="center">
              { chat?.messages?.map ((message) =>   (
                <div className={message.senderId === currentUser?.id ? "message own" : "message"} key={message?.createAt}>
                {message.img && <img src="./avatar.png" alt=""/>}
                <div className="texts">
              {message.img && <img src={message.img} alt="" />}
              <p>{message.text}</p>
              {/* <span>{format(message.createdAt.toDate())}</span> */}
              {/* <span>{`Chat seen status: ${lastMessageSeen}`}</span> */}
              <span>{ message.senderId === currentUser?.id ? lastMessageSeen ? "Seen" : "Sent" : "" }</span>
            </div>
          </div>
        ))}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="" />
            </div>
          </div>
        )}
                <div ref={endRef}></div>
            </div>
            <div className="bottom">
                {/* <div className="icons">
                    <label htmlFor="file">
                <img src="./img.png" alt=""/>
                </label>
                <input type="file" id="file" style={{display: "none"}} onChange={handleImg}/>
                    <img src="./camera.png" alt=""/>
                    <img src="./mic.png" alt=""/>
                </div> */}
                <input type="text" placeholder={isCurrentUserBlocked || isReceiverBlocked ? "You cannot send messages" : "Type a message  ..." }value = {text} onChange={e => setText(e.target.value)}  disabled = {isCurrentUserBlocked || isReceiverBlocked} />
                <div className="emoji">
                    <img src="./emoji.png" alt="" onClick={ () => setOpen(prev => !prev)}/>
                    <div className="picker">
                         <EmojiPicker open = {open} onEmojiClick={handleEmoji}/>
                    </div>
                </div>
                <button className="sendButton" onClick={handleSend} disabled = {isCurrentUserBlocked || isReceiverBlocked}>Send</button>
                
            </div>
        </div>
    )
}

export default Chat