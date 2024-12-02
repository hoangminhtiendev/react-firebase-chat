import { create } from "zustand"
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { useUserStore } from "./userStore";

//to use the user uid, change login state (STATE MANAGEMENT)


export const useChatStore = create((set) => ({
    chatId: null,
    user: null,
    isCurrrentUserBlocked: false,
    isReceiverBlocked: false,
    changeChat: (chatId, user) => {
        //get us
        const currentUser= useUserStore.getState().currentUser

        //check if we are blocked
        if (user.blocked.includes(currentUser.id)){
            return set({
            chatId,
            user: null,
            isCurrrentUserBlocked: true,
            isReceiverBlocked: false
        });
        }
  //check if our friend is blocked
  else if (user.blocked.includes(currentUser.id)){
    return set({
    chatId,
    user: user,
    isCurrrentUserBlocked: false,
    isReceiverBlocked: true
});
  }
  else{
    return  set({
    chatId,
    user,
    isCurrrentUserBlocked: false,
    isReceiverBlocked: false
    });
}

},
    changeBlock: () => {
        set(state => ({...state, isReceiverBlocked: !state.isReceiverBlocked}) )
    },
    
  }))