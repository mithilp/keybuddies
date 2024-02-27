import { db } from "@/utils/firebase";
import {
	arrayUnion,
	collection,
	doc,
	getDoc,
	getDocs,
	query,
	updateDoc,
	where,
} from "firebase/firestore";
import { FaPlus } from "react-icons/fa";

const AddSound = ({ studio }: { studio: string }) => {
	return (
		<button
			onClick={async () => {
				const id = prompt(
					"Tell your friend to give you the code to their sound and enter that below."
				);
				if (id) {
					try {
						const querySnapshot = await getDocs(
							query(collection(db, "sounds"), where("code", "==", id))
						);

						if (querySnapshot.empty) {
							alert("Invalid sound code");
						} else {
							await updateDoc(doc(db, "sounds", querySnapshot.docs[0].id), {
								in: arrayUnion(studio),
							});
						}
					} catch (error) {
						alert("Invalid sound code");
					}
				}
			}}
			className="bg-yellow p-4 w-full rounded-xl border-8 border-black cursor-pointer"
		>
			<div className="flex items-center space-x-2">
				<FaPlus size={32} />
				<div className="text-xl">Add Sound</div>
			</div>
		</button>
	);
};

export default AddSound;
