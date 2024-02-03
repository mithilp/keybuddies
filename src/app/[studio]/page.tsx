import { db } from "@/utils/firebase";
import { doc, getDoc } from "firebase/firestore";

async function loadRoom(id: string): Promise<Room> {
	const snapshot = await getDoc(doc(db, "studios", id));
	if (!snapshot.exists()) {
		throw new Error("Room not found");
	}
	return { id: id, users: snapshot.data().users } as Room;
}

export default async function Page({ params }: { params: { studio: string } }) {
	const { studio } = params;
	const room = await loadRoom(studio);
	return <div>users: {room.users.toString()}</div>;
}
