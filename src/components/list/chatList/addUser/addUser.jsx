import { collection, getDocs, query, serverTimestamp, setDoc, where, doc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore"
import "./addUser.css"
import { db } from "../../../../lib/firebase"
import { useState, useEffect } from "react"
import { useUserStore } from "../../../../lib/userStore"
import { ref } from "firebase/storage"
import { onValue } from "firebase/database"
const AddUser = () => {
    const {currentUser} = useUserStore()
    // const [user, setUser] = useState(null)
    const [users, setUsers] = useState([])
    const[input, setInput] = useState("")
    const handleSearch = async (e) =>{
        e.preventDefault()
        const formData = new FormData(e.target)
        const username = formData.get("username")
        // try {
        //     const userRef = collection(db, "users");
        //     const q = query(userRef, where ("username","==", username))
        //     const querySnapShot = await getDocs(q)
        //     if(!querySnapShot.empty){
        //             setUser(querySnapShot.docs[0].data())
        //     }
        // } catch (error) {
        //     console.log(error)
        // }
    }

    //consider to add a check if a chat has been created already before
    const handleAdd = async (user) => {
        const chatRef = collection(db, "chats")
        const userChatRef = collection(db, "userchats")
        try {
            const newChatRef = doc(chatRef)
            await setDoc(newChatRef,{
                    createdAt: serverTimestamp(),
                    messages:[],
                }
            );
            await updateDoc(doc(userChatRef,user.id), {
                chats: arrayUnion({
                    chatId : newChatRef.id,
                    lastMessage : "",
                    receiverId: currentUser.id,
                    updateAt: Date.now(),
                }),
            });

            await updateDoc(doc(userChatRef,currentUser.id), {
                chats: arrayUnion({
                    chatId : newChatRef.id,
                    lastMessage : "",
                    receiverId: user.id,
                    updateAt: Date.now(),
                }),
            });

            console.log("neChatRefid" + newChatRef.id)
        } catch (error) {
            console.log(error)
        }
    }
    useEffect(() => {
        const unSub = onSnapshot(
            collection(db, "users"), // Fetch all documents in the "users" collection
            (snapshot) => {
                const users = snapshot.docs.map((doc) => ({
                    id: doc.id, // Include document ID if needed
                    ...doc.data(), // Spread the document data
                }));
                const filteredUsers = users.filter(user => user.id !== currentUser.id);
                setUsers(filteredUsers); // Set state with filtered users
                // setUsers(users); // Update your state with the array of users
            },
            (error) => {
                console.error("Error fetching users: ", error);
            }
        );
    
        return () => {
            unSub(); // Cleanup subscription on unmount
        };
    }, []);
    // useEffect( () => {
    //     const unSub = onSnapshot(doc(db, "users"), async (res) => {
    //         const items = res.data();
    //         // const promises = items.map( async (item) =>{
    //         //     const userDocRef = doc(db, "users", item.receiverId);
    //         //     const userDocSnap = await getDoc(userDocRef);
    //         //     //to show name avatar of friendds
    //         //     const user = userDocSnap.data()

    //         //     return { ...item, user};
    //         // });
    //         const users = await Promise.all(items)
    //         setUsers(users);
    //     }
    // );
    //     return () =>{
    //         unSub();
    //     };
    // },[currentUser.id] );

    // const allUsers = onValue(ref(db, "/users"), (snapshot) => {
       
    // })
    // console.log(allUsers)
    // console.log(users)
    const searchUsers = users.filter((c) => 
        c.username.toLowerCase().includes(input.toLowerCase())
    );
    return(
        // <input type="text" placeholder="Search" onChange={(e)=>setInput(e.target.value)}/>
        <div className="addUser">
            <form onSubmit={handleSearch}>
                <input type="text" placeholder="Username" name="username" onChange={(e)=>setInput(e.target.value)}/>
                <button>Search</button>
            </form>
            {searchUsers.map ( (user) => (
            <div className="user">
                <div className="detail">
                    <img src={user.avatar || "./avatar.png" }alt=""/>
                    <span>{user.username}</span>
                </div>
                <button onClick={() => handleAdd(user)}>Chat</button>

                {/* onClick={() => handleSelect(chat) */}
            </div>
            ))}
          {
          
          /* orignial
          { user && <div className="user">
                <div className="detail">
                    <img src={user.avatar || "./avatar.png" }alt=""/>
                    <span>{user.username}</span>
                </div>
                <button onClick={handleAdd}>Add User</button>
            </div>}
            example
            {users.map ( (user) => (
            <div className="item" key={chat.chatId} onClick={() => handleSelect(chat) }style = {{backgroundColor : chat?.isSeen ? "transparent" : "5183fe"}}>
                <img src={chat.user.avatar || "./avatar.png"} alt="" />
                <div className="texts">
                    <span>{chat.user.username}</span>
                    <p>{chat.lastMessage || "last message"}</p>
                </div>
            </div>
             ))} */}


        </div>
    )
}

export default AddUser