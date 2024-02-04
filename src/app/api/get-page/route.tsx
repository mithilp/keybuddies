import { db } from "@/utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const studio = searchParams.get("studio") as string;
	const snapshot = await getDoc(doc(db, "studios", studio));
	if (!snapshot.exists()) {
		return new Response(
			JSON.stringify({
				message: "Studio not found",
			}),
			{
				status: 404,
			}
		);
	}
	return new Response(JSON.stringify(snapshot.data()), {
		status: 200,
	});
}
