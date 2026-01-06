import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

type UserProfile = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

export async function saveUserIfNotExists(user: UserProfile) {
  console.log("Saving user to Firestore:", user.sub);

  const userRef = doc(db, "users", user.sub);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    console.log("User does NOT exist → creating");

    await setDoc(userRef, {
      name: user.name ?? "",
      email: user.email ?? "",
      picture: user.picture ?? "",
      createdAt: serverTimestamp(),
    });

    console.log("User saved");
  } else {
    console.log("User already exists");
  }
}

