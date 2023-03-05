import { useState, useRef, useEffect } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";
import "./App.css";
import defAvatar from "./def_avatar.png";
import logo from "./img/zen-logo-450.png";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import ReactDOM from "react-dom/client";

firebase.initializeApp({
  apiKey: "AIzaSyAnrwGeoh0fhzheoXW1JJlC8hhoyjUeFjo",
  authDomain: "zen-chat-c0197.firebaseapp.com",
  projectId: "zen-chat-c0197",
  storageBucket: "zen-chat-c0197.appspot.com",
  messagingSenderId: "858652278742",
  appId: "1:858652278742:web:ed85303b34d4814fddee77",
  measurementId: "G-C555E0N727",
});

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
  const [user] = useAuthState(auth);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="logo" />
        {user ? (
          <>
            <ReturnToLobby /> <SignOut />{" "}
          </>
        ) : (
          ""
        )}
      </header>
      <section
        className={user ? "loggedInSection" : "lobbySection"}
        id="mainSection"
      >
        {user ? <ChatRoom /> : <SignIn />}
      </section>
    </div>
  );
}
// Sign in with Google or Anonymously via Firebase Authentication
function SignIn() {
  const useSignInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  };
  const useSignInAnon = () => {
    auth
      .signInAnonymously()
      .then(() => {})
      .catch((error) => {
        console.log(error.code);
        console.log(error.message);
      });
  };

  return (
    <div className="signInLobby">
      <button className="standardButton" onClick={useSignInWithGoogle}>
        Sign in with Google
      </button>
      <button className="standardButton" onClick={useSignInAnon}>
        Continue Anonymously
      </button>
    </div>
  );
}
// Sign out of Firebase Auth
function SignOut() {
  return (
    auth.currentUser && (
      <button className="standardButton" onClick={() => auth.signOut()}>
        Sign Out
      </button>
    )
  );
}
// In Development - Lobby containing all chats between current UID or that contain current UID in MessageTo Firebase Firestore field
function ReturnToLobby() {
  function GoToLobby() {
    var mainSection = ReactDOM.createRoot(
      document.getElementById("mainSection")
    );
    mainSection.render(<ChatList />);
  }
  return (
    auth.currentUser && (
      <button className="standardButton" onClick={GoToLobby}>
        Chat List
      </button>
    )
  );
}
// In Development - Get list of messages that have the current UID or that contain the current UID in the "MessageTo" Firebase Firestore Field
// Todo - Swap all temporary root.render methods to use React Router as they should
function ChatList() {
  const db = firebase.firestore();
  const messages = db.collection("messages");
  const messages_data = [];
  const messages_data2 = [];
  const [mergedDocs, setMergedDocs] = useState([]);
  const [mergedDocsAll, setMergedDocsAll] = useState([]);
  useEffect(() => {
    messages
      .where("uid", "==", auth.currentUser.uid)
      .where("messageTo", "!=", null)
      .get()
      .then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
          messages_data.push(doc.data());
        });
        messages
          .where("messageTo", "==", auth.currentUser.uid)
          .get()
          .then(function (querySnapshot) {
            querySnapshot.forEach(function (doc) {
              messages_data2.push(doc.data());
            });
            let merged_data = [...messages_data, ...messages_data2];
            setMergedDocsAll(merged_data);
            let theMergedDocuments = [
              ...new Set(merged_data.map((item) => item.uid)),
            ].map((uid) => {
              return merged_data.find((item) => item.uid === uid);
            });
            setMergedDocs(theMergedDocuments);
          });
      });
  }, []);
  return (
    <>
      <main>
        <h3>You have {mergedDocs.length} chats</h3>
        {mergedDocs.map((msg) => (
          <ChatTo key={msg.uid} message={msg} docs={mergedDocsAll} />
        ))}
      </main>
    </>
  );
}
// In Development - Open the click chat from ChatLobby
//Todo - Change root.render to React Router 
function ChatTo(props) {
  const { uid, photoURL, messageTo } = props.message;
  const mergedDocsAll = props.docs;
  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";
  function OpenChat(e) {
    var mainSection = ReactDOM.createRoot(
      document.getElementById("mainSection")
    );
    mainSection.render(
      <ChatRoom uid={uid} messageTo={messageTo} docs={mergedDocsAll} />
    );
  }

  return (
    <div className={`chatToIcon ${messageClass}`} onClick={OpenChat}>
      <img
        className="photoURL messageAvatar"
        alt={uid}
        src={photoURL || defAvatar}
      />
    </div>
  );
}
// The main ChatRoom function which handles both Chat Room and Private Chat
// Todo - Add additional message data between users to Firestore DB to simulate Direct Messages
// Todo - Change any root.render to React Router
function ChatRoom(props) {
  const messagesRef = firestore.collection("messages");
  const query = messagesRef.orderBy("createdAt").limit(50);

  var [messages] = useCollectionData(query, { idField: "id" });

  const [formValue, setFormValue] = useState("");
  const scrollHereRef = useRef();
  const theDocs = props.docs;
  const uid = auth.currentUser.uid;
  const msgTo = props.messageTo;
  if (theDocs != null) {
    var messagesReceived = theDocs.filter(function (item) {
      return item.uid === msgTo && item.messageTo === uid;
    });
    var messagesSent = theDocs.filter(function (item) {
      return item.uid === uid && item.messageTo === msgTo;
    });

    var messages = [...messagesSent, ...messagesReceived];
    var messages = messages.sort(
      (objA, objB) => Number(objA.createdAt) - Number(objB.createdAt)
    );
  }

  const sendMessage = async (e) => {
    e.preventDefault();
    const { uid, photoURL } = auth.currentUser;
    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
    });
    setFormValue("");
    scrollHereRef.current.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <>
      <main>
        {messages &&
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
        <div ref={scrollHereRef}></div>
      </main>
      <form onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </>
  );
}
// Show Each Individual Chat Message By JS Mapping through retrieved Messages (Firebase Firestore Collection Documents)
function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;
  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";
  return (
    <div className={`message message-${messageClass}`}>
      <img
        className="photoURL messageAvatar"
        alt={uid}
        src={photoURL || defAvatar}
      />
      <p>{text}</p>
    </div>
  );
}

export default App;
