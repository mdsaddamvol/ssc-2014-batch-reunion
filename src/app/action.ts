"use server";

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI environment variable is missing");

// Singleton pattern
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
	let globalWithMongo = global as typeof globalThis & {
		_mongoClientPromise?: Promise<MongoClient>;
	};
	if (!globalWithMongo._mongoClientPromise) {
		client = new MongoClient(uri);
		globalWithMongo._mongoClientPromise = client.connect();
	}
	clientPromise = globalWithMongo._mongoClientPromise;
} else {
	client = new MongoClient(uri);
	clientPromise = client.connect();
}

export async function saveRegistration(formData: FormData) {
	try {
		const client = await clientPromise;
		const db = client.db("reunion_db");

		const name = formData.get("name")?.toString().trim();
		const phone = formData.get("phone")?.toString().trim();
		const email = formData.get("email")?.toString().trim() || null;
		const currentCity = formData.get("currentCity")?.toString().trim() || null;
		const maritalStatus = formData.get("maritalStatus")?.toString() as
			| "single"
			| "couple";
		const hasKids = formData.get("hasKids")?.toString() === "yes";

		const kidsUnder4 = hasKids
			? parseInt(formData.get("kidsUnder4")?.toString() || "0", 10)
			: 0;
		const kidsOver4 = hasKids
			? parseInt(formData.get("kidsOver4")?.toString() || "0", 10)
			: 0;
		const totalAttendees = parseInt(
			formData.get("totalAttendees")?.toString() || "1",
			10,
		);

		// Validation
		if (!name || !phone || !maritalStatus) {
			return {
				success: false,
				error: "নাম, ফোন এবং বৈবাহিক অবস্থা অবশ্যই দিতে হবে",
			};
		}

		// Deadline check
		const today = new Date();
		const deadline = new Date("2026-05-30T23:59:59");
		if (today > deadline) {
			return {
				success: false,
				error: "রেজিস্ট্রেশন শেষ তারিখ ৩০ মে অতিক্রম হয়েছে",
			};
		}

		await db.collection("registrations").insertOne({
			name,
			phone,
			email,
			currentCity,
			maritalStatus,
			hasKids,
			kids: hasKids
				? {
						under4: kidsUnder4,
						over4: kidsOver4,
						total: kidsUnder4 + kidsOver4,
					}
				: null,
			totalAttendees,
			registeredAt: new Date(),
		});

		return { success: true };
	} catch (error) {
		console.error("❌ MongoDB Error:", error);
		return {
			success: false,
			error: "রেজিস্ট্রেশন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।",
		};
	}
}
