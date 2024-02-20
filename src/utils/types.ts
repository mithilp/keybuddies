import { Timestamp } from "firebase/firestore";

export type Track = {
	createdAt: Timestamp;
	name: string;
	order: number;
	notes: any[];
	id: string;
};
